import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          result: "error",
          error_code: 400,
          error_message: 'Validation failed'
        });
      }
      return res.status(400).json({
        result: "error",
        error_code: 400,
        error_message: 'Validation failed'
      });
    }
  };
}; 