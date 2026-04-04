export class ApiError extends Error {
  public statusCode: number;
  public success: false;
  public errors: { field?: string; message: string }[];
  public errorCode?: string;
  public isOperational: boolean;

  constructor({
    statusCode = 500,
    message = "Something went wrong",
    errors = [],
    errorCode,
    isOperational = true,
  }: {
    statusCode?: number;
    message?: string;
    errors?: { field?: string; message: string }[];
    errorCode?: string;
    isOperational?: boolean;
  }) {
    super(message);
    this.name = 'ApiError';

    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
    this.errorCode = errorCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}