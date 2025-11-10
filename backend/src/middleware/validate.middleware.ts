import type { Request, Response, NextFunction } from 'express';
import { type ZodObject, ZodError } from 'zod';
import { createErrorResponse, ErrorCode } from '../types/errors';

export const validate = (schema: ZodObject<any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json(
                    createErrorResponse(
                        'Validation failed',
                        ErrorCode.VALIDATION_ERROR,
                        error.issues.map((err) => ({
                            field: err.path.join('.'),
                            message: err.message,
                        }))
                    )
                );
            }
            next(error);
        }
    };
};
