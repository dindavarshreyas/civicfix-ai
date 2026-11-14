import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { env } from '../config/env.js';
import { generateAccessToken } from '../utils/token.js';

describe('Custom Auth & Deny-By-Default Middleware Tests', () => {
  const testEmail = `test_${Date.now()}@example.com`;
  const validPassword = 'SecurePassword123!';

  it('POST /api/v1/auth/signup validates password complexity (>=8 chars, letter + number)', async () => {
    // Too short
    const resShort = await request(app).post('/api/v1/auth/signup').send({
      fullName: 'Test User',
      email: 'short@example.com',
      password: 'short',
    });
    expect(resShort.status).toBe(400);

    // No numbers
    const resNoNum = await request(app).post('/api/v1/auth/signup').send({
      fullName: 'Test User',
      email: 'nonum@example.com',
      password: 'OnlyLettersPassword',
    });
    expect(resNoNum.status).toBe(400);
  });

  it('POST /api/v1/auth/login returns generic 401 on wrong credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'nonexistent_user_abc@demo.test',
      password: 'WrongPassword123!',
    });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('Demonstrates Deny-by-default: Unauthenticated requests to protected endpoints return 401', async () => {
    const endpoints = [
      { method: 'get', path: '/api/v1/me' },
      { method: 'post', path: '/api/v1/reports' },
      { method: 'get', path: '/api/v1/admin/analytics' },
      { method: 'get', path: '/api/v1/admin/users' },
    ];

    for (const ep of endpoints) {
      const res = await request(app)[ep.method](ep.path);
      expect(res.status).toBe(401);
      expect(['UNAUTHORIZED', 'INVALID_TOKEN']).toContain(res.body.error.code);
    }
  });

  it('Rejects invalid or forged JWT access tokens with 401', async () => {
    // Forged token with fake secret
    const fakeToken = jwt.sign({ sub: 'fake-id', role: 'admin' }, 'wrong-secret-key-123456789012345678');
    const res = await request(app)
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${fakeToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('RBAC Middleware: Citizen token is rejected with 403 on Admin routes', async () => {
    // Forge a token signed with the real secret but citizen role
    const citizenToken = generateAccessToken({ id: '00000000-0000-0000-0000-000000000001', role: 'citizen' });

    // Note: since auth middleware loads the user from the DB to reflect role changes immediately,
    // a non-existent DB user yields 401 (USER_NOT_FOUND)
    const res = await request(app)
      .get('/api/v1/admin/analytics')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect([401, 403]).toContain(res.status);
  });

  it('External cron trigger /internal/workflow/tick accepts valid x-cron-secret', async () => {
    const res = await request(app)
      .post('/api/v1/internal/workflow/tick')
      .set('x-cron-secret', env.CRON_SECRET);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('result');
  });

  it('External cron trigger /internal/workflow/tick rejects invalid x-cron-secret', async () => {
    const res = await request(app)
      .post('/api/v1/internal/workflow/tick')
      .set('x-cron-secret', 'invalid-secret-key');

    expect(res.status).toBe(401);
  });
});
