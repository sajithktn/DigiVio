import { Response } from 'express';

export interface ApiResponseSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiResponseError {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

export const sendSuccess = <T>(res: Response, data: T, statusCode = 200): void => {
  res.status(statusCode).json({
    ok: true,
    data,
  });
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  code: string = 'ERROR'
): void => {
  res.status(statusCode).json({
    ok: false,
    error: {
      code,
      message,
    },
  });
};
