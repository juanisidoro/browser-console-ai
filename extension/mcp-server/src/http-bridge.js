const express = require('express');
const cors = require('cors');
const config = require('./config');
const { logsToPlain } = require('./toon-encoder');

function createHttpBridge(logsStore) {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: config.maxPayloadSize }));

  // POST /logs - Receive logs from extension
  app.post('/logs', (req, res) => {
    try {
      const { logs, sessionId, recordingId } = req.body;

      if (!logs || !Array.isArray(logs)) {
        return res.status(400).json({ error: 'logs must be an array' });
      }

      // Add sessionId and recordingId to each log if provided at request level
      const logsWithMetadata = logs.map(log => ({
        ...log,
        sessionId: log.sessionId || sessionId || 'default',
        recordingId: log.recordingId || recordingId || null,
      }));

      const received = logsStore.addLogs(logsWithMetadata);

      res.json({ received, recordingId });
    } catch (error) {
      console.error('Error processing logs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /health - Server health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      logsCount: logsStore.getLogsCount(),
      uptime: logsStore.getUptime(),
    });
  });

  // GET /logs - Query logs (for debugging or copy)
  app.get('/logs', (req, res) => {
    const query = {
      type: req.query.type,
      sessionId: req.query.sessionId,
      recordingId: req.query.recordingId,
      urlContains: req.query.urlContains,
      textContains: req.query.textContains,
      sinceTimestamp: req.query.sinceTimestamp ? parseInt(req.query.sinceTimestamp) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : config.defaultQueryLimit,
    };

    const logs = logsStore.getLogs(query);
    const format = req.query.format || 'json';

    if (format === 'plain') {
      const options = {
        showSource: req.query.showSource !== 'false',
        compressObjects: req.query.compressObjects === 'true',
        maxObjectLength: parseInt(req.query.maxObjectLength) || 50
      };
      res.type('text/plain').send(logsToPlain(logs, options));
    } else {
      res.json({ logs, total: logs.length, recordingId: query.recordingId });
    }
  });

  // GET /recordings - List unique recording IDs (limited to last 10)
  app.get('/recordings', (req, res) => {
    const allLogs = logsStore.getLogs({ limit: logsStore.maxLogs });
    const recordings = {};

    allLogs.forEach(log => {
      if (log.recordingId) {
        if (!recordings[log.recordingId]) {
          recordings[log.recordingId] = { count: 0, firstTimestamp: log.timestamp, lastTimestamp: log.timestamp };
        }
        recordings[log.recordingId].count++;
        recordings[log.recordingId].firstTimestamp = Math.min(recordings[log.recordingId].firstTimestamp, log.timestamp);
        recordings[log.recordingId].lastTimestamp = Math.max(recordings[log.recordingId].lastTimestamp, log.timestamp);
      }
    });

    const list = Object.entries(recordings).map(([id, data]) => ({
      id,
      ...data
    })).sort((a, b) => b.lastTimestamp - a.lastTimestamp).slice(0, 10); // Limit to 10

    res.json({ recordings: list });
  });

  // POST /logs/clear - Clear all logs (called by extension on browser startup)
  app.post('/logs/clear', (req, res) => {
    const query = req.body || {};
    const result = logsStore.clearLogs(query);
    console.log(`Logs cleared: ${result.deleted} deleted`);
    res.json(result);
  });

  return app;
}

function startHttpBridge(logsStore, port = config.port) {
  const app = createHttpBridge(logsStore);

  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`HTTP Bridge listening on http://localhost:${port}`);
      resolve(server);
    });

    server.on('error', reject);
  });
}

module.exports = { createHttpBridge, startHttpBridge };
