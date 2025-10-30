/**
 * React Query specific error boundary with retry and reset capabilities
 */
"use client";

import React from 'react';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from './ErrorBoundary';
import { ErrorFallback } from './ErrorFallback';
import { isNetworkError, isAuthError } from '../lib/errorUtils';

interface QueryErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

export const QueryErrorBoundary: React.FC<QueryErrorBoundaryProps> = ({ 
  children, 
  fallback 
}) => {
  const { reset } = useQueryErrorResetBoundary();

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Query Error Boundary caught error:', error, errorInfo);
  };

  const CustomFallback: React.FC<{ error?: Error; resetError: () => void }> = ({ 
    error, 
    resetError 
  }) => {
    const handleReset = () => {
      reset(); // Reset React Query error state
      resetError(); // Reset error boundary state
    };

    if (fallback) {
      const FallbackComponent = fallback;
      return <FallbackComponent error={error} resetError={handleReset} />;
    }

    // Special handling for different error types
    if (error && isNetworkError(error)) {
      return (
        <ErrorFallback
          error={error}
          resetError={handleReset}
          title="Connection Error"
          message="Unable to load data. Please check your connection and try again."
        />
      );
    }

    if (error && isAuthError(error)) {
      return (
        <ErrorFallback
          error={error}
          resetError={handleReset}
          title="Authentication Required"
          message="Please log in to access this content."
          showRetry={false}
        />
      );
    }

    return (
      <ErrorFallback 
        error={error} 
        resetError={handleReset}
        title="Failed to Load Data"
        message="We encountered an error while loading the data. Please try again."
      />
    );
  };

  return (
    <ErrorBoundary fallback={CustomFallback} onError={handleError}>
      {children}
    </ErrorBoundary>
  );
};