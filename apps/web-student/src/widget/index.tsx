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
  widgetHost.style.zIndex = '999999'
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
