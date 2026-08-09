import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Suppress harmless internal MetaMask browser extension multiplexer logs in dev console
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('ObjectMultiplex') || args[0].includes('metamask-multichain-provider'))
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
