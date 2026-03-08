import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Optional custom fallback UI. Receives the error and a reset callback. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /**
   * Optional display name used in the default fallback heading.
   * E.g. "Song List" → "Song List encountered a problem".
   */
  name?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary — Catches React render errors and displays a fallback UI.
 *
 * Supports two modes:
 *   1. Full-page fallback (default): replaces the entire child subtree with a
 *      prominent error card and a "Reload Page" button.
 *   2. Inline fallback (via `fallback` prop): lets the parent supply a custom
 *      compact error UI (e.g. a toast or an error banner inside a panel).
 *
 * Usage — full-page (existing behavior):
 *   <ErrorBoundary>
 *     <MyComponent />
 *   </ErrorBoundary>
 *
 * Usage — inline / section-level:
 *   <ErrorBoundary
 *     name="Song List"
 *     fallback={(error, reset) => (
 *       <div>
 *         <p>Song list failed: {error.message}</p>
 *         <button onClick={reset}>Retry</button>
 *       </div>
 *     )}
 *   >
 *     <SongList … />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`[ErrorBoundary${this.props.name ? ` (${this.props.name})` : ''}] caught an error:`, error, errorInfo);
  }

  reset(): void {
    this.setState({ hasError: false, error: undefined });
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      const error = this.state.error ?? new Error('Unknown error');

      // Custom fallback provided by the parent
      if (this.props.fallback) {
        return this.props.fallback(error, this.reset);
      }

      // Default full-page fallback
      const sectionLabel = this.props.name ? `${this.props.name} encountered a problem` : 'Something went wrong';
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
          <div className="text-center animate-fade-in-up max-w-md mx-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-hard p-8">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="h-8 w-8 text-red-600 dark:text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2" role="alert">
                {sectionLabel}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error.message || 'An unexpected error occurred'}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={this.reset}
                  className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 font-medium py-2 px-4 rounded"
                >
                  Try again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
