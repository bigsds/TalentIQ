'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('Email ou mot de passe incorrect.')
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1F4E79] flex-col justify-center items-center p-12">
        <div className="max-w-sm text-center">
          <h1 className="text-4xl font-bold text-white font-jakarta mb-4">
            Soft<span className="text-[#7EC8E3]">Talent</span>
          </h1>
          <p className="text-blue-200 text-lg leading-relaxed">
            La plateforme intelligente de gestion du recrutement pour cabinets RH
          </p>
          <div className="mt-12 grid grid-cols-2 gap-4 text-left">
            {[
              { label: 'Scoring IA', desc: 'Évaluation automatique des CVs' },
              { label: 'Shortlist', desc: 'Sélection des meilleurs profils' },
              { label: 'Rapports', desc: 'Analyses et statistiques' },
              { label: 'Multi-clients', desc: 'Gestion centralisée' },
            ].map(item => (
              <div key={item.label} className="bg-white/10 rounded-xl p-4">
                <p className="text-white font-semibold text-sm">{item.label}</p>
                <p className="text-blue-200 text-xs mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-[#1F4E79] font-jakarta">
              Soft<span className="text-[#2E75B6]">Talent</span>
            </h1>
          </div>

          <h2 className="text-2xl font-bold text-[#1E293B] font-jakarta mb-2">Connexion</h2>
          <p className="text-[#64748B] mb-8">Accédez à votre espace de recrutement</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@cabinet.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#1F4E79]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-[#1F4E79] hover:bg-[#2E75B6] text-white h-11"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Connexion...
                </>
              ) : (
                'Se connecter'
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-[#94A3B8] mt-8">
            {process.env.NEXT_PUBLIC_APP_NAME || 'SoftTalent'} — Accès réservé
          </p>
        </div>
      </div>
    </div>
  )
}
