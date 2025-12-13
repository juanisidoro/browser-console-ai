/**
 * Logs Domain - Console log entities
 */

// Re-export OutputFormat from licensing (single source of truth)
export type { OutputFormat } from '../licensing/entities';

export type LogType = 'log' | 'warn' | 'error' | 'info' | 'debug';

export interface ConsoleLog {
  id: string;
  sessionId: string;
  recordingId?: string;
  type: LogType;
  args: string[];          // Serialized arguments
  timestamp: number;       // Unix ms
  url: string;
  source?: string;         // file:line
}

export interface Recording {
  id: string;
  sessionId: string;
  name?: string;
  logs: ConsoleLog[];
  startedAt: number;       // Unix ms
  stoppedAt?: number;      // Unix ms
  sentAt?: number;         // Unix ms when sent to server
}

export interface LogsStats {
  total: number;
  byType: Record<LogType, number>;
  sessions: string[];
  recordings: string[];
}
