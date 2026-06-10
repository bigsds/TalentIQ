import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import MandatForm from '@/components/mandats/MandatForm'

export default function NewMandatPage() {
  return (
    <div>
      <Link href="/mandats" className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#1F4E79] mb-4 transition-colors">
        <ArrowLeft size={16} /> Mandats
      </Link>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#1E293B] font-jakarta">Nouveau mandat</h2>
        <p className="text-sm text-[#64748B] mt-1">Créez un nouveau mandat de recrutement</p>
      </div>
      <MandatForm />
    </div>
  )
}
