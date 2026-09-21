type Level = 'debug' | 'info' | 'warn' | 'error';
export interface LoggerConfig {
    serviceName: string;
    level: Level;
}
export declare class Logger {
    private readonly serviceName;
    private readonly currentLevel;
    constructor(cfg: LoggerConfig);
    private log;
    debug(msg: string, meta?: Record<string, unknown>): void;
    info(msg: string, meta?: Record<string, unknown>): void;
    warn(msg: string, meta?: Record<string, unknown>): void;
    error(msg: string, meta?: Record<string, unknown>): void;
}
export {};
