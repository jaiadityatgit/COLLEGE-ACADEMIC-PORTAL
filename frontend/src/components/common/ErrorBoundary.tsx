import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface p-6">
          <div className="max-w-xl w-full bg-white rounded-2xl border border-red-200 p-6 shadow-lg animate-fade-in">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 font-bold text-xl mb-4">
              ⚠️
            </div>
            <h2 className="text-lg font-bold text-ink mb-1">Application Render Error</h2>
            <p className="text-xs text-ink-muted mb-4">
              A runtime exception occurred while rendering this component.
            </p>

            <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-xs font-mono text-red-700 mb-4 overflow-x-auto">
              {this.state.error?.toString()}
            </div>

            {this.state.errorInfo?.componentStack && (
              <details className="mb-4 text-xs font-mono text-ink-faint">
                <summary className="cursor-pointer font-bold text-ink hover:underline mb-2">Component Stack Trace</summary>
                <pre className="p-3 bg-surface rounded-xl border border-surface-border overflow-x-auto max-h-48 text-[11px]">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <button
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                window.location.href = "/login";
              }}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              Return to Login Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
