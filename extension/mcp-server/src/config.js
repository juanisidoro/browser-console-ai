const config = {
  port: process.env.PORT || 9876,
  // 10 recordings × 500 logs each = 5000 logs max
  maxLogs: process.env.MAX_LOGS || 5000,
  maxPayloadSize: '1mb',
  // Default limit for queries (getLogs, HTTP endpoint, MCP tool)
  defaultQueryLimit: 400,
};

module.exports = config;
