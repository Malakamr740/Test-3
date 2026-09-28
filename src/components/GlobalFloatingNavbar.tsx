import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FileCheck2,
  HelpCircle,
  FolderTree,
  Target,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Compass,
  Home,
  LogOut,
  GraduationCap
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
  badge?: string
}

export const GlobalFloatingNavbar: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { session, profile, signOut } = useAuth()

  // State: expanded when mouse hovers over trigger zone or sidebar, collapsed when mouse moves away
  const [isHovered, setIsHovered] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  const navItems: NavItem[] = [
    { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'Assessments', path: '/admin/assessments', icon: <FileCheck2 className="h-4 w-4" /> },
    { label: 'Question Bank', path: '/admin/questions', icon: <HelpCircle className="h-4 w-4" /> },
    { label: 'Taxonomy (Units/Lessons)', path: '/admin/taxonomy', icon: <FolderTree className="h-4 w-4" /> },
    { label: 'Levels & Courses', path: '/admin/levels', icon: <Target className="h-4 w-4" /> },
    { label: 'Survey & Growth Plans', path: '/admin/survey-action-plans', icon: <Sparkles className="h-4 w-4" /> },
    { label: 'Settings', path: '/admin/settings', icon: <Settings className="h-4 w-4" /> },
  ]

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin'
    return location.pathname.startsWith(path)
  }

  // Mouse enter trigger zone
  const handleMouseEnter = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current)
      leaveTimerRef.current = null
    }
    setIsHovered(true)
  }

  // Mouse leave trigger zone with graceful delay
  const handleMouseLeave = () => {
    if (isPinned) return
    leaveTimerRef.current = setTimeout(() => {
      setIsHovered(false)
    }, 280)
  }

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false)
  }, [location.pathname])

  const isExpanded = isHovered || isPinned

  return (
    <>
      {/* 1. Mouse hover detector strip on left edge of screen (invisible trigger zone) */}
      <div
        className="fixed top-0 left-0 bottom-0 w-4 z-40 cursor-pointer pointer-events-auto"
        onMouseEnter={handleMouseEnter}
        aria-hidden="true"
        title="Hover to reveal navigation"
      />

      {/* 2. Floating Peek Tab on the left edge (visible indicator when collapsed) */}
      <div
        className={`fixed left-0 top-1/2 -translate-y-1/2 z-40 transition-all duration-300 pointer-events-auto ${
          isExpanded ? 'opacity-0 pointer-events-none -translate-x-full' : 'opacity-90 hover:opacity-100 translate-x-0'
        }`}
        onMouseEnter={handleMouseEnter}
      >
        <button
          type="button"
          onClick={() => setIsHovered(true)}
          className="flex flex-col items-center justify-center gap-1.5 bg-slate-900/90 hover:bg-blue-600 text-white p-2 rounded-r-xl shadow-lg backdrop-blur-xs border-r border-y border-white/20 transition-colors"
          title="Open Navigation"
        >
          <Menu className="h-4 w-4" />
          <span className="text-[9px] font-bold uppercase tracking-wider [writing-mode:vertical-rl] py-1 text-slate-300">
            Nav
          </span>
        </button>
      </div>

      {/* 3. Global Collapsible / Expandable Navigation Drawer (Desktop & Tablet) */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`fixed top-0 left-0 bottom-0 z-50 flex flex-col bg-white/95 backdrop-blur-md border-r border-slate-200/90 shadow-2xl transition-all duration-300 ease-in-out select-none ${
          isExpanded
            ? 'w-64 translate-x-0 opacity-100 pointer-events-auto'
            : '-translate-x-[calc(100%-8px)] opacity-0 pointer-events-none md:opacity-40 md:pointer-events-auto md:w-16 md:translate-x-0'
        }`}
      >
        {/* Header with App Brand & Back button */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              A
            </div>
            {isExpanded && (
              <div className="min-w-0">
                <h1 className="font-bold text-slate-900 text-sm leading-tight truncate">Assessment Hub</h1>
                <p className="text-[10px] text-slate-500 font-medium truncate">Curriculum & Diagnostics</p>
              </div>
            )}
          </div>

          {/* Pin toggle / collapse toggle */}
          {isExpanded && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsPinned(!isPinned)}
                title={isPinned ? 'Unpin auto-collapse' : 'Pin navigation bar open'}
                className={`p-1.5 rounded-lg text-xs transition ${
                  isPinned
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'text-slate-400 hover:bg-slate-200 hover:text-slate-700'
                }`}
              >
                {isPinned ? '📌' : '📍'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsHovered(false)
                  setIsPinned(false)
                }}
                title="Collapse sidebar"
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="p-2.5 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition group ${
                  active
                    ? 'bg-blue-50 text-blue-700 shadow-2xs border border-blue-100'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                }`}
              >
                <span className={`shrink-0 text-base transition-transform group-hover:scale-110 ${active ? 'text-blue-600' : 'text-slate-500'}`}>
                  {item.icon}
                </span>
                {isExpanded && <span className="truncate">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Public Assessment Flow Quick Links */}
        {isExpanded && (
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
              Student Portals
            </span>
            <Link
              to="/assessment/standard"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-white hover:text-blue-700 transition"
            >
              <GraduationCap className="h-3.5 w-3.5 text-blue-600" />
              <span className="truncate">Sample Assessment Test</span>
            </Link>
          </div>
        )}

        {/* User Account / Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                {(profile?.full_name || session?.user.email || 'U')[0].toUpperCase()}
              </div>
              {isExpanded && (
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {profile?.full_name || session?.user.email || 'Instructor'}
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    {profile?.role || 'Admin'}
                  </p>
                </div>
              )}
            </div>

            {isExpanded && session && (
              <button
                type="button"
                onClick={signOut}
                title="Sign Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* 4. Mobile Floating Header / Drawer Toggle */}
      <div className="md:hidden fixed top-3 left-3 z-40">
        <button
          type="button"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2.5 rounded-2xl bg-white/95 border border-slate-200 shadow-md text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition"
          aria-label="Toggle navigation menu"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex"
          onClick={() => setIsMobileOpen(false)}
        >
          <div
            className="w-72 bg-white h-full shadow-2xl flex flex-col p-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  A
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Assessment Studio</h2>
                  <p className="text-[10px] text-slate-500">Navigation Menu</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="space-y-1 flex-1 overflow-y-auto">
              {navItems.map((item) => {
                const active = isActive(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                      active
                        ? 'bg-blue-50 text-blue-700 border border-blue-100'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            {session && (
              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileOpen(false)
                    signOut()
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default GlobalFloatingNavbar
