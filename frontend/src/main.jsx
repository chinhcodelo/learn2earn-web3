import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Web3Provider } from './context/Web3Context'; // Import Web3Provider
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Web3Provider> {/* Bọc ứng dụng bằng Web3Provider */}
        <App />
      </Web3Provider>
    </BrowserRouter>
  </React.StrictMode>,
);