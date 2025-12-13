/**
 * Format Logs Use Case
 *
 * Formats logs for output in different formats.
 * Note: Full TOON encoder exists in MCP server, this is the CORE interface.
 */

import type { ConsoleLog, OutputFormat } from '../entities';

export interface FormatOptions {
  showSource?: boolean;
  compressObjects?: boolean;
  maxObjectLength?: number;
}

const DEFAULT_OPTIONS: FormatOptions = {
  showSource: true,
  compressObjects: true,
  maxObjectLength: 50,
};

/**
 * Format logs to plain text (FREE format)
 *
 * @param logs - Array of console logs
 * @param options - Formatting options
 * @returns Formatted string
 */
export function formatLogsPlain(logs: ConsoleLog[], options: FormatOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return logs
    .map((log) => {
      const args = log.args.join(' ');
      const source = opts.showSource && log.source ? ` {${log.source}}` : '';
      return `${args}${source}`;
    })
    .join('|');
}

/**
 * Format logs to JSON
 *
 * @param logs - Array of console logs
 * @returns JSON string
 */
export function formatLogsJson(logs: ConsoleLog[]): string {
  return JSON.stringify({ logs, total: logs.length }, null, 2);
}

/**
 * Format logs in specified format
 *
 * @param logs - Array of console logs
 * @param format - Output format
 * @param options - Formatting options
 * @returns Formatted string
 */
export function formatLogs(
  logs: ConsoleLog[],
  format: OutputFormat,
  options: FormatOptions = {}
): string {
  switch (format) {
    case 'plain':
      return formatLogsPlain(logs, options);
    case 'json':
      return formatLogsJson(logs);
    case 'toon':
      // TOON format is implemented in MCP server's toon-encoder.js
      // For CORE, we just return JSON as fallback
      // Real TOON formatting happens in INFRA
      return formatLogsJson(logs);
    default:
      return formatLogsPlain(logs, options);
  }
}
