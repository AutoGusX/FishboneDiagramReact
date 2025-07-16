#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ToolSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { config } from 'dotenv';

// Import our tool classes
import { FusionManageClient } from './client/fusion-manage-client.js';
import { WorkspaceTools } from './tools/workspace-tools.js';
import { ECOTools } from './tools/eco-tools.js';
import { AssetTools } from './tools/asset-tools.js';
// import { BOMTools } from './tools/bom-tools.js';
// import { SupplierTools } from './tools/supplier-tools.js';

// Load environment variables
config();

interface FusionManageServer {
  client: FusionManageClient;
  workspaceTools: WorkspaceTools;
  ecoTools: ECOTools;
  assetTools: AssetTools;
  // bomTools: BOMTools;
  // supplierTools: SupplierTools;
}

class FusionManageMCPServer {
  private server: Server;
  private fusionManage: FusionManageServer | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'fusion-manage-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private async initializeFusionManage(): Promise<FusionManageServer> {
    if (this.fusionManage) {
      return this.fusionManage;
    }

    const clientId = process.env.APS_CLIENT_ID;
    const clientSecret = process.env.APS_CLIENT_SECRET;
    const tenant = process.env.FUSION_MANAGE_TENANT;
    const userId = process.env.FUSION_MANAGE_USER_ID;

    console.error(`[MCP Server] Environment check:`);
    console.error(`[MCP Server] - CLIENT_ID: ${clientId ? 'Set' : 'Missing'}`);
    console.error(`[MCP Server] - CLIENT_SECRET: ${clientSecret ? 'Set' : 'Missing'}`);
    console.error(`[MCP Server] - TENANT: ${tenant || 'Missing'}`);
    console.error(`[MCP Server] - USER_ID: ${userId || 'Missing'}`);

    if (!clientId || clientId === 'your_aps_client_id_here') {
      throw new Error('APS_CLIENT_ID is not set in .env file. Please add your actual APS Client ID.');
    }

    if (!clientSecret || clientSecret === 'your_aps_client_secret_here') {
      throw new Error('APS_CLIENT_SECRET is not set in .env file. Please add your actual APS Client Secret.');
    }

    if (!tenant) {
      throw new Error('FUSION_MANAGE_TENANT is not set in .env file.');
    }

    if (!userId) {
      throw new Error('FUSION_MANAGE_USER_ID is not set in .env file.');
    }

    const config = {
      clientId,
      clientSecret,
      tenant,
      userId,
      debug: true, // Enable debug mode
    };

    const client = new FusionManageClient(config);
    
    this.fusionManage = {
      client,
      workspaceTools: new WorkspaceTools(client),
      ecoTools: new ECOTools(client),
      assetTools: new AssetTools(client),
      // bomTools: new BOMTools(client),
      // supplierTools: new SupplierTools(client),
    };

    return this.fusionManage;
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Workspace Tools
          {
            name: 'list_workspaces',
            description: 'List all available workspaces in Fusion Manage',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'discover_workspaces',
            description: 'Automatically discover and categorize workspaces (ECO, Asset, Supplier, Parts)',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_workspace_items',
            description: 'Get items from a specific workspace',
            inputSchema: {
              type: 'object',
              properties: {
                workspaceId: {
                  type: 'number',
                  description: 'The workspace ID to get items from',
                },
                page: {
                  type: 'number',
                  description: 'Page number for pagination (optional)',
                },
                size: {
                  type: 'number',
                  description: 'Number of items per page (optional)',
                },
                includeRelationships: {
                  type: 'boolean',
                  description: 'Whether to include relationship data (optional)',
                },
              },
              required: ['workspaceId'],
            },
          },
          {
            name: 'search_workspace_items',
            description: 'Search for items in a workspace using criteria',
            inputSchema: {
              type: 'object',
              properties: {
                workspaceId: {
                  type: 'number',
                  description: 'The workspace ID to search in',
                },
                searchCriteria: {
                  type: 'object',
                  description: 'Search criteria object with searchCriterion array and searchOptions',
                },
              },
              required: ['workspaceId', 'searchCriteria'],
            },
          },
          {
            name: 'get_item_details',
            description: 'Get detailed information about a specific item',
            inputSchema: {
              type: 'object',
              properties: {
                workspaceId: {
                  type: 'number',
                  description: 'The workspace ID containing the item',
                },
                itemId: {
                  type: 'number',
                  description: 'The item ID to get details for',
                },
                includeRelationships: {
                  type: 'boolean',
                  description: 'Whether to include relationship data (optional)',
                },
              },
              required: ['workspaceId', 'itemId'],
            },
          },
          
          // ECO Tools
          {
            name: 'list_ecos',
            description: 'List Engineering Change Orders (ECOs) from the ECO workspace',
            inputSchema: {
              type: 'object',
              properties: {
                ecoWorkspaceId: {
                  type: 'number',
                  description: 'The ECO workspace ID',
                },
                page: {
                  type: 'number',
                  description: 'Page number for pagination (optional)',
                },
                size: {
                  type: 'number',
                  description: 'Number of ECOs per page (optional)',
                },
              },
              required: ['ecoWorkspaceId'],
            },
          },
          {
            name: 'get_eco_details',
            description: 'Get detailed information about a specific ECO',
            inputSchema: {
              type: 'object',
              properties: {
                ecoWorkspaceId: {
                  type: 'number',
                  description: 'The ECO workspace ID',
                },
                ecoId: {
                  type: 'number',
                  description: 'The ECO item ID',
                },
                includeRelationships: {
                  type: 'boolean',
                  description: 'Whether to include relationship data (optional)',
                },
              },
              required: ['ecoWorkspaceId', 'ecoId'],
            },
          },
          {
            name: 'search_ecos',
            description: 'Search ECOs by various criteria (reason, priority, state, assignee, etc.)',
            inputSchema: {
              type: 'object',
              properties: {
                ecoWorkspaceId: {
                  type: 'number',
                  description: 'The ECO workspace ID',
                },
                searchParams: {
                  type: 'object',
                  properties: {
                    reason: { type: 'string', description: 'ECO reason to search for' },
                    priority: { type: 'string', description: 'ECO priority level' },
                    state: { type: 'string', description: 'ECO lifecycle state' },
                    assignee: { type: 'string', description: 'ECO assignee' },
                    impactLevel: { type: 'string', description: 'ECO impact level' },
                    dateRange: {
                      type: 'object',
                      properties: {
                        start: { type: 'string', description: 'Start date (ISO format)' },
                        end: { type: 'string', description: 'End date (ISO format)' },
                      },
                    },
                  },
                },
              },
              required: ['ecoWorkspaceId', 'searchParams'],
            },
          },
          {
            name: 'analyze_eco_trends',
            description: 'Perform comprehensive analysis of ECO trends and patterns',
            inputSchema: {
              type: 'object',
              properties: {
                ecoWorkspaceId: {
                  type: 'number',
                  description: 'The ECO workspace ID',
                },
                analysisOptions: {
                  type: 'object',
                  properties: {
                    timeFrame: {
                      type: 'string',
                      enum: ['last30days', 'last90days', 'lastyear', 'all'],
                      description: 'Time frame for analysis',
                    },
                    groupBy: {
                      type: 'string',
                      enum: ['month', 'quarter', 'week'],
                      description: 'How to group the trend data',
                    },
                    includeMetrics: {
                      type: 'boolean',
                      description: 'Whether to include performance metrics',
                    },
                  },
                },
              },
              required: ['ecoWorkspaceId'],
            },
          },

          // Asset Tools
          {
            name: 'get_asset_service_data',
            description: 'Get service and maintenance data for an asset',
            inputSchema: {
              type: 'object',
              properties: {
                assetWorkspaceId: {
                  type: 'number',
                  description: 'The asset workspace ID',
                },
                assetId: {
                  type: 'number',
                  description: 'The asset item ID',
                },
              },
              required: ['assetWorkspaceId', 'assetId'],
            },
          },
          {
            name: 'predict_maintenance',
            description: 'Predict maintenance needs using linear regression analysis on asset service data',
            inputSchema: {
              type: 'object',
              properties: {
                assetWorkspaceId: {
                  type: 'number',
                  description: 'The asset workspace ID',
                },
                assetId: {
                  type: 'number',
                  description: 'The asset item ID',
                },
                predictionOptions: {
                  type: 'object',
                  properties: {
                    lookAheadDays: {
                      type: 'number',
                      description: 'Number of days to predict ahead (default: 90)',
                    },
                    confidenceThreshold: {
                      type: 'number',
                      description: 'Minimum confidence threshold for predictions',
                    },
                    includeSeasonality: {
                      type: 'boolean',
                      description: 'Whether to include seasonal patterns in analysis',
                    },
                  },
                },
              },
              required: ['assetWorkspaceId', 'assetId'],
            },
          },
          {
            name: 'calculate_maintenance_intervals',
            description: 'Calculate optimal maintenance intervals for multiple assets',
            inputSchema: {
              type: 'object',
              properties: {
                assetWorkspaceId: {
                  type: 'number',
                  description: 'The asset workspace ID',
                },
                assetIds: {
                  type: 'array',
                  items: { type: 'number' },
                  description: 'Array of asset item IDs to analyze',
                },
              },
              required: ['assetWorkspaceId', 'assetIds'],
            },
          },

          // Future BOM Tools (commented out for now)
          /*
          {
            name: 'get_bom_structure',
            description: 'Get the Bill of Materials (BOM) structure for a product',
            inputSchema: {
              type: 'object',
              properties: {
                partsWorkspaceId: { type: 'number', description: 'The parts workspace ID' },
                parentItemId: { type: 'number', description: 'The parent item ID' },
                options: {
                  type: 'object',
                  properties: {
                    depth: { type: 'number', description: 'BOM depth to retrieve' },
                    includeCosts: { type: 'boolean', description: 'Include cost information' },
                    includeSupplierInfo: { type: 'boolean', description: 'Include supplier information' },
                  },
                },
              },
              required: ['partsWorkspaceId', 'parentItemId'],
            },
          },
          {
            name: 'get_bom_compliance',
            description: 'Analyze BOM compliance with regulations (RoHS, REACH, Conflict Minerals)',
            inputSchema: {
              type: 'object',
              properties: {
                partsWorkspaceId: { type: 'number', description: 'The parts workspace ID' },
                parentItemId: { type: 'number', description: 'The parent item ID' },
                options: {
                  type: 'object',
                  properties: {
                    includeSubAssemblies: { type: 'boolean', description: 'Include sub-assemblies in analysis' },
                    regulationTypes: {
                      type: 'array',
                      items: { type: 'string', enum: ['rohs', 'reach', 'conflictMinerals'] },
                      description: 'Specific regulations to check',
                    },
                  },
                },
              },
              required: ['partsWorkspaceId', 'parentItemId'],
            },
          },
          */

          // Future Supplier Tools (commented out for now)
          /*
          {
            name: 'assess_supplier_risk',
            description: 'Assess comprehensive risk factors for a supplier',
            inputSchema: {
              type: 'object',
              properties: {
                supplierWorkspaceId: { type: 'number', description: 'The supplier workspace ID' },
                supplierId: { type: 'number', description: 'The supplier item ID' },
                assessmentOptions: {
                  type: 'object',
                  properties: {
                    includeFinancial: { type: 'boolean', description: 'Include financial risk assessment' },
                    includeGeographic: { type: 'boolean', description: 'Include geographic risk assessment' },
                    includeOperational: { type: 'boolean', description: 'Include operational risk assessment' },
                    includeCompliance: { type: 'boolean', description: 'Include compliance risk assessment' },
                  },
                },
              },
              required: ['supplierWorkspaceId', 'supplierId'],
            },
          },
          */
        ] as ToolSchema[],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        console.error(`[MCP Server] Tool called: ${name}`);
        const fusionManage = await this.initializeFusionManage();

        switch (name) {
          // Workspace Tools
          case 'list_workspaces':
            console.error(`[MCP Server] Calling list_workspaces...`);
            const workspaces = await fusionManage.workspaceTools.listWorkspaces();
            console.error(`[MCP Server] Retrieved ${workspaces.length} workspaces`);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(workspaces, null, 2),
                },
              ],
            };

          case 'discover_workspaces':
            console.error(`[MCP Server] Calling discover_workspaces...`);
            const discovered = await fusionManage.workspaceTools.discoverWorkspaces();
            console.error(`[MCP Server] Workspace discovery completed`);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(discovered, null, 2),
                },
              ],
            };

          case 'get_workspace_items':
            const { workspaceId, page, size, includeRelationships } = args as any;
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    await fusionManage.workspaceTools.getWorkspaceItems(workspaceId, {
                      page,
                      size,
                      includeRelationships,
                    }),
                    null,
                    2
                  ),
                },
              ],
            };

          case 'search_workspace_items':
            const { workspaceId: searchWorkspaceId, searchCriteria } = args as any;
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    await fusionManage.workspaceTools.searchWorkspaceItems(searchWorkspaceId, searchCriteria),
                    null,
                    2
                  ),
                },
              ],
            };

          case 'get_item_details':
            const { workspaceId: itemWorkspaceId, itemId, includeRelationships: includeRel } = args as any;
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    await fusionManage.workspaceTools.getItemDetails(itemWorkspaceId, itemId, includeRel),
                    null,
                    2
                  ),
                },
              ],
            };

          // ECO Tools
          case 'list_ecos':
            const { ecoWorkspaceId, page: ecoPage, size: ecoSize } = args as any;
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    await fusionManage.ecoTools.listECOs(ecoWorkspaceId, {
                      page: ecoPage,
                      size: ecoSize,
                    }),
                    null,
                    2
                  ),
                },
              ],
            };

          case 'get_eco_details':
            const { ecoWorkspaceId: detailWorkspaceId, ecoId, includeRelationships: includeEcoRel } = args as any;
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    await fusionManage.ecoTools.getECODetails(detailWorkspaceId, ecoId, includeEcoRel),
                    null,
                    2
                  ),
                },
              ],
            };

          case 'search_ecos':
            const { ecoWorkspaceId: searchEcoWorkspaceId, searchParams } = args as any;
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    await fusionManage.ecoTools.searchECOs(searchEcoWorkspaceId, searchParams),
                    null,
                    2
                  ),
                },
              ],
            };

          case 'analyze_eco_trends':
            const { ecoWorkspaceId: trendWorkspaceId, analysisOptions } = args as any;
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    await fusionManage.ecoTools.analyzeECOTrends(trendWorkspaceId, analysisOptions || {}),
                    null,
                    2
                  ),
                },
              ],
            };

          // Asset Tools
          case 'get_asset_service_data':
            const { assetWorkspaceId, assetId } = args as any;
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    await fusionManage.assetTools.getAssetServiceData(assetWorkspaceId, assetId),
                    null,
                    2
                  ),
                },
              ],
            };

          case 'predict_maintenance':
            const { assetWorkspaceId: predWorkspaceId, assetId: predAssetId, predictionOptions } = args as any;
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    await fusionManage.assetTools.predictMaintenance(predWorkspaceId, predAssetId, predictionOptions || {}),
                    null,
                    2
                  ),
                },
              ],
            };

          case 'calculate_maintenance_intervals':
            const { assetWorkspaceId: intervalWorkspaceId, assetIds } = args as any;
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    await fusionManage.assetTools.calculateMaintenanceIntervals(intervalWorkspaceId, assetIds),
                    null,
                    2
                  ),
                },
              ],
            };

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`[MCP Server] Error in tool ${name}:`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Fusion Manage MCP server running on stdio');
  }
}

const server = new FusionManageMCPServer();
server.run().catch(console.error); 