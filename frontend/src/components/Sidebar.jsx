import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: OverviewIcon },
  { to: '/documents', label: 'Documents', icon: DocsIcon },
  { to: '/chat', label: 'Chat', icon: ChatIcon },
  { to: '/evaluation', label: 'Evaluation', icon: EvalIcon },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <aside className="w-60 shrink-0 border-r border-schematic bg-panel flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-schematic">
        <div className="flex items-center gap-2.5">
          <LogoMark />
          <div>
            <div className="font-mono font-bold text-sm tracking-tight text-ink-primary">RAGForge</div>
            <div className="label-tag">Document Intelligence</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-schematic">
        <div className="px-2 mb-3">
          <div className="text-sm text-ink-primary truncate">{user?.full_name || user?.email}</div>
          <div className="text-xs text-ink-faint truncate">{user?.email}</div>
        </div>
        <button
          onClick={() => { logout(); navigate('/login') }}
          className="nav-link w-full justify-start"
        >
          <LogoutIcon className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}

function LogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="6" cy="14" r="2.5" fill="#5EEAD4" />
      <circle cx="14" cy="6" r="2.5" fill="#5EEAD4" opacity="0.6" />
      <circle cx="14" cy="22" r="2.5" fill="#5EEAD4" opacity="0.6" />
      <circle cx="22" cy="14" r="3" fill="#5EEAD4" />
      <path d="M8.2 12.8L12 7.5M8.2 15.2L12 20.5M16.3 7.2L20 12.5M16.3 20.8L20 15.5" stroke="#2A3441" strokeWidth="1.5" />
    </svg>
  )
}

function OverviewIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <rect x="2.5" y="2.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="11.5" y="2.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2.5" y="11.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="11.5" y="11.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}
function DocsIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <path d="M5 2.5h7l3 3v12a1 1 0 01-1 1H5a1 1 0 01-1-1v-14a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 9h6M7 12.5h6M7 16h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
function ChatIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <path d="M3 4.5h14a1 1 0 011 1v8a1 1 0 01-1 1H8l-4 3v-3H3a1 1 0 01-1-1v-8a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}
function EvalIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <path d="M3 17V10M9 17V4M15 17v-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M2 17.5h16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
function LogoutIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <path d="M8 17H4a1 1 0 01-1-1V4a1 1 0 011-1h4M13 14l4-4-4-4M17 10H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
