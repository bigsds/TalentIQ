import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const mandatId = Number(searchParams.get('mandatId'))
  if (!mandatId) return NextResponse.json({ error: 'mandatId requis' }, { status: 400 })

  const shortlists = await prisma.shortlist.findMany({
    where: { mandatId },
    orderBy: { rang: 'asc' },
    include: { candidature: true },
  })

  return NextResponse.json(shortlists)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { mandatId, candidatureId } = await req.json()

  const shortlist = await prisma.shortlist.upsert({
    where: { mandatId_candidatureId: { mandatId, candidatureId } },
    create: { mandatId, candidatureId },
    update: {},
  })

  await prisma.candidature.update({
    where: { id: candidatureId },
    data: { statut: 'shortliste' },
  })

  return NextResponse.json(shortlist, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { mandatId, candidatureId } = await req.json()

  await prisma.shortlist.delete({
    where: { mandatId_candidatureId: { mandatId, candidatureId } },
  })

  return NextResponse.json({ ok: true })
}
