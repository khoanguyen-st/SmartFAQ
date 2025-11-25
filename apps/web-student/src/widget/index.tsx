import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '../App' // Hoặc component ChatWidget của bạn
import '../styles.css' // QUAN TRỌNG: Import CSS (Tailwind/Global styles) để style đi theo widget
import { MemoryRouter } from 'react-router-dom'

const WIDGET_ID = 'my-chat-widget-root'

export const initWidget = () => {
  // 1. Kiểm tra xem widget đã tồn tại chưa để tránh trùng lặp
  if (document.getElementById(WIDGET_ID)) {
    return
  }

  // 2. Tạo container cho widget
  const widgetDiv = document.createElement('div')
  widgetDiv.id = WIDGET_ID
  document.body.appendChild(widgetDiv)

  // 3. Mount React App vào div vừa tạo
  const root = ReactDOM.createRoot(widgetDiv)
  root.render(
    <React.StrictMode>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </React.StrictMode>
  )
}

// Tự động khởi chạy khi script được load (tùy chọn)
// window.onload = initWidget;
// Hoặc gán vào window để trang web chủ tự gọi
;(window as any).ChatWidget = {
  init: initWidget
}
// Gọi luôn để test:
initWidget()
