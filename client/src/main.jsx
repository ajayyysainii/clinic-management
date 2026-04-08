import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router";
import { UserProvider } from './context/UserProvider.jsx';
import { setupAxiosInterceptors } from './utils/axiosInterceptor.js';
import './index.css'
import App from './App.jsx'

// Setup axios interceptors for automatic auth token handling
setupAxiosInterceptors();

const routerBasename =
  import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '')

createRoot(document.getElementById('root')).render(
  
  <BrowserRouter basename={routerBasename}>
    <UserProvider>
      <StrictMode>
        <App />
      </StrictMode>
    </ UserProvider>
  </BrowserRouter>


)
