/**
 * Auth Controller Tests
 * Test authentication, login, signup, OTP, JWT handling
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import app from '../../src/index';

describe('Auth Controller', () => {
  describe('POST /api/v1/auth/signup', () => {
    it('should create a new user account', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'bride@example.com',
          password: 'SecurePassword123!',
          firstName: 'Priya',
          lastName: 'Sharma',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('bride@example.com');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'invalid-email',
          password: 'SecurePassword123!',
          firstName: 'Priya',
          lastName: 'Sharma',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 409 if email already exists', async () => {
      // First signup
      await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'bride@example.com',
          password: 'SecurePassword123!',
          firstName: 'Priya',
          lastName: 'Sharma',
        });

      // Duplicate signup
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'bride@example.com',
          password: 'SecurePassword123!',
          firstName: 'Priya',
          lastName: 'Sharma',
        });

      expect(response.status).toBe(409);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'groom@example.com',
          password: 'SecurePassword123!',
          firstName: 'Arjun',
          lastName: 'Singh',
        });
    });

    it('should login user with correct credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'groom@example.com',
          password: 'SecurePassword123!',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    it('should return 401 for incorrect password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'groom@example.com',
          password: 'WrongPassword',
        });

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SecurePassword123!',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should send OTP for password reset', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({
          email: 'user@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/v1/auth/verify-otp', () => {
    it('should verify OTP and return reset token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({
          email: 'user@example.com',
          otp: '123456',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('resetToken');
    });

    it('should reject expired OTP', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({
          email: 'user@example.com',
          otp: 'expired-otp',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should invalidate JWT token', async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'groom@example.com',
          password: 'SecurePassword123!',
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);

      // Verify token is invalidated
      const verifyResponse = await request(app)
        .get('/api/v1/user/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(verifyResponse.status).toBe(401);
    });
  });
});
