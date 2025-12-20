import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // 確保這裡引用的是你上傳的 CSS 檔名
import App from './App'; // 確保這裡引用的是你的主程式 App.jsx (不用寫副檔名)

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
