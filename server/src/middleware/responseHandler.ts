import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Response {
      success: (data: any, message?: string) => Response;
      created: (data: any, message?: string) => Response;
      noContent: () => Response;
    }
  }
}

export const responseHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Add success method to response object
  res.success = function (data: any, message = 'Success') {
    return this.status(200).json({
      status: 'success',
      message,
      data,
    });
  };

  // Add created method to response object
  res.created = function (data: any, message = 'Resource created successfully') {
    return this.status(201).json({
      status: 'success',
      message,
      data,
    });
  };

  // Add noContent method to response object
  res.noContent = function () {
    return this.status(204).send();
  };

  next();
}; 