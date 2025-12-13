const config = require('./config');

class LogsStore {
  constructor(maxLogs = config.maxLogs) {
    this.logs = [];
    this.maxLogs = maxLogs;
    this.startTime = Date.now();
  }

  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  addLogs(logs) {
    if (!Array.isArray(logs)) {
      logs = [logs];
    }

    const normalizedLogs = logs.map(log => ({
      id: log.id || this.generateId(),
      sessionId: log.sessionId || 'default',
      recordingId: log.recordingId || null,
      type: log.type || 'log',
      args: Array.isArray(log.args) ? log.args : [String(log.args)],
      timestamp: log.timestamp || Date.now(),
      url: log.url || '',
      source: log.source || null,
    }));

    this.logs.push(...normalizedLogs);

    // FIFO: remove oldest logs if over limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    return normalizedLogs.length;
  }

  getLogs(query = {}) {
    let result = [...this.logs];

    // Filter by type
    if (query.type) {
      result = result.filter(log => log.type === query.type);
    }

    // Filter by sessionId
    if (query.sessionId) {
      result = result.filter(log => log.sessionId === query.sessionId);
    }

    // Filter by recordingId
    if (query.recordingId) {
      result = result.filter(log => log.recordingId === query.recordingId);
    }

    // Filter by URL contains
    if (query.urlContains) {
      const search = query.urlContains.toLowerCase();
      result = result.filter(log => log.url.toLowerCase().includes(search));
    }

    // Filter by text contains (in args)
    if (query.textContains) {
      const search = query.textContains.toLowerCase();
      result = result.filter(log =>
        log.args.some(arg => String(arg).toLowerCase().includes(search))
      );
    }

    // Filter by timestamp
    if (query.sinceTimestamp) {
      result = result.filter(log => log.timestamp >= query.sinceTimestamp);
    }

    // Sort by timestamp descending (most recent first)
    result.sort((a, b) => b.timestamp - a.timestamp);

    // Apply limit
    const limit = query.limit || config.defaultQueryLimit;
    result = result.slice(0, limit);

    return result;
  }

  clearLogs(query = {}) {
    const initialCount = this.logs.length;

    if (query.all) {
      this.logs = [];
      return { deleted: initialCount };
    }

    if (query.sessionId) {
      this.logs = this.logs.filter(log => log.sessionId !== query.sessionId);
    }

    if (query.beforeTimestamp) {
      this.logs = this.logs.filter(log => log.timestamp >= query.beforeTimestamp);
    }

    return { deleted: initialCount - this.logs.length };
  }

  getStats(query = {}) {
    let logs = this.getLogs({ ...query, limit: this.maxLogs });

    const byType = {
      log: 0,
      warn: 0,
      error: 0,
      info: 0,
      debug: 0,
    };

    const sessions = new Set();

    logs.forEach(log => {
      if (byType.hasOwnProperty(log.type)) {
        byType[log.type]++;
      }
      sessions.add(log.sessionId);
    });

    return {
      total: logs.length,
      byType,
      sessions: Array.from(sessions),
    };
  }

  getLogsCount() {
    return this.logs.length;
  }

  getUptime() {
    return Date.now() - this.startTime;
  }
}

module.exports = LogsStore;
