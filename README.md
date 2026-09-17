# DK MEUBLE — Monorepo

Site vitrine MVP : catalogue, devis, contact, WhatsApp, admin — sans paiement en ligne.

## Stack

- **Frontend** : Next.js 14 (App Router, TypeScript, Tailwind)
- **Backend** : Laravel 11 (API REST, Sanctum)
- **Base** : MySQL 8 (prod) / SQLite (local)
- **Infra** : Docker Compose + nginx

## Démarrage local (dev)

### Backend

```bash
cd backend
cp .env.example .env   # si besoin ; SQLite déjà possible
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

API : http://127.0.0.1:8000  
Admin seed : email/mot de passe via `ADMIN_EMAIL` / `ADMIN_PASSWORD` (défaut local : `admin@dkmeuble.sn` / `password`).

## Checklist mise en ligne

Voir **[MISE_EN_LIGNE.md](./MISE_EN_LIGNE.md)** (contacts, DNS, HTTPS, tests, sécurité).

## Compte client (V2)

- Connexion OTP : `/compte/connexion` → `/compte/verification` → `/compte`
- SMS : driver `log` en local (code dans `storage/logs/laravel.log`) ; `twilio` en prod
- OAuth Google/Facebook : configurer les clés dans `.env` (Socialite)

```bash
# Backend + frontend déjà démarrés
./scripts/smoke-test.sh
# Windows :
powershell -ExecutionPolicy Bypass -File scripts/smoke-test.ps1
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Site : http://localhost:3000

## Docker (production / staging)

```bash
cp .env.example .env
# Renseigner APP_KEY, mots de passe, WhatsApp, domaines
# Générer une clé : cd backend && php artisan key:generate --show

docker compose up -d --build
```

- Site : http://dkmeuble.sn (DNS → serveur)
- API : http://api.dkmeuble.sn

Premier seed démo (optionnel) :

```bash
# dans .env : RUN_SEED=true puis
docker compose up -d --build backend
# remettre RUN_SEED=false ensuite
```

Migrations : lancées automatiquement au démarrage du conteneur `backend`.

## Pages MVP

**Public** : Accueil, Produits, Fiche produit, Réalisations, À propos, Devis, Contact  
**Admin** : `/admin` — dashboard, produits (+ upload photo), devis, messages

## HTTPS (Let's Encrypt)

**Prérequis** : DNS `dkmeuble.sn`, `www.dkmeuble.sn`, `api.dkmeuble.sn` → IP du serveur ; ports **80** et **443** ouverts.

```bash
# 1. Stack en HTTP
docker compose up -d --build

# 2. Certificats + activation SSL (sur le serveur Linux)
chmod +x scripts/*.sh
./scripts/init-letsencrypt.sh vous@email.com
```

Ensuite le site répond en **https://**. Le service `certbot` renouvelle automatiquement.

Renouvellement manuel :

```bash
./scripts/renew-certs.sh
```

Pour revenir en HTTP (dev) : `cp` de la config bootstrap — le fichier source SSL reste dans `nginx/default.ssl.conf`.
