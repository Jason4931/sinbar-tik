import { describe, expect, beforeEach, afterAll, it, jest } from '@jest/globals';
import { register, verifyToken, login, logout } from '../src/auth';
import { prisma } from '../src/prisma';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { Request, Response } from 'express';

// Mock Express Request
function createMockRequest(body: any, headers: any = {}): Request {
  return {
    body,
    headers,
  } as Request;
}

// Mock Express Response
function createMockResponse(): Response {
  const res: any = {};

  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();

  return res as Response;
}

describe('Auth Functions', () => {
  beforeEach(async () => {
    await prisma.users.deleteMany({});
  });

  afterAll(async () => {
    await prisma.users.deleteMany({});

    // DEMO (REMOVE ON PROD): Add example user and admin user
    await prisma.users.create({ data: { username: 'user', password: bcrypt.hashSync('pwd', 10) } });
    await prisma.users.create({ data: { username: 'admin', password: bcrypt.hashSync('pwd', 10), is_admin: true } });

    await prisma.$disconnect();
  });

  it('should register a new user', async () => {
    const req = createMockRequest({ username: 'testuser', password: 'testpassword' });
    const res = createMockResponse();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ username: 'testuser' }));
  });

  it('should fail to register with missing username or password', async () => {
    const req1 = createMockRequest({ password: 'testpassword' });
    const res1 = createMockResponse();

    const req2 = createMockRequest({ username: 'testuser' });
    const res2 = createMockResponse();

    await register(req1, res1);
    await register(req2, res2);

    expect(res1.status).toHaveBeenCalledWith(422);
    expect(res2.status).toHaveBeenCalledWith(422);
  });

  it('should verify a valid remember token', async () => {
    let token = crypto.randomBytes(16).toString('hex');
    await prisma.users.create({ data: { username: 'testuser', password: bcrypt.hashSync('testpassword', 10), remember_token: token } });

    const req = createMockRequest({}, { authorization: `Bearer ${token}` });
    const res = createMockResponse();

    await verifyToken(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'User found' });
  });

  it('should fail to verify an invalid remember token', async () => {
    const req = createMockRequest({}, { authorization: 'Bearer invalidtoken' });
    const res = createMockResponse();

    await verifyToken(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
  });

  it('should login a user and generate a remember token', async () => {
    const req1 = createMockRequest({ username: 'testuser', password: 'testpassword' });
    const res1 = createMockResponse();

    await register(req1, res1);

    const req2 = createMockRequest({ username: 'testuser', password: 'testpassword' });
    const res2 = createMockResponse();

    await login(req2, res2);

    expect(res2.status).toHaveBeenCalledWith(200);
    expect(res2.json).toHaveBeenCalledWith(expect.objectContaining({ remember_token: expect.any(String) }));
  });

  it('should fail to login with incorrect password', async () => {
    const req1 = createMockRequest({ username: 'testuser', password: 'testpassword' });
    const res1 = createMockResponse();

    await register(req1, res1);

    const req2 = createMockRequest({ username: 'testuser', password: 'wrongpassword' });
    const res2 = createMockResponse();

    await login(req2, res2);

    expect(res2.status).toHaveBeenCalledWith(401);
    expect(res2.json).toHaveBeenCalledWith({ message: 'Incorrect password' });
  });

  it('should logout a user by invalidating the remember token', async () => {
    let token = crypto.randomBytes(16).toString('hex');
    await prisma.users.create({ data: { username: 'testuser', password: bcrypt.hashSync('testpassword', 10), remember_token: token } });

    const req = createMockRequest({}, { authorization: `Bearer ${token}` });
    const res = createMockResponse();

    await logout(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'User logged out' });
  });
});

describe('User Functions', () => {
  afterAll(async () => {
    await prisma.users.delete({ where: { username: 'testuser' } });

    await prisma.$disconnect();
  });

  // !TODO: Must add token for admin authorization, return error if not admin

  // HAPPY PATH TESTS
  it('should create a new user', async () => {
    const req = createMockRequest({ username: 'testuser', password: 'testpwd' });
    const res = createMockResponse();

    await create(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ username: 'testuser' }));
  });
  it('should index all users', async () => {
    const req = createMockRequest({});
    const res = createMockResponse();

    await index(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ username: 'testuser' }));
  })
  it('should read a user by id', async () => {
    const user = await prisma.users.findUnique({ where: { username: 'testuser' } });

    if (!user) throw new Error('TESTERR: User not found');

    const req = createMockRequest({ id: user.id });
    const res = createMockResponse();

    await read(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ username: 'testuser' }));
  });
  it('should search user by fuzzy username', async () => {
    const req = createMockRequest({ q: "test" });
    const res = createMockResponse();

    await search(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ username: 'testuser' }));
  });
});