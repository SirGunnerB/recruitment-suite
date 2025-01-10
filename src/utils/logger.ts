import debug from 'debug';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

class Logger {
  private namespace: string;
  private debuggers: Record<LogLevel, debug.Debugger>;

  constructor(namespace: string) {
    this.namespace = namespace;
    this.debuggers = {
      error: debug(`${namespace}:error`),
      warn: debug(`${namespace}:warn`),
      info: debug(`${namespace}:info`),
      debug: debug(`${namespace}:debug`)
    };

    // Error and warn levels are always enabled
    debug.enable(`${namespace}:error,${namespace}:warn`);
  }

  error(message: string, ...args: any[]): void {
    this.debuggers.error(message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.debuggers.warn(message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.debuggers.info(message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    this.debuggers.debug(message, ...args);
  }

  // Create child logger with sub-namespace
  child(subNamespace: string): Logger {
    return new Logger(`${this.namespace}:${subNamespace}`);
  }
}

export const createLogger = (namespace: string): Logger => new Logger(namespace);
