'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  BarChart3,
  Search,
  Settings,
  LogOut,
} from 'lucide-react'
import { signOut } from 'next-auth/react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/mandats', label: 'Mandats', icon: FileText },
  { href: '/candidats', label: 'Candidats', icon: Users },
  { href: '/clients', label: 'Clients', icon: Building2 },
  { href: '/rapports', label: 'Rapports', icon: BarChart3 },
  { href: '/recherche', label: 'Recherche IA', icon: Search },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-[#1F4E79] flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-[#2E75B6]">
        <span className="text-white font-jakarta font-bold text-xl tracking-tight">
          Soft<span className="text-[#7EC8E3]">Talent</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-white/20 text-white'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="py-4 px-3 border-t border-[#2E75B6] space-y-1">
        <Link
          href="/parametres"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-200 hover:bg-white/10 hover:text-white transition-colors"
        >
          <Settings size={18} />
          Paramètres
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-200 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
        <p className="text-xs text-blue-300/50 px-3 pt-2">Version 1.0</p>
      </div>
    </aside>
  )
}
