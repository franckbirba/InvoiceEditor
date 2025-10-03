import * as React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          backgroundColor: '#f5f5f5',
        }}>
          <div style={{
            maxWidth: '600px',
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          }}>
            <h1 style={{
              color: '#dc2626',
              fontSize: '24px',
              marginBottom: '1rem',
            }}>
              Une erreur est survenue
            </h1>
            <p style={{ marginBottom: '1rem', color: '#666' }}>
              L'application a rencontré une erreur inattendue.
              Essayez de recharger la page.
            </p>
            {this.state.error && (
              <details style={{
                marginBottom: '1rem',
                padding: '1rem',
                backgroundColor: '#f9f9f9',
                borderRadius: '4px',
                fontSize: '14px',
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  Détails de l'erreur
                </summary>
                <pre style={{
                  marginTop: '1rem',
                  overflow: 'auto',
                  fontSize: '12px',
                  color: '#dc2626',
                }}>
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
