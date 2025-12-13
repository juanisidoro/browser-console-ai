const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const LogsStore = require('./logs-store');
const { startHttpBridge } = require('./http-bridge');
const config = require('./config');
const { logsToToon, statsToToon, logsToPlain } = require('./toon-encoder');

// Initialize shared logs store
const logsStore = new LogsStore();

// Create MCP Server
const server = new McpServer({
  name: 'browser-console',
  version: '1.0.0',
});

// Tool: get_console_logs
server.tool(
  'get_console_logs',
  'Get browser console logs with optional filters',
  {
    type: {
      type: 'string',
      description: "Filter by log type: 'log', 'warn', 'error', 'info', 'debug'",
    },
    sessionId: {
      type: 'string',
      description: 'Filter by session ID',
    },
    recordingId: {
      type: 'string',
      description: 'Filter by recording ID (e.g., REC-abc123)',
    },
    urlContains: {
      type: 'string',
      description: 'Filter logs where URL contains this text',
    },
    textContains: {
      type: 'string',
      description: 'Filter logs where arguments contain this text',
    },
    sinceTimestamp: {
      type: 'number',
      description: 'Filter logs since this Unix timestamp (ms)',
    },
    limit: {
      type: 'number',
      description: `Maximum number of logs to return (default: ${config.defaultQueryLimit})`,
    },
    format: {
      type: 'string',
      description: "Output format: 'plain' (default, ultra-compact), 'toon', or 'json'",
    },
    showSource: {
      type: 'boolean',
      description: 'Include file:line source in output (default: true)',
    },
    compressObjects: {
      type: 'boolean',
      description: 'Compress large JSON objects > 50 chars (default: true)',
    },
    maxObjectLength: {
      type: 'number',
      description: 'Max chars before compressing objects (default: 50)',
    },
  },
  async (args) => {
    const logs = logsStore.getLogs(args);
    const {
      format = 'plain',
      showSource = true,
      compressObjects = true,
      maxObjectLength = 50
    } = args;

    let text;
    if (format === 'json') {
      text = JSON.stringify({ logs, total: logs.length }, null, 2);
    } else if (format === 'plain') {
      text = logsToPlain(logs, { showSource, compressObjects, maxObjectLength });
    } else {
      text = logsToToon(logs);
    }

    return {
      content: [{ type: 'text', text }],
    };
  }
);

// Tool: get_console_stats
server.tool(
  'get_console_stats',
  'Get statistics about browser console logs',
  {
    type: {
      type: 'string',
      description: "Filter by log type: 'log', 'warn', 'error', 'info', 'debug'",
    },
    sessionId: {
      type: 'string',
      description: 'Filter by session ID',
    },
    urlContains: {
      type: 'string',
      description: 'Filter logs where URL contains this text',
    },
    textContains: {
      type: 'string',
      description: 'Filter logs where arguments contain this text',
    },
    sinceTimestamp: {
      type: 'number',
      description: 'Filter logs since this Unix timestamp (ms)',
    },
    format: {
      type: 'string',
      description: "Output format: 'toon' (default) or 'json'",
    },
  },
  async (args) => {
    const stats = logsStore.getStats(args);
    const { format = 'toon' } = args;

    let text;
    if (format === 'json') {
      text = JSON.stringify(stats, null, 2);
    } else {
      text = statsToToon(stats);
    }

    return {
      content: [{ type: 'text', text }],
    };
  }
);

// Tool: clear_console_logs
server.tool(
  'clear_console_logs',
  'Clear browser console logs from the store',
  {
    sessionId: {
      type: 'string',
      description: 'Clear only logs from this session',
    },
    beforeTimestamp: {
      type: 'number',
      description: 'Clear logs before this Unix timestamp (ms)',
    },
    all: {
      type: 'boolean',
      description: 'Clear all logs (use with caution)',
    },
  },
  async (args) => {
    const result = logsStore.clearLogs(args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

async function main() {
  // Start HTTP Bridge (for receiving logs from extension)
  await startHttpBridge(logsStore, config.port);

  // Start MCP Server (for Claude Code communication via stdio)
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
