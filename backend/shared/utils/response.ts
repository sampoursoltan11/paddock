import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { ApiResponse } from '../types';

/**
 * Create a successful API response
 */
export function successResponse<T>(data: T, statusCode: number = 200): HttpResponseInit {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  return {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    jsonBody: response,
  };
}

/**
 * Create an error API response
 */
export function errorResponse(
  code: string,
  message: string,
  statusCode: number = 500
): HttpResponseInit {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
    },
    timestamp: new Date().toISOString(),
  };

  return {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    jsonBody: response,
  };
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(message: string): HttpResponseInit {
  return errorResponse('VALIDATION_ERROR', message, 400);
}

/**
 * Create an unauthorized error response
 */
export function unauthorizedResponse(message: string = 'Unauthorized'): HttpResponseInit {
  return errorResponse('UNAUTHORIZED', message, 401);
}

/**
 * Create a not found error response
 */
export function notFoundResponse(resource: string): HttpResponseInit {
  return errorResponse('NOT_FOUND', `${resource} not found`, 404);
}

/**
 * Create an internal server error response
 */
export function serverErrorResponse(message: string = 'Internal server error'): HttpResponseInit {
  return errorResponse('INTERNAL_ERROR', message, 500);
}
