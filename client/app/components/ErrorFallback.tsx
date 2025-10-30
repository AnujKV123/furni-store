/**
 * Error fallback components for different error scenarios
 */
"use client";

import React from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getErrorMessage, formatErrorForUser, isNetworkError } from '../lib/errorUtils';

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  title?: string;
  message?: string;
  showRetry?: boolean;
  showHome?: boolean;
  showBack?: boolean;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  title,
  message,
  showRetry = true,
  showHome = true,
  showBack = false
}) => {
  const router = useRouter();
  
  const errorInfo = error ? formatErrorForUser(error) : {
    title: title || 'Something went wrong',
    message: message || 'An unexpected error occurred',
    type: 'error' as const
  };

  const handleRetry = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-6">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {errorInfo.title}
          </h2>
          <p className="text-gray-600">
            {errorInfo.message}
          </p>
        </div>

        <div className="space-y-3">
          {showRetry && (
            <button
              onClick={handleRetry}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}
          
          {showHome && (
            <button
              onClick={handleGoHome}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go Home
            </button>
          )}
          
          {showBack && (
            <button
              onClick={handleGoBack}
              className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          )}
        </div>

        {error && process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Error Details (Development)
            </summary>
            <pre className="mt-2 text-xs text-red-600 bg-red-50 p-3 rounded overflow-auto max-h-32">
              {error.stack || error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

interface NetworkErrorFallbackProps {
  onRetry?: () => void;
}

export const NetworkErrorFallback: React.FC<NetworkErrorFallbackProps> = ({ onRetry }) => {
  return (
    <ErrorFallback
      title="Connection Error"
      message="Unable to connect to the server. Please check your internet connection and try again."
      resetError={onRetry}
      showHome={false}
      showBack={false}
    />
  );
};

interface NotFoundFallback {
  resource?: string;
}

export const NotFoundFallback: React.FC<NotFoundFallback> = ({ resource = 'page' }) => {
  return (
    <ErrorFallback
      title="Not Found"
      message={`The ${resource} you're looking for doesn't exist or has been moved.`}
      showRetry={false}
      showBack={true}
    />
  );
};