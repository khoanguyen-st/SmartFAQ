import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '../App' 
import { MemoryRouter } from 'react-router-dom'

import styleText from '../styles.css?inline' 

const WIDGET_ID = 'my-chat-widget-root'

export const initWidget = () => {
  if (document.getElementById(WIDGET_ID)) {
    return
  }

  const widgetHost = document.createElement('div')
  widgetHost.id = WIDGET_ID
  widgetHost.style.position = 'fixed'; 
  widgetHost.style.zIndex = '999999';
  document.body.appendChild(widgetHost)


  const shadowRoot = widgetHost.attachShadow({ mode: 'open' })

  const styleTag = document.createElement('style')
  styleTag.textContent = styleText
  shadowRoot.appendChild(styleTag)

  // Tạo điểm Mount cho React bên trong Shadow
  const mountPoint = document.createElement('div')

  mountPoint.style.fontSize = '16px'; 
  mountPoint.style.lineHeight = '1.5';
  mountPoint.className = 'antialiased';
  
  shadowRoot.appendChild(mountPoint)

  // Mount React App
  const root = ReactDOM.createRoot(mountPoint)
  root.render(
    <React.StrictMode>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </React.StrictMode>
  )
}

// Expose ra window
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).ChatWidget = {
  init: initWidget
}

// Gọi luôn để test
initWidget()