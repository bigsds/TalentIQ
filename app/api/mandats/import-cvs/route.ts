import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { n8n } from '@/lib/n8n'
import { z } from 'zod'

const schema = z.object({
  mandat_id: z.number().int().positive(),
  file_ids: z.array(z.string().min(1)).min(1).max(50),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Paramètres invalides', details: parsed.error.flatten() }, { status: 400 })
  }

  const { mandat_id, file_ids } = parsed.data

  const mandat = await prisma.mandat.findUnique({ where: { id: mandat_id }, select: { id: true, ref: true, poste: true } })
  if (!mandat) return NextResponse.json({ error: 'Mandat introuvable' }, { status: 404 })

  const result = await n8n.importCvsBatch({ mandat_id, file_ids })

  if ('skipped' in result && result.skipped) {
    return NextResponse.json({
      success: false,
      warning: 'N8n non configuré — import ignoré',
      mandat_ref: mandat.ref,
    }, { status: 200 })
  }

  return NextResponse.json({
    success: true,
    message: `Import de ${file_ids.length} CV(s) lancé pour ${mandat.ref} — ${mandat.poste}`,
    count: file_ids.length,
    mandat_ref: mandat.ref,
  })
}
