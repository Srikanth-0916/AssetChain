import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ValidationError } from '../utils/errors';

/**
 * Request validation middleware factory using Zod schemas.
 *
 * @param schema - Zod schema to validate against
 * @param source - Which part of the request to validate ('body', 'query', 'params')
 *
 * @example
 * router.post('/register', validate(registerSchema, 'body'), controller.register);
 */
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[source]);
      // Replace the source with parsed (and transformed) data
      req[source] = parsed;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        throw new ValidationError('Invalid request data', details);
      }
      throw error;
    }
  };
}
