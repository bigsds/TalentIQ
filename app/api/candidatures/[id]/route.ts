import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const id = Number(params.id)
  const candidature = await prisma.candidature.findUnique({
    where: { id },
    include: { mandat: { include: { client: true } } },
  })

  if (!candidature) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  return NextResponse.json(candidature)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const id = Number(params.id)
  const body = await req.json()

  const allowed = ['statut', 'noteRecruteur', 'recommendation']
  const data: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) data[key] = body[key]
  }

  const candidature = await prisma.candidature.update({ where: { id }, data })
  return NextResponse.json(candidature)
}
