'use client'

import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

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
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications')
      return res.json()
    },
    refetchInterval: 30000,
    staleTime: 25000,
  })

  const nbNew: number = notifications?.nbNew ?? 0
  const recent: Array<{
    id: number
    prenom: string
    nom: string
    score: number | null
    createdAt: string
    mandat: { ref: string; poste: string } | null
  }> = notifications?.recent ?? []

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-lg font-semibold text-[#1E293B] font-jakarta">{title}</h1>
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative p-2 text-[#64748B] hover:text-[#1F4E79] transition-colors">
              <Bell size={20} />
              {nbNew > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {nbNew > 9 ? '9+' : nbNew}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="px-3 py-2 border-b border-[#E2E8F0]">
              <p className="text-sm font-semibold text-[#1E293B]">Notifications</p>
              {nbNew > 0 && (
                <p className="text-xs text-[#64748B]">{nbNew} nouveau{nbNew > 1 ? 'x' : ''} cette semaine</p>
              )}
            </div>
            {recent.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-[#94A3B8]">
                Aucune candidature récente
              </div>
            ) : (
              recent.map((c) => (
                <DropdownMenuItem key={c.id} asChild>
                  <Link href={`/candidats/${c.id}`} className="flex flex-col items-start gap-0.5 px-3 py-2.5">
                    <span className="text-sm font-medium text-[#1E293B]">
                      {c.prenom} {c.nom}
                      {c.score != null && (
                        <span className="ml-2 text-xs text-[#1F4E79] font-semibold">{Math.round(c.score)}/100</span>
                      )}
                    </span>
                    <span className="text-xs text-[#64748B]">
                      {c.mandat?.poste} · {formatDate(c.createdAt)}
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/mandats" className="text-xs text-[#1F4E79] font-medium px-3 py-2">
                Voir tous les mandats →
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User */}
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
