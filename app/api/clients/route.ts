import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const clientSchema = z.object({
  nom: z.string().min(1),
  secteur: z.string().optional(),
  contactNom: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  telephone: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || undefined

  const clients = await prisma.client.findMany({
    where: search ? { nom: { contains: search, mode: 'insensitive' } } : {},
    orderBy: { nom: 'asc' },
    include: { _count: { select: { mandats: true } } },
  })

  return NextResponse.json(clients)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const parsed = clientSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const client = await prisma.client.create({ data: parsed.data })
  return NextResponse.json(client, { status: 201 })
}
