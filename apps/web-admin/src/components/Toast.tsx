import React, { useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

interface ToastProps {
  type: 'success' | 'error' | 'warning'
  message: string
  onClose: () => void
  duration?: number
}

export const Toast: React.FC<ToastProps> = ({ type, message, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className="h-5 w-5 text-emerald-600" />,
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          textColor: 'text-emerald-800'
        }
      case 'error':
        return {
          icon: <XCircle className="h-5 w-5 text-red-600" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800'
        }
      case 'warning':
        return {
          icon: <AlertCircle className="h-5 w-5 text-amber-600" />,
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-800'
        }
    }
  }

  const config = getConfig()

  return (
    <div className="animate-in slide-in-from-top-5 fixed top-4 right-4 z-50">
      <div
        className={`flex items-center gap-3 rounded-xl border ${config.borderColor} ${config.bgColor} max-w-md min-w-[320px] px-4 py-3 shadow-lg`}
      >
        {config.icon}
        <p className={`flex-1 text-sm font-medium ${config.textColor}`}>{message}</p>
        <button onClick={onClose} className={`rounded-lg p-1 hover:bg-black/5 ${config.textColor}`} aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default Toast
