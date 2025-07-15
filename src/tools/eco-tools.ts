import { FusionManageClient, WorkspaceItem } from '../client/fusion-manage-client.js';

export interface ECOAnalysis {
  totalECOs: number;
  ecosByState: Record<string, number>;
  ecosByType: Record<string, number>;
  trendsOverTime: {
    period: string;
    count: number;
    avgDuration?: number;
  }[];
  topReasons: {
    reason: string;
    count: number;
  }[];
  criticalECOs: WorkspaceItem[];
  performanceMetrics: {
    avgProcessingTime: number;
    completionRate: number;
    rejectRate: number;
  };
}

export class ECOTools {
  constructor(private client: FusionManageClient) {}

  async listECOs(
    ecoWorkspaceId: number,
    options: {
      page?: number;
      size?: number;
      includeRelationships?: boolean;
    } = {}
  ): Promise<WorkspaceItem[]> {
    try {
      return await this.client.getWorkspaceItems(ecoWorkspaceId, options);
    } catch (error) {
      throw new Error(`Failed to list ECOs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getECODetails(
    ecoWorkspaceId: number,
    ecoId: number,
    includeRelationships: boolean = true
  ): Promise<WorkspaceItem> {
    try {
      return await this.client.getWorkspaceItem(ecoWorkspaceId, ecoId, includeRelationships);
    } catch (error) {
      throw new Error(`Failed to get ECO details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchECOs(
    ecoWorkspaceId: number,
    searchParams: {
      reason?: string;
      priority?: string;
      state?: string;
      assignee?: string;
      dateRange?: {
        start: string;
        end: string;
      };
      impactLevel?: string;
    }
  ): Promise<WorkspaceItem[]> {
    try {
      const searchCriteria: any = {
        searchCriterion: [],
        searchOptions: {
          searchDeleted: false,
          size: 1000
        }
      };

      if (searchParams.reason) {
        searchCriteria.searchCriterion.push({
          key: 'ECO_REASON',
          value: searchParams.reason,
          operator: 'CONTAINS'
        });
      }

      if (searchParams.priority) {
        searchCriteria.searchCriterion.push({
          key: 'PRIORITY',
          value: searchParams.priority,
          operator: 'EQUALS'
        });
      }

      if (searchParams.state) {
        searchCriteria.searchCriterion.push({
          key: 'LIFECYCLE_STATE',
          value: searchParams.state,
          operator: 'EQUALS'
        });
      }

      if (searchParams.assignee) {
        searchCriteria.searchCriterion.push({
          key: 'ASSIGNEE',
          value: searchParams.assignee,
          operator: 'CONTAINS'
        });
      }

      if (searchParams.impactLevel) {
        searchCriteria.searchCriterion.push({
          key: 'IMPACT_LEVEL',
          value: searchParams.impactLevel,
          operator: 'EQUALS'
        });
      }

      return await this.client.searchWorkspaceItems(ecoWorkspaceId, searchCriteria);
    } catch (error) {
      throw new Error(`Failed to search ECOs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeECOTrends(
    ecoWorkspaceId: number,
    analysisOptions: {
      timeFrame?: 'last30days' | 'last90days' | 'lastyear' | 'all';
      groupBy?: 'month' | 'quarter' | 'week';
      includeMetrics?: boolean;
    } = {}
  ): Promise<ECOAnalysis> {
    try {
      const allECOs = await this.listECOs(ecoWorkspaceId, { size: 10000 });
      
      const analysis: ECOAnalysis = {
        totalECOs: allECOs.length,
        ecosByState: this.groupECOsByState(allECOs),
        ecosByType: this.groupECOsByType(allECOs),
        trendsOverTime: this.calculateTimeTrends(allECOs, analysisOptions.groupBy || 'month'),
        topReasons: this.analyzeTopReasons(allECOs),
        criticalECOs: this.identifyCriticalECOs(allECOs),
        performanceMetrics: this.calculatePerformanceMetrics(allECOs)
      };

      return analysis;
    } catch (error) {
      throw new Error(`Failed to analyze ECO trends: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private groupECOsByState(ecos: WorkspaceItem[]): Record<string, number> {
    const groups: Record<string, number> = {};
    
    ecos.forEach(eco => {
      const state = eco.details.lifecycleState.stateName;
      groups[state] = (groups[state] || 0) + 1;
    });

    return groups;
  }

  private groupECOsByType(ecos: WorkspaceItem[]): Record<string, number> {
    const groups: Record<string, number> = {};
    
    ecos.forEach(eco => {
      const typeField = eco.metaFields.entry.find(field => 
        field.key.toLowerCase().includes('type') || 
        field.key.toLowerCase().includes('category')
      );
      
      const type = typeField ? typeField.fieldData.value : 'Unknown';
      groups[type] = (groups[type] || 0) + 1;
    });

    return groups;
  }

  private calculateTimeTrends(ecos: WorkspaceItem[], groupBy: string): any[] {
    const trends: Record<string, { count: number; totalDuration: number; completed: number }> = {};
    
    ecos.forEach(eco => {
      const createdDate = new Date(eco.details.timeStamp);
      let periodKey: string;

      switch (groupBy) {
        case 'week':
          const weekStart = new Date(createdDate);
          weekStart.setDate(createdDate.getDate() - createdDate.getDay());
          periodKey = weekStart.toISOString().split('T')[0];
          break;
        case 'quarter':
          const quarter = Math.floor(createdDate.getMonth() / 3) + 1;
          periodKey = `${createdDate.getFullYear()}-Q${quarter}`;
          break;
        default: // month
          periodKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!trends[periodKey]) {
        trends[periodKey] = { count: 0, totalDuration: 0, completed: 0 };
      }

      trends[periodKey].count++;

      // Calculate duration if ECO is completed
      if (eco.details.lifecycleState.stateName.toLowerCase().includes('complete') ||
          eco.details.lifecycleState.stateName.toLowerCase().includes('approved')) {
        const lastModified = new Date(eco.details.lastModified);
        const duration = lastModified.getTime() - createdDate.getTime();
        trends[periodKey].totalDuration += duration / (1000 * 60 * 60 * 24); // Convert to days
        trends[periodKey].completed++;
      }
    });

    return Object.entries(trends)
      .map(([period, data]) => ({
        period,
        count: data.count,
        avgDuration: data.completed > 0 ? data.totalDuration / data.completed : undefined
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  private analyzeTopReasons(ecos: WorkspaceItem[]): { reason: string; count: number }[] {
    const reasons: Record<string, number> = {};
    
    ecos.forEach(eco => {
      const reasonField = eco.metaFields.entry.find(field => 
        field.key.toLowerCase().includes('reason') ||
        field.key.toLowerCase().includes('description') ||
        field.key.toLowerCase().includes('purpose')
      );
      
      if (reasonField) {
        const reason = reasonField.fieldData.value || 'Unknown';
        reasons[reason] = (reasons[reason] || 0) + 1;
      }
    });

    return Object.entries(reasons)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private identifyCriticalECOs(ecos: WorkspaceItem[]): WorkspaceItem[] {
    return ecos.filter(eco => {
      const priorityField = eco.metaFields.entry.find(field => 
        field.key.toLowerCase().includes('priority')
      );
      
      const impactField = eco.metaFields.entry.find(field => 
        field.key.toLowerCase().includes('impact')
      );

      const priority = priorityField?.fieldData.value?.toLowerCase() || '';
      const impact = impactField?.fieldData.value?.toLowerCase() || '';

      return priority.includes('high') || 
             priority.includes('critical') || 
             impact.includes('high') ||
             impact.includes('critical');
    });
  }

  private calculatePerformanceMetrics(ecos: WorkspaceItem[]): any {
    const completed = ecos.filter(eco => 
      eco.details.lifecycleState.stateName.toLowerCase().includes('complete') ||
      eco.details.lifecycleState.stateName.toLowerCase().includes('approved')
    );

    const rejected = ecos.filter(eco => 
      eco.details.lifecycleState.stateName.toLowerCase().includes('reject') ||
      eco.details.lifecycleState.stateName.toLowerCase().includes('cancel')
    );

    const totalProcessingTime = completed.reduce((sum, eco) => {
      const created = new Date(eco.details.timeStamp);
      const modified = new Date(eco.details.lastModified);
      return sum + (modified.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    }, 0);

    return {
      avgProcessingTime: completed.length > 0 ? totalProcessingTime / completed.length : 0,
      completionRate: ecos.length > 0 ? (completed.length / ecos.length) * 100 : 0,
      rejectRate: ecos.length > 0 ? (rejected.length / ecos.length) * 100 : 0
    };
  }

  extractECOValue(eco: WorkspaceItem, fieldKey: string): string | null {
    const field = eco.metaFields.entry.find(entry => entry.key === fieldKey);
    return field ? field.fieldData.value : null;
  }

  getECOSummary(eco: WorkspaceItem): any {
    return {
      id: eco.id,
      dmsID: eco.details.dmsID,
      descriptor: eco.details.descriptor,
      state: eco.details.lifecycleState.stateName,
      owner: eco.details.owner.id,
      created: eco.details.timeStamp,
      lastModified: eco.details.lastModified,
      priority: this.extractECOValue(eco, 'PRIORITY'),
      reason: this.extractECOValue(eco, 'ECO_REASON'),
      impactLevel: this.extractECOValue(eco, 'IMPACT_LEVEL'),
      affectedItems: this.extractECOValue(eco, 'AFFECTED_ITEMS')
    };
  }
} 