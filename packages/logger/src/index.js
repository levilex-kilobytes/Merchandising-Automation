"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
class Logger {
    serviceName;
    currentLevel;
    constructor(cfg) {
        if (!cfg.serviceName)
            throw new Error('Logger: serviceName is required');
        if (!cfg.level)
            throw new Error('Logger: level is required');
        this.serviceName = cfg.serviceName;
        this.currentLevel = cfg.level;
    }
    log(level, msg, meta) {
        if (LEVELS[level] < LEVELS[this.currentLevel])
            return;
        const entry = {
            ts: new Date().toISOString(),
            level,
            service: this.serviceName,
            msg,
            ...(meta || {}),
        };
        const line = JSON.stringify(entry);
        if (level === 'error')
            console.error(line);
        else if (level === 'warn')
            console.warn(line);
        else
            console.log(line);
    }
    debug(msg, meta) { this.log('debug', msg, meta); }
    info(msg, meta) { this.log('info', msg, meta); }
    warn(msg, meta) { this.log('warn', msg, meta); }
    error(msg, meta) { this.log('error', msg, meta); }
}
exports.Logger = Logger;
//# sourceMappingURL=index.js.map