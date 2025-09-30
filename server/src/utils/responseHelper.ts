import { Response } from 'express';

/**
 * Standardized API response helper
 * 
 * For successful responses, returns the data directly without wrapping
 * For error responses, uses the standardized error format
 */

export const sendSuccess = (res: Response, data: any, statusCode: number = 200) => {
  return res.status(statusCode).json(data);
};

export const sendError = (res: Response, message: string, statusCode: number = 500) => {
  return res.status(statusCode).json({
    result: "error",
    error_code: statusCode,
    error_message: message,
  });
};

export const sendNotFound = (res: Response, message: string = "Resource not found") => {
  return sendError(res, message, 404);
};

export const sendBadRequest = (res: Response, message: string = "Bad request") => {
  return sendError(res, message, 400);
};

export const sendUnauthorized = (res: Response, message: string = "Unauthorized") => {
  return sendError(res, message, 401);
};

export const sendForbidden = (res: Response, message: string = "Forbidden") => {
  return sendError(res, message, 403);
};

export const sendInternalError = (res: Response, message: string = "Internal server error") => {
  return sendError(res, message, 500);
};
