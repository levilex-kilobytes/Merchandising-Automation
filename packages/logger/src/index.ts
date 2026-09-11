type Level = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerConfig {
  serviceName: string;
  level: Level;
}

const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export class Logger {
  private readonly serviceName: string;
  private readonly currentLevel: Level;

  constructor(cfg: LoggerConfig) {
    if (!cfg.serviceName) throw new Error('Logger: serviceName is required');
    if (!cfg.level) throw new Error('Logger: level is required');
    this.serviceName = cfg.serviceName;
    this.currentLevel = cfg.level;
  }

  private log(level: Level, msg: string, meta?: Record<string, unknown>): void {
    if (LEVELS[level] < LEVELS[this.currentLevel]) return;
    const entry = {
      ts: new Date().toISOString(),
      level,
      service: this.serviceName,
      msg,
      ...(meta || {}),
    };
    const line = JSON.stringify(entry);
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  }

  debug(msg: string, meta?: Record<string, unknown>): void { this.log('debug', msg, meta); }
  info(msg: string, meta?: Record<string, unknown>): void { this.log('info', msg, meta); }
  warn(msg: string, meta?: Record<string, unknown>): void { this.log('warn', msg, meta); }
  error(msg: string, meta?: Record<string, unknown>): void { this.log('error', msg, meta); }
}
