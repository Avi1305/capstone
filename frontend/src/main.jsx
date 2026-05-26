import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import store from './store/store'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'hsl(220, 13%, 13%)',
          color: 'hsl(220, 15%, 94%)',
          border: '1px solid hsl(220, 13%, 20%)',
          borderRadius: '10px',
          fontSize: '13px',
          fontFamily: 'Inter, sans-serif',
        },
        success: {
          iconTheme: { primary: 'hsl(142, 70%, 45%)', secondary: 'hsl(220, 13%, 13%)' },
        },
        error: {
          iconTheme: { primary: 'hsl(0, 72%, 58%)', secondary: 'hsl(220, 13%, 13%)' },
        },
      }}
    />
  </Provider>
)
