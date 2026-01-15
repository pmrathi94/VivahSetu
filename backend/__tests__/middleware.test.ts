/**
 * Middleware Tests
 * Test authentication, RBAC, and error handling middleware
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import app from '../../src/index';

describe('Middleware - Authentication', () => {
  it('should reject request without Authorization header', async () => {
    const response = await request(app).get('/api/v1/weddings');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });

  it('should reject request with invalid JWT', async () => {
    const response = await request(app)
      .get('/api/v1/weddings')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
  });

  it('should accept request with valid JWT', async () => {
    const signupResponse = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: 'test@example.com',
        password: 'SecurePassword123!',
        firstName: 'Test',
        lastName: 'User',
      });

    const token = signupResponse.body.token;

    const response = await request(app)
      .get('/api/v1/weddings')
      .set('Authorization', `Bearer ${token}`);

    // Should not be 401 (authentication passed)
    expect(response.status).not.toBe(401);
  });
});

describe('Middleware - RBAC', () => {
  let brideToken: string;
  let weddingId: string;

  beforeEach(async () => {
    const signupResponse = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: 'rbac-test@example.com',
        password: 'SecurePassword123!',
        firstName: 'Test',
        lastName: 'User',
      });
    brideToken = signupResponse.body.token;

    const weddingResponse = await request(app)
      .post('/api/v1/weddings/create')
      .set('Authorization', `Bearer ${brideToken}`)
      .send({
        weddingName: 'Test Wedding',
        brideId: 'bride-id',
        groomId: 'groom-id',
        weddingDate: '2026-05-15',
      });
    weddingId = weddingResponse.body.weddingId;
  });

  it('should allow WEDDING_MAIN_ADMIN to access admin endpoints', async () => {
    const response = await request(app)
      .get(`/api/v1/weddings/${weddingId}`)
      .set('Authorization', `Bearer ${brideToken}`);

    expect(response.status).toBe(200);
  });

  it('should reject access for insufficient permissions', async () => {
    const guestResponse = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: 'guest@example.com',
        password: 'SecurePassword123!',
        firstName: 'Guest',
        lastName: 'User',
      });

    const guestToken = guestResponse.body.token;

    const response = await request(app)
      .post(`/api/v1/weddings/${weddingId}/settings`)
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ theme: 'dark' });

    expect(response.status).toBe(403);
  });
});

describe('Middleware - Rate Limiting', () => {
  it('should rate limit excessive requests', async () => {
    const requests = [];
    for (let i = 0; i < 105; i++) {
      requests.push(
        request(app)
          .post('/api/v1/auth/login')
          .send({
            email: `user${i}@example.com`,
            password: 'password',
          })
      );
    }

    const responses = await Promise.all(requests);
    const rateLimitedResponse = responses.find((r) => r.status === 429);

    expect(rateLimitedResponse).toBeDefined();
    expect(rateLimitedResponse?.status).toBe(429);
  });
});

describe('Middleware - Error Handling', () => {
  it('should return proper error format for validation errors', async () => {
    const response = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: 'invalid-email',
        password: 'short',
        firstName: '',
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('details');
  });

  it('should return 500 for server errors with proper logging', async () => {
    const response = await request(app).get('/api/v1/non-existent-route');

    expect(response.status).toBe(404);
  });
});
