import {
  Component,
  Fragment,
  type ErrorInfo,
  type ReactNode,
} from 'react';

type AppErrorBoundaryProps = Readonly<{
  children: ReactNode;
  fallback: (actions: {
    retry: () => void;
  }) => ReactNode;
  resetKey?: string | number;
  onError?: (error: Error) => void;
  onRetry?: () => void;
}>;

type AppErrorBoundaryState = Readonly<{
  failed: boolean;
  revision: number;
}>;

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    failed: false,
    revision: 0,
  };

  static getDerivedStateFromError(): Partial<AppErrorBoundaryState> {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error);
    if (import.meta.env.DEV) {
      console.error('Gym Buddies interface boundary caught an error.', {
        error,
        componentStack: info.componentStack,
      });
    }
  }

  componentDidUpdate(previousProps: AppErrorBoundaryProps) {
    if (
      this.state.failed &&
      previousProps.resetKey !== this.props.resetKey
    ) {
      this.setState((state) => ({
        failed: false,
        revision: state.revision + 1,
      }));
    }
  }

  private retry = () => {
    this.props.onRetry?.();
    this.setState((state) => ({
      failed: false,
      revision: state.revision + 1,
    }));
  };

  render() {
    if (this.state.failed) {
      return this.props.fallback({ retry: this.retry });
    }
    return (
      <Fragment key={this.state.revision}>
        {this.props.children}
      </Fragment>
    );
  }
}
