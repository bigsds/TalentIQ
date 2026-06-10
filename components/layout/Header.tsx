'use client'

import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/mandats': 'Mandats',
  '/clients': 'Clients',
  '/rapports': 'Rapports',
  '/recherche': 'Recherche IA',
  '/candidats': 'Candidats',
  '/parametres': 'Paramètres',
}

interface HeaderProps {
  user: {
    name?: string | null
    email?: string | null
  }
}

export default function Header({ user }: HeaderProps) {
  const pathname = usePathname()

  const title = Object.entries(pageTitles).find(([key]) =>
    pathname === key || pathname.startsWith(key + '/')
  )?.[1] ?? 'SoftTalent'

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-lg font-semibold text-[#1E293B] font-jakarta">{title}</h1>
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-[#64748B] hover:text-[#1F4E79] transition-colors">
          <Bell size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-[#1F4E79] text-white text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-[#64748B] hidden sm:block">{user.name}</span>
        </div>
      </div>
    </header>
  )
}
