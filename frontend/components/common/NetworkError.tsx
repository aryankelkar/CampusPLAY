import { useState } from 'react';

interface NetworkErrorProps {
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export default function NetworkError({ 
  message = 'Unable to connect to the server', 
  onRetry,
  showRetry = true 
}: NetworkErrorProps) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetry) return;
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setTimeout(() => setRetrying(false), 500);
    }
  };

  return (
    <div className="card p-8 text-center max-w-md mx-auto">
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Error</h3>
      <p className="text-muted mb-6">{message}</p>
      {showRetry && onRetry && (
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="btn btn-primary"
        >
          {retrying ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Retrying...
            </>
          ) : (
            'Try Again'
          )}
        </button>
      )}
      <div className="mt-4 text-xs text-muted">
        💡 Check your internet connection and try again
      </div>
    </div>
  );
}

// Hook for handling API errors with retry
export function useApiError() {
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const handleError = (err: any) => {
    if (err.response) {
      // Server responded with error
      setError(err.response.data?.message || 'Server error occurred');
    } else if (err.request) {
      // Request made but no response
      setError('Unable to reach the server. Please check your connection.');
    } else {
      // Something else happened
      setError('An unexpected error occurred');
    }
  };

  const retry = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
  };

  const clearError = () => {
    setError(null);
    setRetryCount(0);
  };

  return { error, retryCount, handleError, retry, clearError };
}
