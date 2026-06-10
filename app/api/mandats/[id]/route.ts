import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const id = Number(params.id)
  if (isNaN(id)) return NextResponse.json({ error: 'ID invalide' }, { status: 400 })

  const mandat = await prisma.mandat.findUnique({
    where: { id },
    include: {
      client: true,
      _count: { select: { candidatures: true, shortlists: true } },
    },
  })

  if (!mandat) return NextResponse.json({ error: 'Mandat introuvable' }, { status: 404 })

  const scoreAgg = await prisma.candidature.aggregate({
    where: { mandatId: id, score: { not: null } },
    _avg: { score: true },
  })

  return NextResponse.json({ ...mandat, scoreMoyen: scoreAgg._avg.score })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const id = Number(params.id)
  const body = await req.json()

  const mandat = await prisma.mandat.update({
    where: { id },
    data: body,
    include: { client: true },
  })

  return NextResponse.json(mandat)
}
