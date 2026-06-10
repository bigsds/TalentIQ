import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import MandatForm from '@/components/mandats/MandatForm'

export default async function EditMandatPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return notFound()

  const id = Number(params.id)
  if (isNaN(id)) return notFound()

  const mandat = await prisma.mandat.findUnique({ where: { id } })
  if (!mandat) return notFound()

  const initialData = {
    id: mandat.id,
    clientId: mandat.clientId,
    poste: mandat.poste,
    lieu: mandat.lieu ?? undefined,
    secteur: mandat.secteur ?? undefined,
    nbPostes: mandat.nbPostes,
    datefinCollecte: mandat.datefinCollecte?.toISOString() ?? undefined,
    mission: mandat.mission ?? undefined,
    descriptionOffre: mandat.descriptionOffre ?? undefined,
    profilRequis: mandat.profilRequis ?? undefined,
  }

  return (
    <div>
      <Link href={`/mandats/${id}`} className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#1F4E79] mb-4 transition-colors">
        <ArrowLeft size={16} /> Retour au mandat
      </Link>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#1E293B] font-jakarta">Modifier le mandat</h2>
        <p className="text-sm text-[#64748B] mt-1">{mandat.ref} — {mandat.poste}</p>
      </div>
      <MandatForm initialData={initialData} />
    </div>
  )
}
