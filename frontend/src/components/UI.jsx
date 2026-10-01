import React from 'react'

export function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-2'
  }

  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block rounded-full border-slate-200 border-t-slate-800 animate-spin ${sizes[size] || sizes.md} ${className}`}
    />
  )
}

export function Empty({ icon = '✨', title = 'Nothing here yet', text = '' }) {
  return (
    <div className="text-center py-8 max-w-sm mx-auto">
      {icon && <div className="text-3xl mb-3">{icon}</div>}
      <h3 className="text-sm font-medium text-slate-900">{title}</h3>
      {text && <p className="text-xs text-slate-500 mt-1">{text}</p>}
    </div>
  )
}

export function Stat({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
      {icon && <div className="text-xl text-slate-600">{icon}</div>}
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-lg font-semibold text-slate-900 mt-0.5">{value}</p>
      </div>
    </div>
  )
}

export function Toast({ message, type = 'error', onClose }) {
  if (!message) return null

  const theme = {
    success: 'bg-slate-900 text-emerald-400',
    warning: 'bg-slate-900 text-amber-400',
    info: 'bg-slate-900 text-blue-400',
    error: 'bg-slate-900 text-red-400'
  }[type] || 'bg-slate-900 text-white'

  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close notification"
      className={`fixed bottom-4 right-4 z-50 px-4 py-2.5 rounded-lg shadow-lg text-xs font-medium cursor-pointer transition hover:opacity-90 active:scale-[0.98] ${theme}`}
    >
      {message}
    </button>
  )
}
