import { createLogger } from './logger';

const logger = createLogger('error-tracking');

interface ErrorContext {
  userId?: string;
  component?: string;
  action?: string;
  [key: string]: any;
}

class ErrorTracker {
  private static instance: ErrorTracker;
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  initialize(config: { environment: string; version: string }): void {
    if (this.isInitialized) {
      return;
    }

    // Initialize error tracking service here
    window.onerror = (message, source, lineno, colno, error) => {
      this.trackError(error || new Error(String(message)), {
        source,
        lineno,
        colno
      });
    };

    window.onunhandledrejection = (event) => {
      this.trackError(event.reason, {
        type: 'unhandled-rejection'
      });
    };

    this.isInitialized = true;
    logger.info('Error tracking initialized', config);
  }

  trackError(error: Error, context: ErrorContext = {}): void {
    logger.error('Error tracked:', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context
    });

    // Here you would typically send the error to your error tracking service
    // e.g., Sentry, LogRocket, etc.
  }

  setUser(userId: string): void {
    logger.info('User set for error tracking', { userId });
  }

  clearUser(): void {
    logger.info('User cleared from error tracking');
  }
}

export const errorTracker = ErrorTracker.getInstance();
