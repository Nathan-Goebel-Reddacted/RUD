#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  loadState,
  saveState,
  generateImportUrl,
  uuid,
  findConnection,
  getDashboard,
  nextWidgetPosition,
} from "./state.js";

const server = new Server(
  { name: "rud-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

// ─── Tool definitions ─────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_config",
      description: "Read the current RUD dashboard configuration from rud-state.json.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "add_connection",
      description: "Add an API connection.",
      inputSchema: {
        type: "object",
        required: ["label", "baseUrl"],
        properties: {
          label:     { type: "string", description: "Display name for the connection" },
          baseUrl:   { type: "string", description: "Base URL, e.g. https://api.example.com" },
          authType:  { type: "string", enum: ["NONE", "BEARER", "API_KEY", "BASIC"], default: "NONE" },
          authValue: { type: "string", description: "Token/key value (ignored for NONE)" },
          headers:   { type: "object", description: "Custom headers as key/value pairs", additionalProperties: { type: "string" } },
        },
      },
    },
    {
      name: "add_endpoint",
      description: "Add an endpoint to an existing connection.",
      inputSchema: {
        type: "object",
        required: ["connectionId", "path", "method"],
        properties: {
          connectionId: { type: "string" },
          path:         { type: "string", description: "Path starting with /, e.g. /api/metrics" },
          method:       { type: "string", enum: ["GET", "POST", "PUT", "PATCH", "DELETE", "WS"] },
          label:        { type: "string" },
          dataPath:     { type: "string", description: "JSONPath, e.g. $.data.value" },
          queryParams:  {
            type: "array",
            description: "Query parameters",
            items: {
              type: "object",
              required: ["name"],
              properties: {
                name:         { type: "string" },
                defaultValue: { type: "string" },
                required:     { type: "boolean" },
              },
            },
          },
        },
      },
    },
    {
      name: "add_widget",
      description: "Add a widget to a dashboard.",
      inputSchema: {
        type: "object",
        required: ["type"],
        properties: {
          type: {
            type: "string",
            enum: ["number-card", "table", "bar-chart", "line-chart", "text", "raw-response",
                   "health-check", "clock", "last-update", "gauge", "stat", "progress", "pie-chart"],
            description: "Widget type",
          },
          label:          { type: "string", description: "Widget header label" },
          connectionId:   { type: "string" },
          endpointId:     { type: "string" },
          dataPath:       { type: "string" },
          config:         { type: "object", description: "Widget-type-specific config (unit, min, max, etc.)" },
          position:       {
            type: "object",
            description: "Grid position { x, y, w, h } — auto-computed if omitted",
            properties: {
              x: { type: "number" }, y: { type: "number" },
              w: { type: "number" }, h: { type: "number" },
            },
          },
          dashboardIndex: { type: "number", description: "Dashboard index (default 0)" },
          refreshInterval:{ type: "number", description: "Refresh interval in seconds" },
        },
      },
    },
    {
      name: "remove_widget",
      description: "Remove a widget by ID.",
      inputSchema: {
        type: "object",
        required: ["widgetId"],
        properties: {
          widgetId:       { type: "string" },
          dashboardIndex: { type: "number", default: 0 },
        },
      },
    },
    {
      name: "update_widget",
      description: "Update widget config / label.",
      inputSchema: {
        type: "object",
        required: ["widgetId"],
        properties: {
          widgetId:       { type: "string" },
          label:          { type: "string" },
          config:         { type: "object" },
          dashboardIndex: { type: "number", default: 0 },
        },
      },
    },
    {
      name: "update_dashboard",
      description: "Update an existing dashboard's name or refresh interval.",
      inputSchema: {
        type: "object",
        required: ["dashboardIndex"],
        properties: {
          dashboardIndex:  { type: "number" },
          name:            { type: "string" },
          refreshInterval: { type: "number", description: "Refresh interval in seconds" },
        },
      },
    },
    {
      name: "create_dashboard",
      description: "Create a new dashboard tab.",
      inputSchema: {
        type: "object",
        required: ["name"],
        properties: {
          name:            { type: "string" },
          refreshInterval: { type: "number", default: 30 },
        },
      },
    },
    {
      name: "set_active_dashboard",
      description: "Set which dashboard is active (display order index).",
      inputSchema: {
        type: "object",
        required: ["index"],
        properties: {
          index: { type: "number" },
        },
      },
    },
    {
      name: "generate_import_url",
      description: "Compress the current config and generate a browser import URL.",
      inputSchema: {
        type: "object",
        properties: {
          appBaseUrl: {
            type: "string",
            description: "Base URL of the RUD app. Defaults to http://localhost:5173",
          },
        },
      },
    },
  ],
}));

// ─── Tool handlers ────────────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;

  try {
    switch (name) {

      case "get_config": {
        const state = loadState();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(state, null, 2),
          }],
        };
      }

      case "add_connection": {
        const state = loadState();
        const conn = {
          id:                   uuid(),
          label:                String(args.label ?? ""),
          baseUrl:              String(args.baseUrl ?? ""),
          authType:             String(args.authType ?? "NONE"),
          authValue:            String(args.authValue ?? ""),
          headers:              args.headers && typeof args.headers === "object" ? args.headers : {},
          endpoints:            [],
          healthCheckEndpointId: null,
        };
        state.connections.push(conn);
        saveState(state);
        return { content: [{ type: "text", text: `Connection added. ID: ${conn.id}` }] };
      }

      case "add_endpoint": {
        const state = loadState();
        const conn  = findConnection(state, String(args.connectionId ?? ""));
        if (!conn) return { content: [{ type: "text", text: `Connection not found: ${args.connectionId}` }], isError: true };

        const ep = {
          id:               uuid(),
          label:            String(args.label ?? ""),
          path:             String(args.path ?? "/"),
          method:           String(args.method ?? "GET"),
          pathParams:       [],
          queryParams:      Array.isArray(args.queryParams) ? args.queryParams.map((p) => ({
            name:         String(p.name ?? ""),
            type:         "string",
            required:     Boolean(p.required ?? false),
            defaultValue: String(p.defaultValue ?? ""),
          })) : [],
          responseDataPath: String(args.dataPath ?? ""),
          body:             "",
          bodyContentType:  "application/json",
        };
        conn.endpoints.push(ep);
        saveState(state);
        return { content: [{ type: "text", text: `Endpoint added. ID: ${ep.id}` }] };
      }

      case "add_widget": {
        const state  = loadState();
        const dashIdx = Number(args.dashboardIndex ?? 0);
        const dash    = getDashboard(state, dashIdx);
        if (!dash) return { content: [{ type: "text", text: `Dashboard at index ${dashIdx} not found` }], isError: true };

        const pos = args.position && typeof args.position === "object"
          ? args.position
          : nextWidgetPosition(dash.widgets);

        const config = {
          type: String(args.type ?? "number-card"),
          ...(args.config && typeof args.config === "object" ? args.config : {}),
        };

        const widget = {
          id:             uuid(),
          label:          String(args.label ?? ""),
          connectionId:   args.connectionId ? String(args.connectionId) : "",
          endpointId:     args.endpointId   ? String(args.endpointId)   : "",
          dataPath:       args.dataPath     ? String(args.dataPath)     : "",
          refreshOverride: args.refreshInterval ? Number(args.refreshInterval) : undefined,
          config,
          position: {
            x: Number(pos.x ?? 0),
            y: Number(pos.y ?? 0),
            w: Number(pos.w ?? 4),
            h: Number(pos.h ?? 3),
          },
        };

        dash.widgets.push(widget);
        saveState(state);
        return { content: [{ type: "text", text: `Widget added. ID: ${widget.id}` }] };
      }

      case "remove_widget": {
        const state   = loadState();
        const dashIdx = Number(args.dashboardIndex ?? 0);
        const dash    = getDashboard(state, dashIdx);
        if (!dash) return { content: [{ type: "text", text: "Dashboard not found" }], isError: true };
        const before  = dash.widgets.length;
        dash.widgets  = dash.widgets.filter((w) => w.id !== String(args.widgetId ?? ""));
        saveState(state);
        const removed = before - dash.widgets.length;
        return { content: [{ type: "text", text: `Removed ${removed} widget(s).` }] };
      }

      case "update_widget": {
        const state   = loadState();
        const dashIdx = Number(args.dashboardIndex ?? 0);
        const dash    = getDashboard(state, dashIdx);
        if (!dash) return { content: [{ type: "text", text: "Dashboard not found" }], isError: true };
        const widget  = dash.widgets.find((w) => w.id === String(args.widgetId ?? ""));
        if (!widget) return { content: [{ type: "text", text: `Widget not found: ${args.widgetId}` }], isError: true };
        if (args.label !== undefined)  widget.label  = String(args.label);
        if (args.config && typeof args.config === "object") {
          widget.config = { ...widget.config, ...args.config };
        }
        saveState(state);
        return { content: [{ type: "text", text: "Widget updated." }] };
      }

      case "update_dashboard": {
        const state   = loadState();
        const dashIdx = Number(args.dashboardIndex ?? 0);
        const dash    = getDashboard(state, dashIdx);
        if (!dash) return { content: [{ type: "text", text: `Dashboard at index ${dashIdx} not found` }], isError: true };
        if (args.name            !== undefined) dash.title           = String(args.name);
        if (args.refreshInterval !== undefined) dash.refreshInterval = Number(args.refreshInterval);
        saveState(state);
        return { content: [{ type: "text", text: `Dashboard "${dash.title}" updated.` }] };
      }

      case "create_dashboard": {
        const state = loadState();
        const dash  = {
          id:              uuid(),
          title:           String(args.name ?? "New Dashboard"),
          refreshInterval: Number(args.refreshInterval ?? 30),
          showInDisplay:   true,
          widgets:         [],
        };
        state.dashboards.push(dash);
        saveState(state);
        return { content: [{ type: "text", text: `Dashboard created. Index: ${state.dashboards.length - 1}, ID: ${dash.id}` }] };
      }

      case "set_active_dashboard": {
        const state = loadState();
        const idx   = Number(args.index ?? 0);
        if (idx < 0 || idx >= state.dashboards.length) {
          return { content: [{ type: "text", text: `Index out of range (0–${state.dashboards.length - 1})` }], isError: true };
        }
        // Move the selected dashboard to index 0 (first = active on import)
        const [selected] = state.dashboards.splice(idx, 1);
        state.dashboards.unshift(selected);
        saveState(state);
        return { content: [{ type: "text", text: `Dashboard "${selected.title}" is now active.` }] };
      }

      case "generate_import_url": {
        const state = loadState();
        const url   = generateImportUrl(state, args.appBaseUrl ? String(args.appBaseUrl) : undefined);
        return {
          content: [{
            type: "text",
            text: `Import URL generated.\n\nOpen this URL in your browser to import the config:\n\n${url}\n\nNote: the URL contains your full config in the hash — it is processed client-side only and never sent to any server.`,
          }],
        };
      }

      default:
        return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
      isError: true,
    };
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
