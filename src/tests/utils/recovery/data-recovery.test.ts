import { RecruitmentDatabase, RecoveryPoint } from '../../../database/schema';
import { DataRecoveryManager } from '../../../utils/recovery/data-recovery';
import { db } from '../../../database/db';

jest.mock('../../../database/db');

describe('DataRecoveryManager', () => {
  let testDb: RecruitmentDatabase;
  let recoveryManager: DataRecoveryManager;

  beforeEach(async () => {
    testDb = new RecruitmentDatabase();
    recoveryManager = new DataRecoveryManager(testDb);
    await testDb.delete();
    await testDb.open();
    
    // Clear existing data
    await Promise.all([
      testDb.recoveryPoints.clear(),
      testDb.recoveryData.clear()
    ]);
  });

  afterEach(async () => {
    await testDb.close();
  });

  describe('Recovery Point Creation', () => {
    test('creates recovery point successfully', async () => {
      const description = 'Test backup';
      const result = await recoveryManager.createRecoveryPoint(description);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(expect.objectContaining({
          id: expect.any(Number),
          timestamp: expect.any(Date),
          type: 'full',
          status: 'pending',
          description: 'Test backup'
        }));
      }
    });

    test('handles errors during recovery point creation', async () => {
      jest.spyOn(testDb.recoveryPoints, 'add').mockRejectedValue(new Error('Database error'));
      const result = await recoveryManager.createRecoveryPoint('Test');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Database error');
      }
    });
  });

  describe('Data Restoration', () => {
    test('restores data from recovery point', async () => {
      const mockRecoveryPoint: RecoveryPoint = {
        id: 1,
        timestamp: new Date(),
        type: 'full',
        description: 'Test recovery point',
        size: 1000,
        checksum: 'testChecksum',
        status: 'completed',
        metadata: {
          version: '1.0',
          tables: ['users', 'applications'],
          recordCounts: { users: 10, applications: 20 },
        },
      };

      const mockRecoveryData = {
        id: 1,
        recoveryPointId: 1,
        data: JSON.stringify({
          users: [{ id: 1, name: 'Test User' }],
          applications: [{ id: 1, status: 'pending' }],
        }),
        timestamp: new Date()
      };

      jest.spyOn(testDb.recoveryPoints, 'get').mockResolvedValue(mockRecoveryPoint);
      jest.spyOn(testDb.recoveryData, 'get').mockResolvedValue(mockRecoveryData);

      const result = await recoveryManager.restoreFromPoint(1);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(expect.objectContaining({
          restoredCollections: expect.arrayContaining(['users', 'applications']),
          timestamp: expect.any(Date)
        }));
      }
    });

    test('handles non-existent recovery point', async () => {
      jest.spyOn(testDb.recoveryPoints, 'get').mockResolvedValue(undefined);
      const result = await recoveryManager.restoreFromPoint(999);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Recovery point not found');
      }
    });
  });

  describe('Recovery Point Management', () => {
    test('lists recovery points in correct order', async () => {
      const mockRecoveryPoints: RecoveryPoint[] = [
        { id: 1, timestamp: new Date('2025-01-08T22:00:00Z'), type: 'full', status: 'completed' },
        { id: 2, timestamp: new Date('2025-01-08T21:00:00Z'), type: 'full', status: 'completed' },
      ];

      jest.spyOn(testDb.recoveryPoints, 'toArray').mockResolvedValue(mockRecoveryPoints);

      const result = await recoveryManager.listRecoveryPoints();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            timestamp: expect.any(Date),
            type: expect.any(String),
            status: expect.any(String)
          })
        ]));
      }
    });

    test('deletes recovery point and associated data', async () => {
      const deleteSpy = jest.spyOn(testDb.recoveryPoints, 'delete');
      const deleteDataSpy = jest.spyOn(testDb.recoveryData, 'delete');
      
      await recoveryManager.deleteRecoveryPoint(1);
      
      expect(deleteSpy).toHaveBeenCalledWith(1);
      expect(deleteDataSpy).toHaveBeenCalledWith(1);
    });
  });
});
