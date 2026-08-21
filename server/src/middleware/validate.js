import { ApiError } from './errorHandler.js';

export function validateBody(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new ApiError(400, 'Invalid request body', result.error.flatten());
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      throw new ApiError(400, 'Invalid query parameters', result.error.flatten());
    }
    req.validatedQuery = result.data;
    next();
  };
}
