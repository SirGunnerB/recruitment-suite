import { globalCache } from '../../utils/cache';

describe('Cache', () => {
  beforeEach(() => {
    globalCache.clear();
  });

  it('sets and gets values', () => {
    globalCache.set('test', 'value');
    expect(globalCache.get('test')).toBe('value');
  });

  it('handles TTL expiration', async () => {
    globalCache.set('test', 'value', 100); // 100ms TTL
    expect(globalCache.get('test')).toBe('value');
    
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(globalCache.get('test')).toBeNull();
  });

  it('deletes values', () => {
    globalCache.set('test', 'value');
    globalCache.delete('test');
    expect(globalCache.get('test')).toBeNull();
  });

  it('clears all values', () => {
    globalCache.set('test1', 'value1');
    globalCache.set('test2', 'value2');
    globalCache.clear();
    expect(globalCache.get('test1')).toBeNull();
    expect(globalCache.get('test2')).toBeNull();
  });
});
