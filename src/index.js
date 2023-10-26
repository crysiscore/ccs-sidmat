import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import {NextUIProvider} from "@nextui-org/react";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <NextUIProvider>
  <React.StrictMode>
    <BrowserRouter> 
      <App />
      <NotificationContainer position="center"/> 
     <ToastContainer />
    </BrowserRouter>
  </React.StrictMode>
     </NextUIProvider>
);
