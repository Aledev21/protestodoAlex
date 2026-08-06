import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Component crashed:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-base p-8">
          <div className="max-w-md rounded-2xl border border-default bg-surface p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-red-500/10">
              <AlertOctagon className="h-7 w-7 text-red-400" />
            </div>
            <h1 className="text-lg font-semibold text-primary">Algo deu errado</h1>
            <p className="mt-2 text-sm text-secondary">
              A aplicação encontrou um erro inesperado. Você pode tentar novamente — seu trabalho não foi perdido.
            </p>
            <p className="mt-3 truncate rounded-lg bg-elevated px-3 py-2 text-xs text-tertiary">
              {this.state.error?.message || 'Erro desconhecido'}
            </p>
            <button
              onClick={this.handleReset}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-primary"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * View-level boundary: isolates a single view's crash so the sidebar and
 * navigation stay intact. The user can recover without losing their place.
 */
export class ViewErrorBoundary extends Component<
  { children: ReactNode; resetKey?: string },
  State
> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidUpdate(prevProps: { resetKey?: string }) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ViewErrorBoundary] View crashed:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center p-8">
          <div className="max-w-md rounded-2xl border border-default bg-surface p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-red-500/10">
              <AlertOctagon className="h-7 w-7 text-red-400" />
            </div>
            <h1 className="text-lg font-semibold text-primary">Erro nesta tela</h1>
            <p className="mt-2 text-sm text-secondary">
              Esta tela encontrou um erro, mas o restante da aplicação continua funcionando. Você pode tentar novamente ou navegar para outra tela.
            </p>
            <p className="mt-3 truncate rounded-lg bg-elevated px-3 py-2 text-xs text-tertiary">
              {this.state.error?.message || 'Erro desconhecido'}
            </p>
            <button
              onClick={this.handleReset}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-primary"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
