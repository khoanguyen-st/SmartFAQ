import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '../App'
import { MemoryRouter } from 'react-router-dom'

import styleText from '../styles.css?inline'

declare global {
  interface Window {
    ChatWidget: {
      init: (config?: ChatWidgetConfig) => void
    }
  }
}

const WIDGET_ID = 'my-chat-widget-root'

export interface ChatWidgetConfig {
  apiBaseUrl?: string
  position?: {
    bottom?: string
    right?: string
    left?: string
    top?: string
  }
  zIndex?: number
}

// Store config globally
let widgetConfig: ChatWidgetConfig = {}

export const initWidget = (config?: ChatWidgetConfig) => {
  if (document.getElementById(WIDGET_ID)) {
    return
  }

  // Merge config
  widgetConfig = {
    apiBaseUrl: config?.apiBaseUrl || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    position: config?.position || { bottom: '0', right: '0' },
    zIndex: config?.zIndex || 2147483647
  }

  // Store API URL in window for the app to use
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).__CHAT_WIDGET_API_URL__ = widgetConfig.apiBaseUrl

  const widgetHost = document.createElement('div')
  widgetHost.id = WIDGET_ID
  widgetHost.style.position = 'fixed'
  widgetHost.style.zIndex = String(widgetConfig.zIndex)

  // Apply position
  const position = widgetConfig.position
  if (position?.bottom) widgetHost.style.bottom = position.bottom
  if (position?.right) widgetHost.style.right = position.right
  if (position?.left) widgetHost.style.left = position.left
  if (position?.top) widgetHost.style.top = position.top

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

// Export for Vite library mode
export const init = initWidget

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).ChatWidget = {
  init: initWidget
}

// Auto-init only in standalone mode (not when embedded)
if (import.meta.env.DEV && !document.getElementById(WIDGET_ID)) {
  initWidget()
}
