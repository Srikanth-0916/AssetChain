import { describe, it, expect } from 'vitest';
import { generateToken, JWTPayload } from '../src/middleware/auth';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

describe('Backend Auth & Token Verification', () => {
  it('Should generate and verify valid JWT tokens', () => {
    const payload: JWTPayload = {
      userId: 'test-uuid-123',
      email: 'investor@assetchain.io',
      role: 'investor',
    };

    const token = generateToken(payload);
    expect(token).toBeTypeOf('string');

    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    expect(decoded.userId).toBe('test-uuid-123');
    expect(decoded.email).toBe('investor@assetchain.io');
    expect(decoded.role).toBe('investor');
  });
});
