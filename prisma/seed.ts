import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@softtalent.app'
  const password = process.env.ADMIN_SEED_PASSWORD || 'ChangeMeNow2024!'
  const nom = process.env.ADMIN_NOM || 'Administrateur'

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`✓ Admin déjà existant : ${email}`)
    return
  }

  const hash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { email, password: hash, nom, role: 'admin' },
  })

  console.log(`✓ Admin créé : ${user.email} (id=${user.id})`)
  console.log(`  Mot de passe : ${password}`)
  console.log(`  ⚠️  Changez ce mot de passe immédiatement après la première connexion !`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
