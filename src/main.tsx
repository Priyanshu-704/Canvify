import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App.tsx'
import { CanvasProvider } from './context/CanvasContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CanvasProvider>
      <App />
    </CanvasProvider>
  </React.StrictMode>,
)
