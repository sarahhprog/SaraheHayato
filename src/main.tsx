import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { SiteContentProvider } from './lib/siteContent'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SiteContentProvider>
      <App />
    </SiteContentProvider>
  </React.StrictMode>,
)
