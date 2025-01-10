import { RecruitmentDatabase } from '../../../database/schema';
import { SecurityManager } from '../../../utils/security/advanced-security';
import { User } from '../../../types/user';

describe('SecurityManager', () => {
  let db: RecruitmentDatabase;
  let securityManager: SecurityManager;
  let testUser: User;

  beforeEach(async () => {
    db = new RecruitmentDatabase();
    securityManager = SecurityManager.getInstance();
    await db.delete();
    await db.open();

    testUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      department: 'IT',
      location: 'HQ',
      team: 'Development',
      permissions: ['read', 'write'],
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active'
    };
  });

  afterEach(async () => {
    await db.close();
  });

  describe('Session Management', () => {
    it('should validate active sessions', async () => {
      const session = await db.sessions.add({
        userId: testUser.id,
        token: 'valid-token',
        lastActive: new Date(),
        expiresAt: new Date(Date.now() + 3600000)
      });

      const isValid = await securityManager.validateSession(session.toString());
      expect(isValid).toBe(true);
    });

    it('should invalidate expired sessions', async () => {
      const session = await db.sessions.add({
        userId: testUser.id,
        token: 'expired-token',
        lastActive: new Date(Date.now() - 7200000),
        expiresAt: new Date(Date.now() - 3600000)
      });

      const isValid = await securityManager.validateSession(session.toString());
      expect(isValid).toBe(false);
    });
  });

  describe('Audit Logging', () => {
    it('should log audit events', async () => {
      await securityManager.logAudit({
        userId: testUser.id,
        action: 'login',
        resource: 'system',
        details: { ip: '127.0.0.1' },
        ip: '127.0.0.1',
        userAgent: 'test-agent'
      });

      const logs = await db.auditLogs.toArray();
      expect(logs).toHaveLength(1);
      expect(logs[0].userId).toBe(testUser.id);
    });
  });

  describe('Security Events', () => {
    it('should log security events', async () => {
      await securityManager.logSecurityEvent({
        type: 'login_attempt',
        userId: testUser.id,
        success: true,
        details: { ip: '127.0.0.1' },
        ip: '127.0.0.1'
      });

      const events = await db.securityEvents.toArray();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('login_attempt');
    });
  });
});
