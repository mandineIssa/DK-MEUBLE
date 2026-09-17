# Checklist mise en ligne — DK MEUBLE MVP

Coche chaque case avant d’annoncer le site au client.

## 1. Contenu & contacts

- [ ] Admin → **Paramètres** : WhatsApp, téléphone, email, adresse, horaires, carte Maps
- [ ] Admin → **Paramètres** : liens Facebook, Instagram, TikTok, YouTube
- [ ] Admin → **Contenu** : textes Accueil / À propos / Contact / Devis
- [ ] Photos produits réelles uploadées (Admin → Produits → Photo)
- [ ] Prix et descriptions validés par DK MEUBLE
- [ ] Admin → **Réalisations** : remplacer les exemples Unsplash par de vrais projets
- [ ] Carte Google Maps (embed) dans Paramètres

## 2. Technique serveur

- [ ] DNS : `dkmeuble.sn`, `www.dkmeuble.sn`, `api.dkmeuble.sn` → IP serveur
- [ ] Fichier `.env` (racine) rempli : `APP_KEY`, mots de passe MySQL, CORS https
- [ ] `APP_DEBUG=false` et `APP_ENV=production`
- [ ] `ADMIN_PASSWORD` fort (pas `password`)
- [ ] `docker compose up -d --build` OK
- [ ] Seed une fois si besoin (`RUN_SEED=true` puis remettre `false`)
- [ ] HTTPS : `./scripts/init-letsencrypt.sh email@domaine.com`
- [ ] Rebuild frontend après HTTPS pour `NEXT_PUBLIC_SITE_URL=https://…`

## 3. Tests fonctionnels

- [ ] Accueil, catégories, catalogue, fiche produit
- [ ] WhatsApp ouvre la bonne conversation
- [ ] Formulaire devis → apparaît dans `/admin/devis`
- [ ] Formulaire contact → apparaît dans `/admin/messages`
- [ ] Login admin `/admin/login`
- [ ] Ajout / suppression produit + upload photo
- [ ] Mobile : bottom nav + pages lisibles
- [ ] `/sitemap.xml` et `/robots.txt` accessibles (admin bloqué)

## 4. SEO & présence

- [ ] Google Business Profile créé (Dakar)
- [ ] Titres/descriptions OK (déjà dans le code)
- [ ] Partage d’un lien produit sur WhatsApp (aperçu OK)

## 5. Sécurité

- [ ] Mot de passe admin changé et noté hors Git
- [ ] Fichiers `.env` **jamais** commités
- [ ] Backups MySQL prévus (cron ou hébergeur)
- [ ] Rate limit devis/contact déjà actif (throttle Laravel)

## Identifiants (à remplir et garder hors Git)

| Élément | Valeur |
|--------|--------|
| Admin URL | https://dkmeuble.sn/admin/login |
| Email admin | |
| Mot de passe admin | |
| WhatsApp Business | |
| Date mise en ligne | |
