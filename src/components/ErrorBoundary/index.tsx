import Button from '@app/components/Common/Button';
import React from 'react';

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('Unhandled UI error', error, errorInfo);
  }

  private reset = (): void => {
    this.setState({ hasError: false, error: undefined });
  };

  public render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center text-white">
        <h2 className="text-2xl font-bold">Something went wrong.</h2>
        <p className="mt-2 max-w-xl text-sm text-gray-300">
          The page crashed unexpectedly. You can try reloading, or go back and try again.
        </p>
        {this.state.error?.message && (
          <pre className="mt-4 max-w-3xl overflow-auto rounded-md bg-gray-900 p-4 text-left text-xs text-gray-200">
            {this.state.error.message}
          </pre>
        )}
        <div className="mt-6 flex gap-3">
          <Button buttonType="primary" onClick={() => window.location.reload()}>
            Reload
          </Button>
          <Button onClick={() => this.reset()}>Try again</Button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;

