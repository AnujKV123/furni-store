/**
 * Error handling utilities for the frontend
 */

export interface ApiErrorResponse {
  success: false;
  error: string | {
    code?: string;
    message: string;
    details?: any;
    field?: string;
  };
}

export interface ValidationError {
  field: string;
  message: string;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly field?: string;
  public readonly code?: string;

  constructor(message: string, statusCode = 500, field?: string, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.field = field;
    this.code = code;
    this.name = 'AppError';
  }
}

/**
 * Extract error message from various error formats
 */
export const getErrorMessage = (error: unknown): string => {
  if (!error) return 'An unexpected error occurred';

  // Handle AppError
  if (error instanceof AppError) {
    return error.message;
  }

  // Handle standard Error
  if (error instanceof Error) {
    return error.message;
  }

  // Handle API error responses
  if (typeof error === 'object' && error !== null) {
    const apiError = error as any;
    
    // Handle axios error response
    if (apiError.response?.data) {
      const responseData = apiError.response.data;
      
      if (typeof responseData.error === 'string') {
        return responseData.error;
      }
      
      if (typeof responseData.error === 'object' && responseData.error.message) {
        return responseData.error.message;
      }
      
      if (responseData.message) {
        return responseData.message;
      }
    }
    
    // Handle direct error object
    if (apiError.error) {
      if (typeof apiError.error === 'string') {
        return apiError.error;
      }
      if (apiError.error.message) {
        return apiError.error.message;
      }
    }
    
    if (apiError.message) {
      return apiError.message;
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
};

/**
 * Extract validation errors from API response
 */
export const getValidationErrors = (error: unknown): ValidationError[] => {
  if (!error || typeof error !== 'object') return [];

  const apiError = error as any;
  const responseData = apiError.response?.data || apiError;

  // Handle structured validation errors
  if (responseData.error?.details?.validationErrors) {
    return responseData.error.details.validationErrors;
  }

  // Handle field-specific errors
  if (responseData.error?.field && responseData.error?.message) {
    return [{
      field: responseData.error.field,
      message: responseData.error.message
    }];
  }

  return [];
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  
  const apiError = error as any;
  return (
    apiError.code === 'NETWORK_ERROR' ||
    apiError.message === 'Network Error' ||
    !apiError.response
  );
};

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  
  const apiError = error as any;
  return apiError.response?.status === 401;
};

/**
 * Check if error is a validation error
 */
export const isValidationError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  
  const apiError = error as any;
  return apiError.response?.status === 400;
};

/**
 * Format error for user display
 */
export const formatErrorForUser = (error: unknown): {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info';
} => {
  const message = getErrorMessage(error);

  if (isNetworkError(error)) {
    return {
      title: 'Connection Error',
      message: 'Please check your internet connection and try again.',
      type: 'warning'
    };
  }

  if (isAuthError(error)) {
    return {
      title: 'Authentication Required',
      message: 'Please log in to continue.',
      type: 'info'
    };
  }

  if (isValidationError(error)) {
    return {
      title: 'Validation Error',
      message,
      type: 'warning'
    };
  }

  return {
    title: 'Error',
    message,
    type: 'error'
  };
};