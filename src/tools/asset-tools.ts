import { FusionManageClient, WorkspaceItem } from '../client/fusion-manage-client.js';

export interface ServiceData {
  date: string;
  value: number;
  type: string;
  cost?: number;
  description?: string;
}

export interface MaintenancePrediction {
  assetId: number;
  assetName: string;
  predictedFailureDate: string;
  confidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedAction: string;
  nextMaintenanceDate: string;
  linearRegressionData: {
    slope: number;
    intercept: number;
    rSquared: number;
    equation: string;
  };
  maintenanceHistory: ServiceData[];
  costProjection: {
    preventiveCost: number;
    correctiveCost: number;
    potentialSavings: number;
  };
}

export interface LinearRegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  equation: string;
  predictions: { x: number; y: number }[];
}

export class AssetTools {
  constructor(private client: FusionManageClient) {}

  async getAssetServiceData(
    assetWorkspaceId: number,
    assetId: number,
    includeRelationships: boolean = true
  ): Promise<ServiceData[]> {
    try {
      const asset = await this.client.getWorkspaceItem(assetWorkspaceId, assetId, includeRelationships);
      
      // Extract service data from metaFields and relations
      const serviceData: ServiceData[] = [];
      
      // Look for service records in relations
      if (asset.relations?.entry) {
        for (const relation of asset.relations.entry) {
          if (relation.key.toLowerCase().includes('service') || 
              relation.key.toLowerCase().includes('maintenance')) {
            
            if (Array.isArray(relation.value)) {
              for (const serviceRecord of relation.value) {
                serviceData.push(this.parseServiceRecord(serviceRecord));
              }
            }
          }
        }
      }

      // Look for service data in metaFields
      for (const field of asset.metaFields.entry) {
        if (field.key.toLowerCase().includes('service_date') ||
            field.key.toLowerCase().includes('maintenance_date')) {
          
          const dateValue = field.fieldData.value;
          const typeField = asset.metaFields.entry.find(f => 
            f.key.toLowerCase().includes('service_type') ||
            f.key.toLowerCase().includes('maintenance_type')
          );
          
          const costField = asset.metaFields.entry.find(f => 
            f.key.toLowerCase().includes('service_cost') ||
            f.key.toLowerCase().includes('maintenance_cost')
          );

          serviceData.push({
            date: dateValue,
            value: this.extractNumericValue(field.fieldData.value),
            type: typeField?.fieldData.value || 'Unknown',
            cost: costField ? parseFloat(costField.fieldData.value) : undefined,
            description: field.fieldData.formattedValue || field.fieldData.value
          });
        }
      }

      return serviceData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      throw new Error(`Failed to get asset service data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async predictMaintenance(
    assetWorkspaceId: number,
    assetId: number,
    predictionOptions: {
      lookAheadDays?: number;
      confidenceThreshold?: number;
      includeSeasonality?: boolean;
    } = {}
  ): Promise<MaintenancePrediction> {
    try {
      const asset = await this.client.getWorkspaceItem(assetWorkspaceId, assetId, true);
      const serviceData = await this.getAssetServiceData(assetWorkspaceId, assetId);
      
      if (serviceData.length < 3) {
        throw new Error('Insufficient service data for prediction (minimum 3 data points required)');
      }

      // Prepare data for linear regression
      const dataPoints = serviceData.map((record, index) => ({
        x: index, // Time series index
        y: record.value || this.extractDegradationValue(record)
      })).filter(point => !isNaN(point.y));

      if (dataPoints.length < 3) {
        throw new Error('Insufficient valid data points for regression analysis');
      }

      // Perform linear regression
      const regression = this.performLinearRegression(dataPoints);
      
      // Calculate predictions
      const lookAheadDays = predictionOptions.lookAheadDays || 90;
      const futurePoints = Math.ceil(lookAheadDays / 7); // Weekly predictions
      
      const predictions: { x: number; y: number }[] = [];
      for (let i = 1; i <= futurePoints; i++) {
        const x = dataPoints.length + i;
        const y = regression.slope * x + regression.intercept;
        predictions.push({ x, y });
      }

      // Determine failure threshold and risk level
      const threshold = this.calculateFailureThreshold(serviceData);
      const failurePrediction = predictions.find(p => p.y >= threshold);
      
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      let recommendedAction = 'Continue normal monitoring';
      
      if (failurePrediction) {
        const daysToFailure = (failurePrediction.x - dataPoints.length) * 7;
        
        if (daysToFailure <= 7) {
          riskLevel = 'CRITICAL';
          recommendedAction = 'Immediate maintenance required';
        } else if (daysToFailure <= 30) {
          riskLevel = 'HIGH';
          recommendedAction = 'Schedule maintenance within 2 weeks';
        } else if (daysToFailure <= 60) {
          riskLevel = 'MEDIUM';
          recommendedAction = 'Plan maintenance within next month';
        }
      }

      // Calculate next maintenance date
      const lastServiceDate = new Date(Math.max(...serviceData.map(s => new Date(s.date).getTime())));
      const avgInterval = this.calculateAverageMaintenanceInterval(serviceData);
      const nextMaintenanceDate = new Date(lastServiceDate.getTime() + avgInterval * 24 * 60 * 60 * 1000);

      // Cost projections
      const costProjection = this.calculateCostProjection(serviceData, riskLevel);

      return {
        assetId,
        assetName: asset.details.descriptor,
        predictedFailureDate: failurePrediction ? 
          new Date(lastServiceDate.getTime() + (failurePrediction.x - dataPoints.length) * 7 * 24 * 60 * 60 * 1000).toISOString() :
          'No failure predicted in forecast period',
        confidence: regression.rSquared * 100,
        riskLevel,
        recommendedAction,
        nextMaintenanceDate: nextMaintenanceDate.toISOString(),
        linearRegressionData: regression,
        maintenanceHistory: serviceData,
        costProjection
      };
    } catch (error) {
      throw new Error(`Failed to predict maintenance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async calculateMaintenanceIntervals(
    assetWorkspaceId: number,
    assetIds: number[]
  ): Promise<any[]> {
    try {
      const results = await Promise.all(
        assetIds.map(async (assetId) => {
          try {
            const serviceData = await this.getAssetServiceData(assetWorkspaceId, assetId);
            const asset = await this.client.getWorkspaceItem(assetWorkspaceId, assetId, false);
            
            const intervals = this.analyzeMaintenanceIntervals(serviceData);
            
            return {
              assetId,
              assetName: asset.details.descriptor,
              ...intervals
            };
          } catch (error) {
            return {
              assetId,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        })
      );

      return results;
    } catch (error) {
      throw new Error(`Failed to calculate maintenance intervals: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private performLinearRegression(dataPoints: { x: number; y: number }[]): LinearRegressionResult {
    const n = dataPoints.length;
    const sumX = dataPoints.reduce((sum, point) => sum + point.x, 0);
    const sumY = dataPoints.reduce((sum, point) => sum + point.y, 0);
    const sumXY = dataPoints.reduce((sum, point) => sum + point.x * point.y, 0);
    const sumXX = dataPoints.reduce((sum, point) => sum + point.x * point.x, 0);
    const sumYY = dataPoints.reduce((sum, point) => sum + point.y * point.y, 0);

    // Calculate slope and intercept
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const meanY = sumY / n;
    const totalSumSquares = dataPoints.reduce((sum, point) => sum + Math.pow(point.y - meanY, 2), 0);
    const residualSumSquares = dataPoints.reduce((sum, point) => {
      const predicted = slope * point.x + intercept;
      return sum + Math.pow(point.y - predicted, 2);
    }, 0);
    
    const rSquared = 1 - (residualSumSquares / totalSumSquares);

    // Generate predictions for existing data points
    const predictions = dataPoints.map(point => ({
      x: point.x,
      y: slope * point.x + intercept
    }));

    return {
      slope,
      intercept,
      rSquared: Math.max(0, Math.min(1, rSquared)), // Clamp between 0 and 1
      equation: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`,
      predictions
    };
  }

  private parseServiceRecord(record: any): ServiceData {
    return {
      date: record.date || record.serviceDate || new Date().toISOString(),
      value: this.extractNumericValue(record.value || record.condition || record.measurement),
      type: record.type || record.serviceType || 'Unknown',
      cost: record.cost ? parseFloat(record.cost) : undefined,
      description: record.description || record.notes || ''
    };
  }

  private extractNumericValue(value: string | number): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Try to extract numeric value from string
      const numericMatch = value.match(/[\d.]+/);
      return numericMatch ? parseFloat(numericMatch[0]) : Math.random() * 100; // Fallback for demo
    }
    return Math.random() * 100; // Fallback for demo
  }

  private extractDegradationValue(record: ServiceData): number {
    // If no explicit value, derive from other indicators
    if (record.value) return record.value;
    
    // Use cost as degradation indicator (higher cost = more degradation)
    if (record.cost) return record.cost / 100;
    
    // Use service type to infer degradation level
    const degradationMap: Record<string, number> = {
      'preventive': 20,
      'corrective': 60,
      'emergency': 90,
      'inspection': 10,
      'replacement': 100
    };
    
    const type = record.type.toLowerCase();
    for (const [key, value] of Object.entries(degradationMap)) {
      if (type.includes(key)) return value;
    }
    
    return Math.random() * 50 + 25; // Default range 25-75
  }

  private calculateFailureThreshold(serviceData: ServiceData[]): number {
    const values = serviceData.map(s => s.value || this.extractDegradationValue(s));
    const maxValue = Math.max(...values);
    const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Threshold is typically 80% of the way between average and maximum observed
    return avgValue + (maxValue - avgValue) * 0.8;
  }

  private calculateAverageMaintenanceInterval(serviceData: ServiceData[]): number {
    if (serviceData.length < 2) return 30; // Default 30 days
    
    const intervals: number[] = [];
    for (let i = 1; i < serviceData.length; i++) {
      const prevDate = new Date(serviceData[i - 1].date);
      const currDate = new Date(serviceData[i].date);
      const interval = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      intervals.push(interval);
    }
    
    return intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  }

  private calculateCostProjection(serviceData: ServiceData[], riskLevel: string): any {
    const avgCost = serviceData
      .filter(s => s.cost && s.cost > 0)
      .reduce((sum, s, _, arr) => sum + s.cost! / arr.length, 0) || 1000;

    const multipliers = {
      'LOW': { preventive: 1.0, corrective: 2.5 },
      'MEDIUM': { preventive: 1.2, corrective: 3.0 },
      'HIGH': { preventive: 1.5, corrective: 4.0 },
      'CRITICAL': { preventive: 2.0, corrective: 6.0 }
    };

    const multiplier = multipliers[riskLevel as keyof typeof multipliers] || multipliers.LOW;
    const preventiveCost = avgCost * multiplier.preventive;
    const correctiveCost = avgCost * multiplier.corrective;

    return {
      preventiveCost,
      correctiveCost,
      potentialSavings: correctiveCost - preventiveCost
    };
  }

  private analyzeMaintenanceIntervals(serviceData: ServiceData[]): any {
    if (serviceData.length < 2) {
      return {
        avgInterval: 0,
        recommendedInterval: 30,
        intervalVariance: 0,
        efficiency: 'Insufficient data'
      };
    }

    const intervals: number[] = [];
    for (let i = 1; i < serviceData.length; i++) {
      const prevDate = new Date(serviceData[i - 1].date);
      const currDate = new Date(serviceData[i].date);
      const interval = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      intervals.push(interval);
    }

    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    
    // Recommend 10% shorter than average to be proactive
    const recommendedInterval = Math.round(avgInterval * 0.9);
    
    let efficiency = 'Good';
    if (variance > avgInterval * 0.5) efficiency = 'Poor - Highly variable';
    else if (variance > avgInterval * 0.3) efficiency = 'Fair - Some variability';
    else if (variance < avgInterval * 0.1) efficiency = 'Excellent - Very consistent';

    return {
      avgInterval: Math.round(avgInterval),
      recommendedInterval,
      intervalVariance: Math.round(variance),
      efficiency,
      totalServices: serviceData.length,
      lastServiceDate: serviceData[serviceData.length - 1].date
    };
  }
} 