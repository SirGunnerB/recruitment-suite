import { createLogger } from '../../utils/logger';

describe('Logger', () => {
  let logger: ReturnType<typeof createLogger>;

  beforeEach(() => {
    logger = createLogger('test');
  });

  it('creates a logger with namespace', () => {
    expect(logger).toBeDefined();
  });

  it('logs at different levels', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    logger.error('error message');
    logger.warn('warn message');
    logger.info('info message');
    logger.debug('debug message');

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('creates child loggers', () => {
    const childLogger = logger.child('child');
    expect(childLogger).toBeDefined();
  });
});
