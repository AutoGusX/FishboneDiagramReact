import fetch from 'node-fetch';

export interface FusionManageConfig {
  clientId: string;
  clientSecret: string;
  tenant: string;
  userId: string;
  baseUrl?: string;
  tokenUrl?: string;
}

export interface AuthToken {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  expires_at: number;
}

export interface Workspace {
  id: number;
  category: string;
  label: string;
  uri: string;
}

export interface WorkspaceItem {
  id: number;
  description: string;
  uri: string;
  details: {
    deleted: boolean;
    descriptor: string;
    dmsID: number;
    versionID: number;
    workspaceID: number;
    version: number;
    timeStamp: string;
    lastModified: string;
    createdByUser: {
      id: string;
      uri: string;
      userNumber: number;
    };
    owner: {
      id: string;
      uri: string;
      userNumber: number;
    };
    lifecycleState: {
      stateID: number;
      stateName: string;
      effectivity: boolean;
    };
    lifecycleStatus: string;
    latest: boolean;
    working: boolean;
    workflowState?: {
      stateId: number;
      stateName: string;
    };
    lastModifiedBy: {
      id: string;
      uri: string;
      userNumber: number;
    };
  };
  metaFields: {
    entry: Array<{
      key: string;
      fieldData: {
        value: string;
        formattedValue?: string;
        label?: string;
        dataType: string;
        selections?: Array<{
          dataType: string;
          label: string;
          formattedValue: string;
          value: string;
        }>;
      };
    }>;
  };
  relations?: {
    entry: Array<{
      key: string;
      value: any;
    }>;
  };
}

export interface BOMItem {
  'bom-item': {
    dmsID: number;
    workspaceType: number;
    workspaceID: number;
    bomDepthLevel: number;
    quantity: number;
    formattedQuantity: string;
    descriptor: string;
    revision: string;
    units: string;
    itemNumber: number;
    assembly: boolean;
    cost: number;
    isPinned: boolean;
    quoteID: number;
    isUsingDefaultQuote: boolean;
    leaf: boolean;
    redlinedCost: number;
    redlineAddition: boolean;
    redlineAgainstVersion: number;
    totalWeight: number;
    lifecycleStatus: string;
    hasSourcing: boolean;
    hasRedlinedSourcing: boolean;
    sourceNamePartNumber?: string;
    fields: {
      entry: Array<{
        key: string;
        fieldData: {
          value: string;
          formattedValue?: string;
          label?: string;
          dataType: string;
        };
      }>;
    };
  };
}

export class FusionManageClient {
  private config: FusionManageConfig;
  private token: AuthToken | null = null;
  private baseUrl: string;
  private tokenUrl: string;

  constructor(config: FusionManageConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || `https://${config.tenant}.autodeskplm360.net/api/rest/v1`;
    this.tokenUrl = config.tokenUrl || 'https://developer.api.autodesk.com/authentication/v2/token';
  }

  async authenticate(): Promise<void> {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', this.config.clientId);
    params.append('client_secret', this.config.clientSecret);
    params.append('scope', 'data:read data:write data:create');

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Authentication failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json() as any;
    this.token = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      expires_at: Date.now() + (data.expires_in * 1000),
    };
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.token || Date.now() >= this.token.expires_at - 60000) {
      await this.authenticate();
    }
  }

  private async makeRequest(endpoint: string, options: any = {}): Promise<any> {
    await this.ensureValidToken();

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.token!.access_token}`,
      'X-Tenant': this.config.tenant,
      'X-User-id': this.config.userId,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async listWorkspaces(): Promise<Workspace[]> {
    const data = await this.makeRequest('/workspaces');
    return data.list.data.map((item: any) => ({
      id: item.data.id,
      category: item.data.category,
      label: item.data.label,
      uri: item.uri,
    }));
  }

  async getWorkspaceItems(workspaceId: number, options: any = {}): Promise<WorkspaceItem[]> {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.size) params.append('size', options.size.toString());
    if (options.includeRelationships !== undefined) {
      params.append('includeRelationships', options.includeRelationships.toString());
    }

    const endpoint = `/workspaces/${workspaceId}/items${params.toString() ? '?' + params.toString() : ''}`;
    const data = await this.makeRequest(endpoint);
    return data.list?.item || [];
  }

  async getWorkspaceItem(workspaceId: number, itemId: number, includeRelationships: boolean = true): Promise<WorkspaceItem> {
    const params = new URLSearchParams();
    params.append('includeRelationships', includeRelationships.toString());
    
    const endpoint = `/workspaces/${workspaceId}/items/${itemId}?${params.toString()}`;
    const data = await this.makeRequest(endpoint);
    return data.item;
  }

  async searchWorkspaceItems(workspaceId: number, searchCriteria: any): Promise<WorkspaceItem[]> {
    const endpoint = `/workspaces/${workspaceId}/items/search`;
    const data = await this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(searchCriteria),
    });
    return data.list?.item || [];
  }

  async getItemBOM(workspaceId: number, itemId: number, options: any = {}): Promise<BOMItem[]> {
    const params = new URLSearchParams();
    if (options.depth) params.append('depth', options.depth.toString());
    if (options.filterDeleted !== undefined) params.append('filterDeleted', options.filterDeleted.toString());
    if (options.indexOnly !== undefined) params.append('indexOnly', options.indexOnly.toString());
    if (options.rootItem !== undefined) params.append('rootItem', options.rootItem.toString());
    if (options.effectiveDate) params.append('effectiveDate', options.effectiveDate);
    if (options.revisionBias) params.append('revisionBias', options.revisionBias);

    const endpoint = `/workspaces/${workspaceId}/items/${itemId}/boms${params.toString() ? '?' + params.toString() : ''}`;
    const data = await this.makeRequest(endpoint);
    return data.list?.data || [];
  }

  async findWorkspaceByName(name: string): Promise<Workspace | null> {
    const workspaces = await this.listWorkspaces();
    return workspaces.find(ws => ws.label.toLowerCase().includes(name.toLowerCase())) || null;
  }

  async discoverWorkspaces(): Promise<any> {
    const workspaces = await this.listWorkspaces();
    const result = { all: workspaces } as any;

    const patterns = {
      eco: ['eco', 'change', 'engineering change', 'change order'],
      asset: ['asset', 'equipment', 'maintenance', 'service'],
      supplier: ['supplier', 'vendor', 'manufacturer'],
      parts: ['parts', 'item', 'component', 'material'],
    };

    for (const [type, keywords] of Object.entries(patterns)) {
      for (const keyword of keywords) {
        const workspace = workspaces.find(ws => 
          ws.label.toLowerCase().includes(keyword) ||
          ws.category.toLowerCase().includes(keyword)
        );
        if (workspace) {
          result[type] = workspace;
          break;
        }
      }
    }

    return result;
  }
} 