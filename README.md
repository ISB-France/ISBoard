# ISBoard

Gestion des entretiens annuels et professionnels — ISB France.

## Stack

- **Backend** : Django 5 + DRF + mozilla-django-oidc
- **Frontend** : React + TypeScript + Vite
- **Base de données** : PostgreSQL 16
- **Auth** : Microsoft Entra ID (OIDC)
- **Déploiement** : Docker

## Démarrer

```bash
cp .env.example .env  # puis remplir les variables
docker compose up -d
```

- Frontend : http://localhost:5175
- Backend API : http://localhost:8002

## Configuration .env

```env
DEBUG=True
DJANGO_SECRET_KEY=votre-cle-secrete

DB_NAME=isboard
DB_USER=isboard
DB_PASSWORD=isboard
DB_HOST=db
DB_PORT=5432

FRONTEND_URL=http://localhost:5175
CORS_ALLOWED_ORIGINS=http://localhost:5175

# Microsoft Entra ID
OIDC_CLIENT_ID=
OIDC_CLIENT_SECRET=
OIDC_OP_AUTHORIZATION_ENDPOINT=https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize
OIDC_OP_TOKEN_ENDPOINT=https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token
OIDC_OP_USER_ENDPOINT=https://graph.microsoft.com/oidc/userinfo
OIDC_OP_JWKS_ENDPOINT=https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys
OIDC_REDIRECT_URI=http://localhost:5175/api/auth/callback/
```

## Mode dev

Sans Microsoft, utiliser le login dev sur la page de connexion (n'importe quel email).
Le premier compte créé aura le rôle RH.
