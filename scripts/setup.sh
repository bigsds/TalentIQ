#!/usr/bin/env bash
set -e

echo "═══════════════════════════════════════════════════════════"
echo "  SoftTalent — Script de configuration initiale"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📋 Création de .env depuis .env.example..."
    cp .env.example .env
    echo "   → Fichier .env créé. Éditez-le avant de continuer."
    echo ""
fi

# Generate secrets
echo "🔐 Génération des secrets..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)
N8N_ENCRYPTION_KEY=$(openssl rand -hex 32)

echo "   NEXTAUTH_SECRET = $NEXTAUTH_SECRET"
echo "   N8N_ENCRYPTION_KEY = $N8N_ENCRYPTION_KEY"
echo ""

# Update .env with generated secrets
if command -v sed &> /dev/null; then
    sed -i "s|CHANGE_ME_GENERATE_WITH_OPENSSL$|$NEXTAUTH_SECRET|" .env
    sed -i "s|CHANGE_ME_GENERATE_WITH_OPENSSL_HEX|$N8N_ENCRYPTION_KEY|" .env
    echo "   ✓ Secrets mis à jour dans .env"
else
    echo "   ⚠️  Mettez à jour manuellement NEXTAUTH_SECRET et N8N_ENCRYPTION_KEY dans .env"
fi

echo ""
echo "📌 Prochaines étapes :"
echo "   1. Éditez .env et remplissez TOUTES les valeurs CHANGE_ME"
echo "   2. Créez le réseau Docker proxy: docker network create proxy"
echo "   3. Démarrez les services: docker compose up -d"
echo "   4. Attendez que postgres soit healthy: docker compose ps"
echo "   5. Lancez les migrations: docker compose exec softtalent npx prisma migrate deploy"
echo "   6. Créez le premier admin: docker compose exec softtalent npx prisma db seed"
echo "   7. Accédez à https://\$APP_DOMAIN"
echo ""
echo "📚 Documentation: voir README.md"
