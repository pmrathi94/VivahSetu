/**
 * Wedding Controller Tests
 * Test wedding management, isolation, and role-based access
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import app from '../../src/index';

describe('Wedding Controller', () => {
  let brideToken: string;
  let groomToken: string;
  let weddingId: string;

  beforeEach(async () => {
    // Create bride account
    const brideSignup = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: 'bride@example.com',
        password: 'SecurePassword123!',
        firstName: 'Priya',
        lastName: 'Sharma',
      });
    brideToken = brideSignup.body.token;

    // Create groom account
    const groomSignup = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: 'groom@example.com',
        password: 'SecurePassword123!',
        firstName: 'Arjun',
        lastName: 'Singh',
      });
    groomToken = groomSignup.body.token;
  });

  describe('POST /api/v1/weddings/create', () => {
    it('should create a new wedding with bride and groom', async () => {
      const response = await request(app)
        .post('/api/v1/weddings/create')
        .set('Authorization', `Bearer ${brideToken}`)
        .send({
          weddingName: 'Priya & Arjun Wedding',
          brideId: 'bride-user-id',
          groomId: 'groom-user-id',
          weddingDate: '2026-05-15',
          venue: 'The Grand Palladium',
          city: 'Mumbai',
          country: 'India',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('weddingId');
      expect(response.body.weddingName).toBe('Priya & Arjun Wedding');
      weddingId = response.body.weddingId;
    });

    it('should set bride and groom as WEDDING_MAIN_ADMIN', async () => {
      const createResponse = await request(app)
        .post('/api/v1/weddings/create')
        .set('Authorization', `Bearer ${brideToken}`)
        .send({
          weddingName: 'Priya & Arjun Wedding',
          brideId: 'bride-user-id',
          groomId: 'groom-user-id',
          weddingDate: '2026-05-15',
          venue: 'The Grand Palladium',
        });

      const getResponse = await request(app)
        .get(`/api/v1/weddings/${createResponse.body.weddingId}`)
        .set('Authorization', `Bearer ${brideToken}`);

      expect(getResponse.body.roles).toEqual({
        bride: 'WEDDING_MAIN_ADMIN',
        groom: 'WEDDING_MAIN_ADMIN',
      });
    });
  });

  describe('Wedding Data Isolation', () => {
    let wedding1Id: string;
    let wedding2Id: string;

    beforeEach(async () => {
      // Create first wedding
      const w1 = await request(app)
        .post('/api/v1/weddings/create')
        .set('Authorization', `Bearer ${brideToken}`)
        .send({
          weddingName: 'Wedding 1',
          brideId: 'bride-user-id',
          groomId: 'groom-user-id',
          weddingDate: '2026-05-15',
        });
      wedding1Id = w1.body.weddingId;

      // Create second wedding
      const w2 = await request(app)
        .post('/api/v1/weddings/create')
        .set('Authorization', `Bearer ${brideToken}`)
        .send({
          weddingName: 'Wedding 2',
          brideId: 'bride-user-id-2',
          groomId: 'groom-user-id-2',
          weddingDate: '2026-06-15',
        });
      wedding2Id = w2.body.weddingId;
    });

    it('should not allow access to wedding data outside wedding scope', async () => {
      // Try to access wedding2 data while in wedding1 scope
      const response = await request(app)
        .get(`/api/v1/weddings/${wedding2Id}/guests`)
        .set('Authorization', `Bearer ${brideToken}`)
        .set('X-Wedding-ID', wedding1Id);

      expect(response.status).toBe(403);
    });

    it('should allow accessing own wedding data', async () => {
      const response = await request(app)
        .get(`/api/v1/weddings/${wedding1Id}`)
        .set('Authorization', `Bearer ${brideToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('Role-Based Access Control', () => {
    beforeEach(async () => {
      // Create wedding
      const createResponse = await request(app)
        .post('/api/v1/weddings/create')
        .set('Authorization', `Bearer ${brideToken}`)
        .send({
          weddingName: 'Priya & Arjun Wedding',
          brideId: 'bride-user-id',
          groomId: 'groom-user-id',
          weddingDate: '2026-05-15',
        });
      weddingId = createResponse.body.weddingId;
    });

    it('should only allow WEDDING_MAIN_ADMIN to manage roles', async () => {
      const response = await request(app)
        .post(`/api/v1/weddings/${weddingId}/roles/assign`)
        .set('Authorization', `Bearer ${brideToken}`)
        .send({
          userId: 'family-member-id',
          role: 'FAMILY_ADMIN',
        });

      expect(response.status).toBe(200);
    });

    it('should prevent non-WEDDING_MAIN_ADMIN from managing roles', async () => {
      // Add user as FAMILY_ADMIN first
      await request(app)
        .post(`/api/v1/weddings/${weddingId}/roles/assign`)
        .set('Authorization', `Bearer ${brideToken}`)
        .send({
          userId: 'family-member-id',
          role: 'FAMILY_ADMIN',
        });

      // Try to assign role as FAMILY_ADMIN
      const response = await request(app)
        .post(`/api/v1/weddings/${weddingId}/roles/assign`)
        .set('Authorization', `Bearer ${groomToken}`)
        .send({
          userId: 'another-user-id',
          role: 'FAMILY_MEMBER',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/v1/weddings/:id', () => {
    it('should return wedding details for authorized users', async () => {
      const createResponse = await request(app)
        .post('/api/v1/weddings/create')
        .set('Authorization', `Bearer ${brideToken}`)
        .send({
          weddingName: 'Priya & Arjun Wedding',
          brideId: 'bride-user-id',
          groomId: 'groom-user-id',
          weddingDate: '2026-05-15',
        });

      const wid = createResponse.body.weddingId;

      const response = await request(app)
        .get(`/api/v1/weddings/${wid}`)
        .set('Authorization', `Bearer ${brideToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('weddingName');
      expect(response.body).toHaveProperty('brideId');
      expect(response.body).toHaveProperty('groomId');
    });

    it('should return 404 for non-existent wedding', async () => {
      const response = await request(app)
        .get('/api/v1/weddings/non-existent-id')
        .set('Authorization', `Bearer ${brideToken}`);

      expect(response.status).toBe(404);
    });
  });
});
