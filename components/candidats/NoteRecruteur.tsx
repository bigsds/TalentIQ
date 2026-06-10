'use client'

import { useState, useEffect, useRef } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Check, Loader2 } from 'lucide-react'

interface NoteRecruteurProps {
  candidatureId: number
  initialNote: string | null
}

export default function NoteRecruteur({ candidatureId, initialNote }: NoteRecruteurProps) {
  const [note, setNote] = useState(initialNote ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  async function saveNote(value: string) {
    setSaving(true)
    setSaved(false)
    try {
      await fetch(`/api/candidatures/${candidatureId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteRecruteur: value }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  function handleChange(value: string) {
    setNote(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => saveNote(value), 1000)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide">
          📝 Note recruteur
        </h3>
        <span className="text-xs text-[#94A3B8] flex items-center gap-1">
          {saving && <><Loader2 size={12} className="animate-spin" /> Sauvegarde...</>}
          {saved && <><Check size={12} className="text-green-500" /> Sauvegardé</>}
          {!saving && !saved && 'Visible uniquement en interne'}
        </span>
      </div>
      <Textarea
        value={note}
        onChange={e => handleChange(e.target.value)}
        placeholder="Ajoutez vos observations sur ce candidat..."
        rows={4}
        className="resize-none text-sm"
      />
    </div>
  )
}
