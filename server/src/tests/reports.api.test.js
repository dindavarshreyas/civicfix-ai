import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

describe('Server API Endpoints', () => {
  it('GET /api/v1/health returns 200/503 health status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('services');
  });

  it('GET /api/v1/issues returns public issue list structure', async () => {
    const res = await request(app).get('/api/v1/issues');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('issues');
    expect(Array.isArray(res.body.issues)).toBe(true);
  });

  it('POST /api/v1/reports rejects unauthenticated requests with 401', async () => {
    const res = await request(app).post('/api/v1/reports').send({
      latitude: 12.97,
      longitude: 77.59,
      description: 'Pothole on the road',
      consent: true,
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('Returns 404 for unknown endpoints', async () => {
    const res = await request(app).get('/api/v1/nonexistent-route-xyz');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
  });
});
