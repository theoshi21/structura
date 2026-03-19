'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from '@/components/Logo'

/** Navigation links for the student sidebar */
const navLinks = [
  { href: '/student/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/student/events', label: 'My Events', icon: '📅' },
  { href: '/student/documents', label: 'Documents', icon: '📁' },
  { href: '/student/checklists', label: 'Checklists', icon: '✅' },
  { href: '/student/budget', label: 'Budget', icon: '💰' },
]

/** Mock student user data */
const mockUser = {
  name: 'Alex Rivera',
  org: 'Computer Science Society',
  initial: 'A',
}

/**
 * Individual sidebar nav link with active state highlight.
 * Uses usePathname to determine if the link is currently active.
 */
function NavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body font-medium
        transition-colors duration-150
        ${isActive
          ? 'bg-primary text-white'
          : 'text-mid-gray hover:text-off-white hover:bg-white/5'
        }
      `}
    >
      <span className="text-base" aria-hidden="true">{icon}</span>
      {label}
    </Link>
  )
}

/**
 * Fixed left sidebar for the student portal.
 * Contains logo, role badge, nav links, and user info at the bottom.
 */
function StudentSidebar() {
  return (
    <aside className="fixed top-0 left-0 h-screen w-56 bg-[#16162A] border-r border-white/5 flex flex-col z-40">
      {/* Top: Logo + role badge */}
      <div className="px-5 pt-6 pb-4 flex flex-col gap-3">
        <Logo white />
        <span className="inline-flex items-center self-start rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold font-body text-white tracking-wide">
          Student
        </span>
      </div>

      {/* Divider */}
      <div className="mx-5 border-t border-white/10" />

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1" aria-label="Student navigation">
        {navLinks.map((link) => (
          <NavLink key={link.href} {...link} />
        ))}
      </nav>

      {/* Bottom: User info + logout */}
      <div className="px-4 pb-6 pt-4 border-t border-white/10 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar circle */}
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-white font-body">{mockUser.initial}</span>
          </div>
          {/* Name + org */}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-off-white font-body truncate">{mockUser.name}</span>
            <span className="text-xs text-mid-gray font-body truncate">{mockUser.org}</span>
          </div>
        </div>
        {/* Log out link */}
        <a
          href="#"
          className="text-xs text-mid-gray hover:text-off-white font-body transition-colors duration-150"
          onClick={(e) => e.preventDefault()}
        >
          ← Log out
        </a>
      </div>
    </aside>
  )
}

/**
 * Root layout for the student portal.
 * Renders the fixed sidebar and a scrollable main content area.
 */
export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-near-black flex">
      <StudentSidebar />
      {/* Main content — offset by sidebar width */}
      <main className="flex-1 ml-56 min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
