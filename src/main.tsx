import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AgriVision AI Uncaught Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#090d16', color: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ maxWidth: '520px', width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '20px', padding: '32px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>
              ⚠️
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#fff' }}>AgriVision AI Loading Notice</h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px', lineHeight: '1.5' }}>
              {this.state.error?.message || 'A browser cache or initialization issue occurred while loading AgriVision AI.'}
            </p>
            <button
              onClick={() => {
                try {
                  localStorage.clear();
                  sessionStorage.clear();
                  if ('caches' in window) {
                    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
                  }
                } catch {
                  // ignore
                }
                window.location.reload();
              }}
              style={{ background: '#10b981', color: '#022c22', fontWeight: 'bold', border: 'none', borderRadius: '12px', padding: '12px 24px', cursor: 'pointer', fontSize: '14px' }}
            >
              Reset Cache & Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
