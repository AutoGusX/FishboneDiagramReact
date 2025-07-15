import { FusionManageClient, Workspace, WorkspaceItem } from '../client/fusion-manage-client.js';

export class WorkspaceTools {
  constructor(private client: FusionManageClient) {}

  async listWorkspaces(): Promise<Workspace[]> {
    try {
      return await this.client.listWorkspaces();
    } catch (error) {
      throw new Error(`Failed to list workspaces: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async discoverWorkspaces(): Promise<any> {
    try {
      return await this.client.discoverWorkspaces();
    } catch (error) {
      throw new Error(`Failed to discover workspaces: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getWorkspaceItems(
    workspaceId: number,
    options: {
      page?: number;
      size?: number;
      includeRelationships?: boolean;
    } = {}
  ): Promise<WorkspaceItem[]> {
    try {
      return await this.client.getWorkspaceItems(workspaceId, options);
    } catch (error) {
      throw new Error(`Failed to get workspace items: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchWorkspaceItems(
    workspaceId: number,
    searchCriteria: {
      searchCriterion?: {
        key: string;
        value: string;
        operator?: string;
      }[];
      searchOptions?: {
        searchDeleted?: boolean;
        size?: number;
        page?: number;
      };
    }
  ): Promise<WorkspaceItem[]> {
    try {
      return await this.client.searchWorkspaceItems(workspaceId, searchCriteria);
    } catch (error) {
      throw new Error(`Failed to search workspace items: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getItemDetails(
    workspaceId: number,
    itemId: number,
    includeRelationships: boolean = true
  ): Promise<WorkspaceItem> {
    try {
      return await this.client.getWorkspaceItem(workspaceId, itemId, includeRelationships);
    } catch (error) {
      throw new Error(`Failed to get item details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  extractMetaFieldValue(item: WorkspaceItem, fieldKey: string): string | null {
    const field = item.metaFields.entry.find(entry => entry.key === fieldKey);
    return field ? field.fieldData.value : null;
  }

  findItemsByMetaField(items: WorkspaceItem[], fieldKey: string, searchValue: string): WorkspaceItem[] {
    return items.filter(item => {
      const fieldValue = this.extractMetaFieldValue(item, fieldKey);
      return fieldValue && fieldValue.toLowerCase().includes(searchValue.toLowerCase());
    });
  }

  groupItemsByLifecycleState(items: WorkspaceItem[]): Record<string, WorkspaceItem[]> {
    const groups: Record<string, WorkspaceItem[]> = {};
    
    items.forEach(item => {
      const state = item.details.lifecycleState.stateName;
      if (!groups[state]) {
        groups[state] = [];
      }
      groups[state].push(item);
    });

    return groups;
  }

  getItemSummary(item: WorkspaceItem): any {
    return {
      id: item.id,
      dmsID: item.details.dmsID,
      descriptor: item.details.descriptor,
      lifecycleState: item.details.lifecycleState.stateName,
      lifecycleStatus: item.details.lifecycleStatus,
      owner: item.details.owner.id,
      lastModified: item.details.lastModified,
      version: item.details.version,
      customFields: item.metaFields.entry.reduce((acc, field) => {
        acc[field.key] = field.fieldData.value;
        return acc;
      }, {} as Record<string, string>)
    };
  }
} 