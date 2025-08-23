import Constants from 'expo-constants';
import { Platform } from 'react-native';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

class LoggingService {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory
  private sessionId: string;
  private userId?: string;
  private logLevel: LogLevel;
  private isProduction: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isProduction = (process.env.EXPO_PUBLIC_ENVIRONMENT || 'development') === 'production';
    this.logLevel = this.getLogLevel();
    
    this.info('LoggingService initialized', 'LOGGING', {
      environment: this.isProduction ? 'production' : 'development',
      platform: Platform.OS,
      version: Constants.expoConfig?.version,
      logLevel: LogLevel[this.logLevel],
    });
  }

  private generateSessionId(): string {
    return `log_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getLogLevel(): LogLevel {
    const envLogLevel = process.env.EXPO_PUBLIC_LOG_LEVEL;
    
    switch (envLogLevel?.toLowerCase()) {
      case 'debug': return LogLevel.DEBUG;
      case 'info': return LogLevel.INFO;
      case 'warn': return LogLevel.WARN;
      case 'error': return LogLevel.ERROR;
      default: return this.isProduction ? LogLevel.WARN : LogLevel.DEBUG;
    }
  }

  setUserId(userId: string | undefined): void {
    this.userId = userId;
    this.info('User identified for logging', 'LOGGING', { userId });
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private addLog(level: LogLevel, message: string, context?: string, data?: any): void {
    const logEntry: LogEntry = {
      level,
      message,
      context,
      data,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
    };

    // Add to memory store
    this.logs.push(logEntry);
    
    // Trim logs if exceeding max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output with formatted message
    this.outputToConsole(logEntry);

    // In production, send to logging service
    if (this.isProduction && level >= LogLevel.WARN) {
      this.sendToLoggingService(logEntry);
    }
  }

  private outputToConsole(logEntry: LogEntry): void {
    const timestamp = new Date(logEntry.timestamp).toISOString();
    const levelStr = LogLevel[logEntry.level];
    const contextStr = logEntry.context ? `[${logEntry.context}]` : '';
    const userStr = logEntry.userId ? `[User: ${logEntry.userId}]` : '';
    
    const prefix = `${timestamp} ${levelStr} ${contextStr}${userStr}`;
    const message = `${prefix} ${logEntry.message}`;

    switch (logEntry.level) {
      case LogLevel.DEBUG:
        console.debug(message, logEntry.data || '');
        break;
      case LogLevel.INFO:
        console.info(message, logEntry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(message, logEntry.data || '');
        break;
      case LogLevel.ERROR:
        console.error(message, logEntry.data || '');
        break;
    }
  }

  private async sendToLoggingService(logEntry: LogEntry): Promise<void> {
    try {
      // In production, send to your logging service
      // Examples: CloudWatch, Datadog, LogRocket, Sentry
      
      // Example implementation:
      // await fetch('https://your-logging-endpoint.com/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logEntry),
      // });
      
    } catch (error) {
      // Avoid infinite loop by not using this.error here
      console.error('Failed to send log to service:', error);
    }
  }

  debug(message: string, context?: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.addLog(LogLevel.DEBUG, message, context, data);
    }
  }

  info(message: string, context?: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.addLog(LogLevel.INFO, message, context, data);
    }
  }

  warn(message: string, context?: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.addLog(LogLevel.WARN, message, context, data);
    }
  }

  error(message: string, context?: string, data?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.addLog(LogLevel.ERROR, message, context, data);
    }
  }

  // Specialized logging methods
  logApiCall(method: string, url: string, status: number, duration: number, error?: string): void {
    const level = status >= 400 ? LogLevel.ERROR : status >= 300 ? LogLevel.WARN : LogLevel.INFO;
    this.addLog(level, `API ${method} ${url} - ${status} (${duration}ms)`, 'API', {
      method,
      url,
      status,
      duration,
      error,
    });
  }

  logUserAction(action: string, screen: string, data?: any): void {
    this.info(`User action: ${action}`, `USER_ACTION:${screen}`, data);
  }

  logPerformance(metric: string, value: number, unit: string = 'ms', context?: string): void {
    this.info(`Performance: ${metric} = ${value}${unit}`, context || 'PERFORMANCE', {
      metric,
      value,
      unit,
    });
  }

  logError(error: Error, context?: string, additionalData?: any): void {
    this.error(error.message, context || 'ERROR', {
      stack: error.stack,
      name: error.name,
      ...additionalData,
    });
  }

  // Firebase specific logging
  logFirebaseOperation(operation: string, collection?: string, success: boolean = true, error?: string): void {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    this.addLog(level, `Firebase ${operation}${collection ? ` on ${collection}` : ''}`, 'FIREBASE', {
      operation,
      collection,
      success,
      error,
    });
  }

  // Room/Match specific logging
  logRoomOperation(operation: string, roomId?: string, data?: any): void {
    this.info(`Room ${operation}`, 'ROOM', { roomId, ...data });
  }

  logMatchOperation(operation: string, matchId?: string, data?: any): void {
    this.info(`Match ${operation}`, 'MATCH', { matchId, ...data });
  }

  // Get logs for debugging or crash reports
  getLogs(level?: LogLevel, limit: number = 100): LogEntry[] {
    let filteredLogs = this.logs;
    
    if (level !== undefined) {
      filteredLogs = this.logs.filter(log => log.level >= level);
    }
    
    return filteredLogs.slice(-limit);
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
    this.info('Logs cleared', 'LOGGING');
  }

  // Get logging statistics
  getLogStats(): {
    totalLogs: number;
    logsByLevel: Record<string, number>;
    sessionId: string;
    oldestLog?: number;
    newestLog?: number;
  } {
    const logsByLevel = this.logs.reduce((acc, log) => {
      const levelName = LogLevel[log.level];
      acc[levelName] = (acc[levelName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalLogs: this.logs.length,
      logsByLevel,
      sessionId: this.sessionId,
      oldestLog: this.logs.length > 0 ? this.logs[0].timestamp : undefined,
      newestLog: this.logs.length > 0 ? this.logs[this.logs.length - 1].timestamp : undefined,
    };
  }
}

// Export singleton instance
export const logger = new LoggingService();