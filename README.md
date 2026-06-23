# ISBoard

Gestion des entretiens annuels et professionnels — ISB France.

## Stack

- **Backend** : Django 5 + Django REST Framework + mozilla-django-oidc
- **Frontend** : React 19 + TypeScript + Vite 6 + Tailwind CSS 3
- **Base de données** : PostgreSQL 16
- **Auth** : Microsoft Entra ID (OIDC) + dev login (email)
- **Déploiement** : Docker

## Démarrage rapide

```bash
cp .env.example .env        # puis remplir les variables
docker compose up -d        # lance db + backend + frontend + adminer
```

- Frontend : http://localhost:5175
- Backend API : http://localhost:8002
- Adminer (DB) : http://localhost:8080

## Utilisateurs et rôles

| Rôle | Droits |
|---|---|
| **Admin** | Accès complet (CRUD utilisateurs, campagnes, modèles, entretiens) |
| **RH** | CRUD utilisateurs, campagnes, modèles, entretiens |
| **Manager** | Gère ses entretiens + ceux de ses N-1, voit sa hiérarchie |
| **Employé / Stagiaire / Alternant** | Accès limité à ses entretiens |

> En dev, utilisez le login par email (`/login`). Le premier compte créé reçoit le rôle RH.

## Fonctionnalités principales

| Module | Description |
|---|---|
| **Entretiens** | Annuels, professionnels, bilans, forfait-jour, fin de carrière |
| **Campagnes** | Génération automatisée d'entretiens par filtre de population |
| **Modèles** | Templates personnalisables (sections, questions textes/notes/tableaux) |
| **Utilisateurs** | Fiche complète (identité, contrat, organisation), import CSV, arbre N-1 |
| **Thèmes** | 14 thèmes couleur personnalisables, liés au compte |
| **PDF** | Génération PDF via WeasyPrint |
| **Notifications** | Alertes pour les managers (relances, signatures) |

## Variables d'environnement

```env
DEBUG=True
DJANGO_SECRET_KEY=...

DB_NAME=isboard
DB_USER=isboard
DB_PASSWORD=isboard
DB_HOST=db
DB_PORT=5432

FRONTEND_URL=http://localhost:5175
CORS_ALLOWED_ORIGINS=http://localhost:5175

# Microsoft Entra ID (optionnel en dev)
OIDC_CLIENT_ID=
OIDC_CLIENT_SECRET=
OIDC_OP_AUTHORIZATION_ENDPOINT=https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize
OIDC_OP_TOKEN_ENDPOINT=https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token
OIDC_OP_USER_ENDPOINT=https://graph.microsoft.com/oidc/userinfo
OIDC_OP_JWKS_ENDPOINT=https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys
OIDC_REDIRECT_URI=http://localhost:5175/api/auth/callback/
```

## Architecture détaillée

→ [doc/ARCHITECTURE.md](doc/ARCHITECTURE.md)

## Licence

Voir [LICENSE](LICENSE).
