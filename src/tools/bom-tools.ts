import { FusionManageClient, BOMItem, WorkspaceItem } from '../client/fusion-manage-client.js';

export interface ComplianceResult {
  componentId: number;
  partNumber: string;
  description: string;
  compliance: {
    rohs: {
      compliant: boolean;
      status: 'COMPLIANT' | 'NON_COMPLIANT' | 'UNKNOWN' | 'EXEMPT';
      violations: string[];
      exemptions: string[];
      lastChecked?: string;
    };
    reach: {
      compliant: boolean;
      status: 'COMPLIANT' | 'NON_COMPLIANT' | 'UNKNOWN';
      svhcSubstances: string[];
      concentrationLevel?: number;
      lastChecked?: string;
    };
    conflictMinerals: {
      compliant: boolean;
      status: 'COMPLIANT' | 'NON_COMPLIANT' | 'UNKNOWN' | 'DRC_FREE';
      minerals: {
        tin: boolean;
        tungsten: boolean;
        tantalum: boolean;
        gold: boolean;
      };
      supplierDeclaration?: string;
      lastChecked?: string;
    };
  };
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  supplier: {
    name: string;
    complianceRating?: number;
    certifications: string[];
  };
}

export interface BOMComplianceAnalysis {
  totalComponents: number;
  complianceOverview: {
    rohs: {
      compliant: number;
      nonCompliant: number;
      unknown: number;
      complianceRate: number;
    };
    reach: {
      compliant: number;
      nonCompliant: number;
      unknown: number;
      complianceRate: number;
    };
    conflictMinerals: {
      compliant: number;
      nonCompliant: number;
      unknown: number;
      complianceRate: number;
    };
  };
  riskComponents: ComplianceResult[];
  supplierRisks: {
    supplier: string;
    riskLevel: string;
    components: number;
    issues: string[];
  }[];
  recommendations: string[];
}

export class BOMTools {
  constructor(private client: FusionManageClient) {}

  async getBOMStructure(
    partsWorkspaceId: number,
    parentItemId: number,
    options: {
      depth?: number;
      includeCosts?: boolean;
      includeSupplierInfo?: boolean;
    } = {}
  ): Promise<BOMItem[]> {
    try {
      const bomOptions = {
        depth: options.depth || 5,
        filterDeleted: true,
        indexOnly: false,
        rootItem: true
      };

      return await this.client.getItemBOM(partsWorkspaceId, parentItemId, bomOptions);
    } catch (error) {
      throw new Error(`Failed to get BOM structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getBOMCompliance(
    partsWorkspaceId: number,
    parentItemId: number,
    options: {
      includeSubAssemblies?: boolean;
      regulationTypes?: ('rohs' | 'reach' | 'conflictMinerals')[];
    } = {}
  ): Promise<BOMComplianceAnalysis> {
    try {
      const bomItems = await this.getBOMStructure(partsWorkspaceId, parentItemId, {
        includeSupplierInfo: true
      });

      const complianceResults: ComplianceResult[] = [];

      for (const bomItem of bomItems) {
        const itemDetails = await this.client.getWorkspaceItem(
          partsWorkspaceId,
          bomItem['bom-item'].dmsID,
          true
        );

        const compliance = await this.checkComponentCompliance(itemDetails);
        complianceResults.push(compliance);
      }

      return this.analyzeBOMCompliance(complianceResults);
    } catch (error) {
      throw new Error(`Failed to get BOM compliance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateBOMRegulations(
    partsWorkspaceId: number,
    parentItemId: number,
    targetRegulations: {
      rohs?: boolean;
      reach?: boolean;
      conflictMinerals?: boolean;
      customRegulations?: string[];
    }
  ): Promise<any> {
    try {
      const bomItems = await this.getBOMStructure(partsWorkspaceId, parentItemId);
      const validationResults = {
        overall: {
          compliant: true,
          violations: [] as string[],
          warnings: [] as string[]
        },
        components: [] as any[],
        regulations: targetRegulations
      };

      for (const bomItem of bomItems) {
        const itemDetails = await this.client.getWorkspaceItem(
          partsWorkspaceId,
          bomItem['bom-item'].dmsID,
          true
        );

        const componentValidation = await this.validateComponentRegulations(
          itemDetails,
          targetRegulations
        );

        validationResults.components.push(componentValidation);

        if (!componentValidation.compliant) {
          validationResults.overall.compliant = false;
          validationResults.overall.violations.push(
            ...componentValidation.violations
          );
        }

        validationResults.overall.warnings.push(
          ...componentValidation.warnings
        );
      }

      return validationResults;
    } catch (error) {
      throw new Error(`Failed to validate BOM regulations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async checkComponentCompliance(item: WorkspaceItem): Promise<ComplianceResult> {
    const partNumber = item.details.descriptor;
    const description = this.extractMetaFieldValue(item, 'DESCRIPTION') || item.description || '';

    // Extract compliance data from meta fields
    const rohsStatus = this.extractMetaFieldValue(item, 'ROHS_STATUS') || 'UNKNOWN';
    const reachStatus = this.extractMetaFieldValue(item, 'REACH_STATUS') || 'UNKNOWN';
    const conflictMineralsStatus = this.extractMetaFieldValue(item, 'CONFLICT_MINERALS_STATUS') || 'UNKNOWN';

    // Extract supplier information
    const supplierName = this.extractMetaFieldValue(item, 'SUPPLIER') || 
                        this.extractMetaFieldValue(item, 'MANUFACTURER') || 'Unknown';
    
    const supplierCertifications = this.extractMetaFieldValue(item, 'SUPPLIER_CERTIFICATIONS')?.split(',') || [];

    // Analyze RoHS compliance
    const rohsCompliance = this.analyzeRoHSCompliance(item, rohsStatus);
    
    // Analyze REACH compliance
    const reachCompliance = this.analyzeREACHCompliance(item, reachStatus);
    
    // Analyze Conflict Minerals compliance
    const conflictMineralsCompliance = this.analyzeConflictMineralsCompliance(item, conflictMineralsStatus);

    // Determine overall risk level
    const riskLevel = this.calculateComponentRiskLevel(rohsCompliance, reachCompliance, conflictMineralsCompliance);

    return {
      componentId: item.details.dmsID,
      partNumber,
      description,
      compliance: {
        rohs: rohsCompliance,
        reach: reachCompliance,
        conflictMinerals: conflictMineralsCompliance
      },
      riskLevel,
      supplier: {
        name: supplierName,
        complianceRating: this.calculateSupplierRating(supplierCertifications),
        certifications: supplierCertifications
      }
    };
  }

  private analyzeRoHSCompliance(item: WorkspaceItem, status: string): any {
    const rohsSubstances = ['lead', 'mercury', 'cadmium', 'hexavalent chromium', 'pbb', 'pbde'];
    const violations: string[] = [];
    const exemptions: string[] = [];

    // Check for RoHS substances in material composition
    const materialComposition = this.extractMetaFieldValue(item, 'MATERIAL_COMPOSITION') || '';
    
    rohsSubstances.forEach(substance => {
      if (materialComposition.toLowerCase().includes(substance)) {
        violations.push(`Contains ${substance}`);
      }
    });

    // Check for exemptions
    const exemptionField = this.extractMetaFieldValue(item, 'ROHS_EXEMPTION');
    if (exemptionField) {
      exemptions.push(exemptionField);
    }

    let compliant = true;
    let complianceStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'UNKNOWN' | 'EXEMPT' = 'COMPLIANT';

    if (violations.length > 0 && exemptions.length === 0) {
      compliant = false;
      complianceStatus = 'NON_COMPLIANT';
    } else if (exemptions.length > 0) {
      complianceStatus = 'EXEMPT';
    } else if (status.toUpperCase() === 'UNKNOWN') {
      complianceStatus = 'UNKNOWN';
    }

    return {
      compliant,
      status: complianceStatus,
      violations,
      exemptions,
      lastChecked: this.extractMetaFieldValue(item, 'ROHS_LAST_CHECKED')
    };
  }

  private analyzeREACHCompliance(item: WorkspaceItem, status: string): any {
    const svhcSubstances: string[] = [];
    let concentrationLevel = 0;

    // Extract SVHC information
    const svhcData = this.extractMetaFieldValue(item, 'SVHC_SUBSTANCES');
    if (svhcData) {
      svhcSubstances.push(...svhcData.split(',').map(s => s.trim()));
    }

    const concentrationData = this.extractMetaFieldValue(item, 'SVHC_CONCENTRATION');
    if (concentrationData) {
      concentrationLevel = parseFloat(concentrationData) || 0;
    }

    const compliant = svhcSubstances.length === 0 || concentrationLevel < 0.1; // 0.1% threshold
    let complianceStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'UNKNOWN' = compliant ? 'COMPLIANT' : 'NON_COMPLIANT';

    if (status.toUpperCase() === 'UNKNOWN') {
      complianceStatus = 'UNKNOWN';
    }

    return {
      compliant,
      status: complianceStatus,
      svhcSubstances,
      concentrationLevel,
      lastChecked: this.extractMetaFieldValue(item, 'REACH_LAST_CHECKED')
    };
  }

  private analyzeConflictMineralsCompliance(item: WorkspaceItem, status: string): any {
    const minerals = {
      tin: this.checkMineralPresence(item, 'tin'),
      tungsten: this.checkMineralPresence(item, 'tungsten'),
      tantalum: this.checkMineralPresence(item, 'tantalum'),
      gold: this.checkMineralPresence(item, 'gold')
    };

    const hasConflictMinerals = Object.values(minerals).some(present => present);
    const supplierDeclaration = this.extractMetaFieldValue(item, 'CONFLICT_MINERALS_DECLARATION');

    let compliant = true;
    let complianceStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'UNKNOWN' | 'DRC_FREE' = 'COMPLIANT';

    if (hasConflictMinerals) {
      if (supplierDeclaration && supplierDeclaration.toLowerCase().includes('drc-free')) {
        complianceStatus = 'DRC_FREE';
      } else if (!supplierDeclaration) {
        compliant = false;
        complianceStatus = 'UNKNOWN';
      } else {
        complianceStatus = 'COMPLIANT';
      }
    }

    if (status.toUpperCase() === 'NON_COMPLIANT') {
      compliant = false;
      complianceStatus = 'NON_COMPLIANT';
    }

    return {
      compliant,
      status: complianceStatus,
      minerals,
      supplierDeclaration,
      lastChecked: this.extractMetaFieldValue(item, 'CONFLICT_MINERALS_LAST_CHECKED')
    };
  }

  private checkMineralPresence(item: WorkspaceItem, mineral: string): boolean {
    const materialComposition = this.extractMetaFieldValue(item, 'MATERIAL_COMPOSITION') || '';
    const partDescription = item.description || '';
    
    return materialComposition.toLowerCase().includes(mineral) ||
           partDescription.toLowerCase().includes(mineral);
  }

  private calculateComponentRiskLevel(rohs: any, reach: any, conflictMinerals: any): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    let riskScore = 0;

    // RoHS risk scoring
    if (!rohs.compliant) riskScore += 3;
    else if (rohs.status === 'UNKNOWN') riskScore += 2;
    else if (rohs.status === 'EXEMPT') riskScore += 1;

    // REACH risk scoring
    if (!reach.compliant) riskScore += 3;
    else if (reach.status === 'UNKNOWN') riskScore += 2;
    else if (reach.svhcSubstances.length > 0) riskScore += 1;

    // Conflict Minerals risk scoring
    if (!conflictMinerals.compliant) riskScore += 3;
    else if (conflictMinerals.status === 'UNKNOWN') riskScore += 2;
    else if (Object.values(conflictMinerals.minerals).some((present: any) => present)) riskScore += 1;

    if (riskScore >= 7) return 'CRITICAL';
    if (riskScore >= 4) return 'HIGH';
    if (riskScore >= 2) return 'MEDIUM';
    return 'LOW';
  }

  private calculateSupplierRating(certifications: string[]): number {
    const certificationScores: Record<string, number> = {
      'iso14001': 20,
      'iso9001': 15,
      'rohs': 10,
      'reach': 10,
      'iatf16949': 15,
      'conflict_free': 10
    };

    let score = 50; // Base score
    certifications.forEach(cert => {
      const normalizedCert = cert.toLowerCase().replace(/\s+/g, '');
      Object.entries(certificationScores).forEach(([key, value]) => {
        if (normalizedCert.includes(key)) {
          score += value;
        }
      });
    });

    return Math.min(100, score);
  }

  private analyzeBOMCompliance(complianceResults: ComplianceResult[]): BOMComplianceAnalysis {
    const totalComponents = complianceResults.length;

    // Calculate compliance rates
    const rohsStats = this.calculateComplianceStats(complianceResults, 'rohs');
    const reachStats = this.calculateComplianceStats(complianceResults, 'reach');
    const conflictMineralsStats = this.calculateComplianceStats(complianceResults, 'conflictMinerals');

    // Identify risk components
    const riskComponents = complianceResults.filter(result => 
      result.riskLevel === 'HIGH' || result.riskLevel === 'CRITICAL'
    );

    // Analyze supplier risks
    const supplierRisks = this.analyzeSupplierRisks(complianceResults);

    // Generate recommendations
    const recommendations = this.generateRecommendations(complianceResults);

    return {
      totalComponents,
      complianceOverview: {
        rohs: rohsStats,
        reach: reachStats,
        conflictMinerals: conflictMineralsStats
      },
      riskComponents,
      supplierRisks,
      recommendations
    };
  }

  private calculateComplianceStats(results: ComplianceResult[], type: string): any {
    const compliant = results.filter(r => (r.compliance as any)[type].compliant).length;
    const nonCompliant = results.filter(r => !(r.compliance as any)[type].compliant).length;
    const unknown = results.filter(r => (r.compliance as any)[type].status === 'UNKNOWN').length;

    return {
      compliant,
      nonCompliant,
      unknown,
      complianceRate: results.length > 0 ? (compliant / results.length) * 100 : 0
    };
  }

  private analyzeSupplierRisks(results: ComplianceResult[]): any[] {
    const supplierGroups = results.reduce((groups, result) => {
      const supplier = result.supplier.name;
      if (!groups[supplier]) {
        groups[supplier] = [];
      }
      groups[supplier].push(result);
      return groups;
    }, {} as Record<string, ComplianceResult[]>);

    return Object.entries(supplierGroups).map(([supplier, components]) => {
      const riskComponents = components.filter(c => c.riskLevel === 'HIGH' || c.riskLevel === 'CRITICAL');
      const avgRating = components.reduce((sum, c) => sum + (c.supplier.complianceRating || 0), 0) / components.length;
      
      let riskLevel = 'LOW';
      const issues: string[] = [];

      if (riskComponents.length > components.length * 0.5) {
        riskLevel = 'HIGH';
        issues.push('High percentage of non-compliant components');
      } else if (riskComponents.length > 0) {
        riskLevel = 'MEDIUM';
        issues.push('Some non-compliant components');
      }

      if (avgRating < 60) {
        riskLevel = riskLevel === 'HIGH' ? 'HIGH' : 'MEDIUM';
        issues.push('Low supplier compliance rating');
      }

      return {
        supplier,
        riskLevel,
        components: components.length,
        issues
      };
    });
  }

  private generateRecommendations(results: ComplianceResult[]): string[] {
    const recommendations: string[] = [];
    
    const highRiskComponents = results.filter(r => r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL');
    if (highRiskComponents.length > 0) {
      recommendations.push(`Review ${highRiskComponents.length} high-risk components for compliance issues`);
    }

    const unknownComponents = results.filter(r => 
      r.compliance.rohs.status === 'UNKNOWN' ||
      r.compliance.reach.status === 'UNKNOWN' ||
      r.compliance.conflictMinerals.status === 'UNKNOWN'
    );
    if (unknownComponents.length > 0) {
      recommendations.push(`Obtain compliance documentation for ${unknownComponents.length} components with unknown status`);
    }

    const lowRatingSuppliers = results.filter(r => (r.supplier.complianceRating || 0) < 60);
    if (lowRatingSuppliers.length > 0) {
      recommendations.push('Work with suppliers to improve compliance ratings and certifications');
    }

    if (recommendations.length === 0) {
      recommendations.push('BOM compliance is good. Continue regular monitoring and updates.');
    }

    return recommendations;
  }

  private async validateComponentRegulations(item: WorkspaceItem, regulations: any): Promise<any> {
    const violations: string[] = [];
    const warnings: string[] = [];
    let compliant = true;

    if (regulations.rohs) {
      const rohsStatus = this.extractMetaFieldValue(item, 'ROHS_STATUS');
      if (rohsStatus === 'NON_COMPLIANT') {
        violations.push(`RoHS violation in ${item.details.descriptor}`);
        compliant = false;
      } else if (!rohsStatus || rohsStatus === 'UNKNOWN') {
        warnings.push(`RoHS status unknown for ${item.details.descriptor}`);
      }
    }

    if (regulations.reach) {
      const reachStatus = this.extractMetaFieldValue(item, 'REACH_STATUS');
      if (reachStatus === 'NON_COMPLIANT') {
        violations.push(`REACH violation in ${item.details.descriptor}`);
        compliant = false;
      } else if (!reachStatus || reachStatus === 'UNKNOWN') {
        warnings.push(`REACH status unknown for ${item.details.descriptor}`);
      }
    }

    if (regulations.conflictMinerals) {
      const cmStatus = this.extractMetaFieldValue(item, 'CONFLICT_MINERALS_STATUS');
      if (cmStatus === 'NON_COMPLIANT') {
        violations.push(`Conflict minerals violation in ${item.details.descriptor}`);
        compliant = false;
      } else if (!cmStatus || cmStatus === 'UNKNOWN') {
        warnings.push(`Conflict minerals status unknown for ${item.details.descriptor}`);
      }
    }

    return {
      componentId: item.details.dmsID,
      partNumber: item.details.descriptor,
      compliant,
      violations,
      warnings
    };
  }

  private extractMetaFieldValue(item: WorkspaceItem, fieldKey: string): string | null {
    const field = item.metaFields.entry.find(entry => entry.key === fieldKey);
    return field ? field.fieldData.value : null;
  }
} 