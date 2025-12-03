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
  widgetHost.style.position = 'fixed'
  widgetHost.style.zIndex = '2147483647'
  widgetHost.style.bottom = '0'
  widgetHost.style.right = '0'
  document.body.appendChild(widgetHost)

  //Tạo Shadow DOM
  const shadowRoot = widgetHost.attachShadow({ mode: 'open' })

  //Nhúng CSS (Tailwind) vào trong Shadow
  const styleTag = document.createElement('style')
  styleTag.textContent = styleText
  shadowRoot.appendChild(styleTag)

  // 4. Tạo điểm Mount cho React
  const mountPoint = document.createElement('div')
  mountPoint.id = 'root-mount'
  mountPoint.className = 'widget-app antialiased'

  mountPoint.style.fontSize = '16px'
  mountPoint.style.lineHeight = '1.5'

  mountPoint.style.width = '100%'
  mountPoint.style.height = '100%'

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
