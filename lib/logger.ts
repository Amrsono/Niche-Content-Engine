/**
 * Structured Logger for Niche-Content-Engine
 * Provides uniform timestamps, levels, and context metadata.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogPayload {
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  timestamp: string;
}

class StructuredLogger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  private formatMessage(payload: LogPayload): string {
    const ctx = payload.context ? ` [${payload.context}]` : '';
    return `[${payload.timestamp}] [${payload.level.toUpperCase()}]${ctx} ${payload.message}`;
  }

  private log(level: LogLevel, message: string, context?: string, data?: unknown) {
    const payload: LogPayload = {
      level,
      message,
      context,
      data,
      timestamp: new Date().toISOString(),
    };

    const formatted = this.formatMessage(payload);

    switch (level) {
      case 'debug':
        if (this.isDevelopment) {
          if (data !== undefined) console.debug(formatted, data);
          else console.debug(formatted);
        }
        break;
      case 'info':
        if (data !== undefined) console.info(formatted, data);
        else console.info(formatted);
        break;
      case 'warn':
        if (data !== undefined) console.warn(formatted, data);
        else console.warn(formatted);
        break;
      case 'error':
        if (data !== undefined) console.error(formatted, data);
        else console.error(formatted);
        break;
    }
  }

  debug(message: string, context?: string, data?: unknown) {
    this.log('debug', message, context, data);
  }

  info(message: string, context?: string, data?: unknown) {
    this.log('info', message, context, data);
  }

  warn(message: string, context?: string, data?: unknown) {
    this.log('warn', message, context, data);
  }

  error(message: string, context?: string, data?: unknown) {
    this.log('error', message, context, data);
  }
}

export const logger = new StructuredLogger();
