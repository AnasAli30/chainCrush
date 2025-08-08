'use client'

import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons'
import { useTheme } from './ThemeProvider'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-6 right-6 z-50 p-4 rounded-2xl backdrop-blur-xl border shadow-2xl hover:scale-110 transition-all duration-300 group"
      style={{
        backgroundColor: `var(--glass-background)`,
        borderColor: `var(--glass-border)`,
        color: `rgb(var(--text-primary))`,
        boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.2)'
      }}
    >
      <FontAwesomeIcon 
        icon={theme === 'light' ? faMoon : faSun} 
        className="text-lg transition-transform duration-300 group-hover:scale-110"
      />
    </button>
  )
}
