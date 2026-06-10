import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const id = Number(params.id)
  const body = await req.json()

  const client = await prisma.client.update({
    where: { id },
    data: {
      nom: body.nom,
      secteur: body.secteur,
      contactNom: body.contactNom,
      contactEmail: body.contactEmail,
      telephone: body.telephone,
    },
  })

  return NextResponse.json(client)
}
