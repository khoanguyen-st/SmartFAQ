import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '../App'
import { MemoryRouter } from 'react-router-dom'

import styleText from '../styles.css?inline'

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

  const shadowRoot = widgetHost.attachShadow({ mode: 'open' })

  const fixedStyleText = styleText.replace(':root', ':host')

  const styleTag = document.createElement('style')
  styleTag.textContent = fixedStyleText
  shadowRoot.appendChild(styleTag)

  const mountPoint = document.createElement('div')
  mountPoint.id = 'root-mount'
  mountPoint.className = 'widget-app antialiased font-sans'

  mountPoint.style.fontSize = '16px'
  mountPoint.style.lineHeight = '1.5'
  mountPoint.style.setProperty('--color-blue', '#003087')
  mountPoint.style.setProperty('--color-white', '#ffffff')
  mountPoint.style.setProperty('--color-gray-bg', '#f3f4f6')
  mountPoint.style.setProperty('--color-dark', '#111827')

  shadowRoot.appendChild(mountPoint)

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
