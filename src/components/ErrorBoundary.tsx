import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: '24px',
          fontFamily: 'monospace',
          background: '#fff1f0',
          minHeight: '100vh',
          color: '#333',
        }}>
          <h2 style={{ color: '#c0392b', marginBottom: '12px' }}>Something went wrong</h2>
          <pre style={{
            background: '#fff',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #ffccc7',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            fontSize: '13px',
          }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
