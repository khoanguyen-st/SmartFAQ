import type { ButtonHTMLAttributes, CSSProperties } from 'react'

export type SmartButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  emphasis?: 'primary' | 'secondary'
}

export const SmartButton = ({ emphasis = 'primary', style, ...props }: SmartButtonProps) => {
  const baseStyle: CSSProperties = {
    padding: '0.6rem 1.2rem',
    borderRadius: '9999px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 150ms ease, color 150ms ease',
    fontSize: '0.95rem'
  }

  const emphasisStyle: Record<NonNullable<SmartButtonProps['emphasis']>, CSSProperties> = {
    primary: {
      backgroundColor: '#047857',
      color: '#ffffff'
    },
    secondary: {
      backgroundColor: '#e2e8f0',
      color: '#0f172a'
    }
  }

  const mergedStyle = { ...baseStyle, ...emphasisStyle[emphasis], ...style }

  return <button style={mergedStyle} {...props} />
}
