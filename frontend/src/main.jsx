import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/index.css';

// Without this a crash while drawing the page leaves a blank screen and no clue why.
class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <pre style={{ padding: 24, whiteSpace: 'pre-wrap', font: '16px/1.6 system-ui, sans-serif' }}>
        Trang bị lỗi: {String(this.state.error.message || this.state.error)}
        {'\n\n'}Hãy tải lại trang (Ctrl+Shift+R). Nếu vẫn lỗi, gửi dòng trên cho người quản trị.
      </pre>
    );
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
