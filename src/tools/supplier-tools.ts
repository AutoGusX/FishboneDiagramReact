import { FusionManageClient, WorkspaceItem } from '../client/fusion-manage-client.js';

export interface SupplierRiskAssessment {
  supplierId: number;
  supplierName: string;
  overallRiskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors: {
    financial: {
      score: number;
      indicators: string[];
      creditRating?: string;
    };
    geographic: {
      score: number;
      countries: string[];
      politicalRisk: number;
      naturalDisasterRisk: number;
    };
    operational: {
      score: number;
      capacityUtilization: number;
      qualityIssues: number;
      deliveryPerformance: number;
    };
    compliance: {
      score: number;
      certifications: string[];
      auditResults: string[];
      violations: string[];
    };
  };
  recommendations: string[];
  lastAssessment: string;
}

export interface SupplierQualityMetrics {
  supplierId: number;
  supplierName: string;
  qualityScore: number;
  metrics: {
    defectRate: number;
    onTimeDelivery: number;
    correctQuantity: number;
    correctSpecification: number;
    customerComplaints: number;
  };
  trends: {
    period: string;
    defectRate: number;
    onTimeDelivery: number;
  }[];
  benchmarkComparison: {
    industryAverage: number;
    topPerformer: number;
    ranking: string;
  };
  improvementAreas: string[];
}

export interface SupplyChainRiskAnalysis {
  totalSuppliers: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  topRisks: {
    risk: string;
    affectedSuppliers: number;
    impact: string;
    mitigation: string;
  }[];
  geographicRisks: {
    region: string;
    suppliers: number;
    riskLevel: string;
    mainRisks: string[];
  }[];
  criticalSuppliers: SupplierRiskAssessment[];
  recommendations: string[];
}

export class SupplierTools {
  constructor(private client: FusionManageClient) {}

  async assessSupplierRisk(
    supplierWorkspaceId: number,
    supplierId: number,
    assessmentOptions: {
      includeFinancial?: boolean;
      includeGeographic?: boolean;
      includeOperational?: boolean;
      includeCompliance?: boolean;
    } = {}
  ): Promise<SupplierRiskAssessment> {
    try {
      const supplier = await this.client.getWorkspaceItem(supplierWorkspaceId, supplierId, true);
      
      // Extract basic supplier information
      const supplierName = supplier.details.descriptor;
      
      // Assess different risk factors
      const financialRisk = await this.assessFinancialRisk(supplier);
      const geographicRisk = await this.assessGeographicRisk(supplier);
      const operationalRisk = await this.assessOperationalRisk(supplier);
      const complianceRisk = await this.assessComplianceRisk(supplier);

      // Calculate overall risk score (weighted average)
      const weights = { financial: 0.3, geographic: 0.2, operational: 0.3, compliance: 0.2 };
      const overallRiskScore = 
        financialRisk.score * weights.financial +
        geographicRisk.score * weights.geographic +
        operationalRisk.score * weights.operational +
        complianceRisk.score * weights.compliance;

      // Determine risk level
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      if (overallRiskScore >= 80) riskLevel = 'CRITICAL';
      else if (overallRiskScore >= 60) riskLevel = 'HIGH';
      else if (overallRiskScore >= 40) riskLevel = 'MEDIUM';

      // Generate recommendations
      const recommendations = this.generateRiskRecommendations(
        riskLevel, financialRisk, geographicRisk, operationalRisk, complianceRisk
      );

      return {
        supplierId,
        supplierName,
        overallRiskScore,
        riskLevel,
        riskFactors: {
          financial: financialRisk,
          geographic: geographicRisk,
          operational: operationalRisk,
          compliance: complianceRisk
        },
        recommendations,
        lastAssessment: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to assess supplier risk: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSupplierQualityMetrics(
    supplierWorkspaceId: number,
    supplierId: number,
    timeframe: {
      startDate?: string;
      endDate?: string;
      period?: 'month' | 'quarter' | 'year';
    } = {}
  ): Promise<SupplierQualityMetrics> {
    try {
      const supplier = await this.client.getWorkspaceItem(supplierWorkspaceId, supplierId, true);
      const supplierName = supplier.details.descriptor;

      // Extract quality metrics from meta fields
      const defectRate = parseFloat(this.extractMetaFieldValue(supplier, 'DEFECT_RATE') || '0');
      const onTimeDelivery = parseFloat(this.extractMetaFieldValue(supplier, 'ON_TIME_DELIVERY') || '0');
      const correctQuantity = parseFloat(this.extractMetaFieldValue(supplier, 'CORRECT_QUANTITY') || '0');
      const correctSpecification = parseFloat(this.extractMetaFieldValue(supplier, 'CORRECT_SPECIFICATION') || '0');
      const customerComplaints = parseFloat(this.extractMetaFieldValue(supplier, 'CUSTOMER_COMPLAINTS') || '0');

      // Calculate overall quality score
      const qualityScore = this.calculateQualityScore({
        defectRate,
        onTimeDelivery,
        correctQuantity,
        correctSpecification,
        customerComplaints
      });

      // Generate trend data (simplified for demo)
      const trends = this.generateQualityTrends(supplier, timeframe.period || 'month');

      // Benchmark comparison
      const benchmarkComparison = this.calculateBenchmarkComparison(qualityScore);

      // Identify improvement areas
      const improvementAreas = this.identifyImprovementAreas({
        defectRate,
        onTimeDelivery,
        correctQuantity,
        correctSpecification,
        customerComplaints
      });

      return {
        supplierId,
        supplierName,
        qualityScore,
        metrics: {
          defectRate,
          onTimeDelivery,
          correctQuantity,
          correctSpecification,
          customerComplaints
        },
        trends,
        benchmarkComparison,
        improvementAreas
      };
    } catch (error) {
      throw new Error(`Failed to get supplier quality metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeSupplyChainRisk(
    supplierWorkspaceId: number,
    options: {
      includeGeographicAnalysis?: boolean;
      includeCriticalityAnalysis?: boolean;
      riskThreshold?: number;
    } = {}
  ): Promise<SupplyChainRiskAnalysis> {
    try {
      const suppliers = await this.client.getWorkspaceItems(supplierWorkspaceId, { size: 1000 });
      const riskAssessments: SupplierRiskAssessment[] = [];

      // Assess risk for each supplier
      for (const supplier of suppliers) {
        try {
          const assessment = await this.assessSupplierRisk(supplierWorkspaceId, supplier.details.dmsID);
          riskAssessments.push(assessment);
        } catch (error) {
          // Continue with other suppliers if one fails
          console.warn(`Failed to assess supplier ${supplier.details.dmsID}: ${error}`);
        }
      }

      // Analyze risk distribution
      const riskDistribution = this.calculateRiskDistribution(riskAssessments);

      // Identify top risks
      const topRisks = this.identifyTopRisks(riskAssessments);

      // Analyze geographic risks
      const geographicRisks = this.analyzeGeographicRisks(riskAssessments);

      // Identify critical suppliers
      const criticalSuppliers = riskAssessments.filter(
        assessment => assessment.riskLevel === 'CRITICAL' || assessment.riskLevel === 'HIGH'
      );

      // Generate supply chain recommendations
      const recommendations = this.generateSupplyChainRecommendations(
        riskDistribution, topRisks, criticalSuppliers
      );

      return {
        totalSuppliers: suppliers.length,
        riskDistribution,
        topRisks,
        geographicRisks,
        criticalSuppliers,
        recommendations
      };
    } catch (error) {
      throw new Error(`Failed to analyze supply chain risk: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async assessFinancialRisk(supplier: WorkspaceItem): Promise<any> {
    const creditRating = this.extractMetaFieldValue(supplier, 'CREDIT_RATING');
    const financialStability = this.extractMetaFieldValue(supplier, 'FINANCIAL_STABILITY');
    const yearlyRevenue = this.extractMetaFieldValue(supplier, 'YEARLY_REVENUE');

    const indicators: string[] = [];
    let score = 20; // Base score

    if (creditRating) {
      const rating = creditRating.toLowerCase();
      if (rating.includes('aaa') || rating.includes('aa')) score += 0;
      else if (rating.includes('a') || rating.includes('bbb')) score += 10;
      else if (rating.includes('bb') || rating.includes('b')) score += 30;
      else score += 50;
    } else {
      score += 20;
      indicators.push('Credit rating not available');
    }

    if (financialStability && financialStability.toLowerCase().includes('poor')) {
      score += 30;
      indicators.push('Poor financial stability reported');
    }

    if (yearlyRevenue && parseFloat(yearlyRevenue) < 1000000) {
      score += 20;
      indicators.push('Low yearly revenue');
    }

    return {
      score: Math.min(100, score),
      indicators,
      creditRating
    };
  }

  private async assessGeographicRisk(supplier: WorkspaceItem): Promise<any> {
    const country = this.extractMetaFieldValue(supplier, 'COUNTRY') || 'Unknown';
    const region = this.extractMetaFieldValue(supplier, 'REGION') || 'Unknown';

    // Simplified risk mapping
    const highRiskCountries = ['country1', 'country2']; // Add actual high-risk countries
    const mediumRiskCountries = ['country3', 'country4'];

    let score = 10; // Base score
    let politicalRisk = 10;
    let naturalDisasterRisk = 10;

    if (highRiskCountries.includes(country.toLowerCase())) {
      score += 40;
      politicalRisk = 80;
    } else if (mediumRiskCountries.includes(country.toLowerCase())) {
      score += 20;
      politicalRisk = 50;
    }

    // Add natural disaster risk based on location
    if (region.toLowerCase().includes('earthquake') || region.toLowerCase().includes('flood')) {
      naturalDisasterRisk = 70;
      score += 20;
    }

    return {
      score: Math.min(100, score),
      countries: [country],
      politicalRisk,
      naturalDisasterRisk
    };
  }

  private async assessOperationalRisk(supplier: WorkspaceItem): Promise<any> {
    const capacityUtilization = parseFloat(this.extractMetaFieldValue(supplier, 'CAPACITY_UTILIZATION') || '50');
    const qualityIssues = parseFloat(this.extractMetaFieldValue(supplier, 'QUALITY_ISSUES') || '0');
    const deliveryPerformance = parseFloat(this.extractMetaFieldValue(supplier, 'DELIVERY_PERFORMANCE') || '90');

    let score = 10; // Base score

    // Capacity utilization risk
    if (capacityUtilization > 90) score += 30;
    else if (capacityUtilization > 80) score += 15;

    // Quality issues risk
    score += qualityIssues * 2;

    // Delivery performance risk
    if (deliveryPerformance < 70) score += 40;
    else if (deliveryPerformance < 85) score += 20;

    return {
      score: Math.min(100, score),
      capacityUtilization,
      qualityIssues,
      deliveryPerformance
    };
  }

  private async assessComplianceRisk(supplier: WorkspaceItem): Promise<any> {
    const certifications = this.extractMetaFieldValue(supplier, 'CERTIFICATIONS')?.split(',') || [];
    const auditResults = this.extractMetaFieldValue(supplier, 'AUDIT_RESULTS')?.split(',') || [];
    const violations = this.extractMetaFieldValue(supplier, 'VIOLATIONS')?.split(',') || [];

    let score = 20; // Base score

    // Certifications reduce risk
    const certificationCount = certifications.filter(cert => cert.trim().length > 0).length;
    score -= certificationCount * 5;

    // Violations increase risk
    score += violations.filter(violation => violation.trim().length > 0).length * 15;

    // Poor audit results increase risk
    const poorAudits = auditResults.filter(result => 
      result.toLowerCase().includes('poor') || result.toLowerCase().includes('fail')
    ).length;
    score += poorAudits * 20;

    return {
      score: Math.max(0, Math.min(100, score)),
      certifications: certifications.filter(cert => cert.trim().length > 0),
      auditResults: auditResults.filter(result => result.trim().length > 0),
      violations: violations.filter(violation => violation.trim().length > 0)
    };
  }

  private calculateQualityScore(metrics: any): number {
    const weights = {
      defectRate: 0.3,
      onTimeDelivery: 0.25,
      correctQuantity: 0.2,
      correctSpecification: 0.15,
      customerComplaints: 0.1
    };

    // Convert metrics to scores (0-100)
    const defectScore = Math.max(0, 100 - metrics.defectRate * 10);
    const onTimeScore = metrics.onTimeDelivery;
    const quantityScore = metrics.correctQuantity;
    const specScore = metrics.correctSpecification;
    const complaintsScore = Math.max(0, 100 - metrics.customerComplaints * 5);

    return (
      defectScore * weights.defectRate +
      onTimeScore * weights.onTimeDelivery +
      quantityScore * weights.correctQuantity +
      specScore * weights.correctSpecification +
      complaintsScore * weights.customerComplaints
    );
  }

  private generateQualityTrends(supplier: WorkspaceItem, period: string): any[] {
    // Simplified trend generation for demo
    const months = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06'];
    return months.map(month => ({
      period: month,
      defectRate: Math.random() * 5,
      onTimeDelivery: 85 + Math.random() * 15
    }));
  }

  private calculateBenchmarkComparison(qualityScore: number): any {
    return {
      industryAverage: 75,
      topPerformer: 95,
      ranking: qualityScore >= 90 ? 'Top Tier' : 
               qualityScore >= 75 ? 'Above Average' :
               qualityScore >= 60 ? 'Average' : 'Below Average'
    };
  }

  private identifyImprovementAreas(metrics: any): string[] {
    const areas: string[] = [];

    if (metrics.defectRate > 2) areas.push('Reduce defect rate');
    if (metrics.onTimeDelivery < 90) areas.push('Improve delivery performance');
    if (metrics.correctQuantity < 95) areas.push('Improve quantity accuracy');
    if (metrics.correctSpecification < 95) areas.push('Improve specification compliance');
    if (metrics.customerComplaints > 1) areas.push('Reduce customer complaints');

    return areas.length > 0 ? areas : ['Continue maintaining current performance levels'];
  }

  private calculateRiskDistribution(assessments: SupplierRiskAssessment[]): any {
    return {
      low: assessments.filter(a => a.riskLevel === 'LOW').length,
      medium: assessments.filter(a => a.riskLevel === 'MEDIUM').length,
      high: assessments.filter(a => a.riskLevel === 'HIGH').length,
      critical: assessments.filter(a => a.riskLevel === 'CRITICAL').length
    };
  }

  private identifyTopRisks(assessments: SupplierRiskAssessment[]): any[] {
    // Simplified risk identification
    return [
      {
        risk: 'Geographic concentration',
        affectedSuppliers: Math.floor(assessments.length * 0.3),
        impact: 'High',
        mitigation: 'Diversify supplier base geographically'
      },
      {
        risk: 'Financial instability',
        affectedSuppliers: Math.floor(assessments.length * 0.15),
        impact: 'Medium',
        mitigation: 'Monitor financial health and establish backup suppliers'
      }
    ];
  }

  private analyzeGeographicRisks(assessments: SupplierRiskAssessment[]): any[] {
    // Simplified geographic analysis
    return [
      {
        region: 'Asia Pacific',
        suppliers: Math.floor(assessments.length * 0.6),
        riskLevel: 'Medium',
        mainRisks: ['Natural disasters', 'Political instability']
      },
      {
        region: 'Europe',
        suppliers: Math.floor(assessments.length * 0.25),
        riskLevel: 'Low',
        mainRisks: ['Regulatory changes']
      }
    ];
  }

  private generateRiskRecommendations(
    riskLevel: string,
    financial: any,
    geographic: any,
    operational: any,
    compliance: any
  ): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
      recommendations.push('Consider alternative suppliers');
      recommendations.push('Implement enhanced monitoring');
    }

    if (financial.score > 50) {
      recommendations.push('Monitor financial stability closely');
    }

    if (geographic.score > 50) {
      recommendations.push('Assess geographic risk mitigation strategies');
    }

    if (operational.score > 50) {
      recommendations.push('Review operational capacity and performance');
    }

    if (compliance.score > 50) {
      recommendations.push('Address compliance issues and violations');
    }

    return recommendations.length > 0 ? recommendations : ['Continue regular monitoring'];
  }

  private generateSupplyChainRecommendations(
    riskDistribution: any,
    topRisks: any[],
    criticalSuppliers: SupplierRiskAssessment[]
  ): string[] {
    const recommendations: string[] = [];

    if (criticalSuppliers.length > 0) {
      recommendations.push(`Address ${criticalSuppliers.length} critical risk suppliers immediately`);
    }

    if (riskDistribution.high + riskDistribution.critical > riskDistribution.low + riskDistribution.medium) {
      recommendations.push('Overall supply chain risk is high - consider strategic diversification');
    }

    topRisks.forEach(risk => {
      recommendations.push(`Mitigate ${risk.risk}: ${risk.mitigation}`);
    });

    return recommendations.length > 0 ? recommendations : ['Supply chain risk is well managed'];
  }

  private extractMetaFieldValue(item: WorkspaceItem, fieldKey: string): string | null {
    const field = item.metaFields.entry.find(entry => entry.key === fieldKey);
    return field ? field.fieldData.value : null;
  }
} 