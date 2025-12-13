/**
 * TOON (Token-Oriented Object Notation) Encoder
 * Lightweight implementation for console logs
 * Reduces token usage by 40-50% compared to JSON
 *
 * @see https://github.com/toon-format/spec
 */

const LOG_FIELDS = ['id', 'sessionId', 'recordingId', 'type', 'args', 'timestamp', 'url', 'source'];

/**
 * Encode a value for TOON format
 * @param {*} value - Value to encode
 * @returns {string} - TOON-encoded value
 */
function encodeToonValue(value) {
  if (value === null || value === undefined) return '';

  // Arrays (like args) - keep as JSON for simplicity
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }

  // Numbers - no quotes needed
  if (typeof value === 'number') {
    return String(value);
  }

  // Booleans
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  // Strings - escape if contains special chars
  if (typeof value === 'string') {
    // Need quotes if contains comma, newline, or starts/ends with whitespace
    if (value.includes(',') || value.includes('\n') || value.includes('\r') ||
        value.startsWith(' ') || value.endsWith(' ') || value.includes('"')) {
      // Escape double quotes by doubling them
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  // Objects - fallback to JSON
  return JSON.stringify(value);
}

/**
 * Convert logs array to TOON format
 * @param {Array} logs - Array of log objects
 * @returns {string} - TOON-formatted string
 */
function logsToToon(logs) {
  if (!logs || logs.length === 0) {
    return 'logs[0]{}:\ntotal:0';
  }

  // Header: logs[count]{field1,field2,...}:
  const header = `logs[${logs.length}]{${LOG_FIELDS.join(',')}}:`;

  // Rows: each log as comma-separated values
  const rows = logs.map(log =>
    '  ' + LOG_FIELDS.map(field => encodeToonValue(log[field])).join(',')
  );

  return header + '\n' + rows.join('\n') + '\ntotal:' + logs.length;
}

/**
 * Convert stats object to TOON format
 * @param {Object} stats - Stats object with byType and sessions
 * @returns {string} - TOON-formatted string
 */
function statsToToon(stats) {
  const lines = [];

  // Total
  lines.push(`total:${stats.total}`);

  // By type as inline object
  if (stats.byType) {
    const typeEntries = Object.entries(stats.byType)
      .map(([k, v]) => `${k}:${v}`)
      .join(',');
    lines.push(`byType:{${typeEntries}}`);
  }

  // Sessions as array
  if (stats.sessions && stats.sessions.length > 0) {
    lines.push(`sessions[${stats.sessions.length}]:${stats.sessions.join(',')}`);
  } else {
    lines.push('sessions[0]:');
  }

  return lines.join('\n');
}

/**
 * Convert logs to plain text format (ultra-compact)
 * @param {Array} logs - Array of log objects
 * @param {Object} options - { showSource, compressObjects, maxObjectLength, includeProps }
 * @returns {string} - Plain text, pipe-separated, no newlines
 */
function logsToPlain(logs, options = {}) {
  const {
    showSource = true,
    compressObjects = false,
    maxObjectLength = 50,
    includeProps = {} // { id, sessionId, recordingId, timestamp, url }
  } = options;

  if (!logs || logs.length === 0) {
    return '';
  }

  // Calculate compression thresholds
  const compressThreshold = maxObjectLength;
  const halfLength = Math.floor(maxObjectLength / 2);

  return logs.map(log => {
    // Join args, compress if needed
    let text = log.args.map(arg => {
      const str = typeof arg === 'string' ? arg : JSON.stringify(arg);
      if (compressObjects && (str.startsWith('{') || str.startsWith('['))) {
        if (str.length > compressThreshold) {
          return str.slice(0, halfLength) + '...' + str.slice(-halfLength);
        }
      }
      return str;
    }).join(' ');

    // Add optional props
    const parts = [text];
    if (includeProps.id && log.id) parts.push(`id:${log.id}`);
    if (includeProps.sessionId && log.sessionId) parts.push(`sess:${log.sessionId}`);
    if (includeProps.recordingId && log.recordingId) parts.push(`rec:${log.recordingId}`);
    if (includeProps.timestamp && log.timestamp) parts.push(`ts:${log.timestamp}`);
    if (includeProps.url && log.url) parts.push(`url:${log.url}`);

    // Add source if enabled
    if (showSource && log.source) {
      parts.push(`{${log.source}}`);
    }

    return parts.join(',');
  }).join('|');
}

module.exports = {
  logsToToon,
  statsToToon,
  logsToPlain,
  encodeToonValue,
  LOG_FIELDS
};
