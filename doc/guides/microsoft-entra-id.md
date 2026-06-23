# Connexion Microsoft Entra ID (OIDC)

Ce guide explique comment configurer Microsoft Entra ID (Azure AD) comme fournisseur d'authentification pour remplacer la gestion des mots de passe.

## Prérequis

- Compte Azure avec le rôle **Cloud Application Administrator** (ou équivalent)
- Accès au portail Azure : https://portal.azure.com

## 1. Créer l'App Registration

1. Connectez-vous sur [https://portal.azure.com](https://portal.azure.com)
2. Recherchez **Microsoft Entra ID** dans la barre de recherche
3. Menu à gauche → **App registrations** → **New registration**
4. Remplissez :
   - **Name** : `ISBibliotheque` (ou le nom de votre choix)
   - **Supported account types** : `Accounts in this organizational directory only` (si ISB Group only)
   - **Redirect URI** : `Web` → `http://localhost:3001/api/auth/callback`
5. Cliquez **Register**

> **Important** : Le Redirect URI doit correspondre exactement à l'URL d'accès au backend.
> - Dev (Docker) : `http://localhost:3001/api/auth/callback`
> - Dev (sans Docker) : `http://localhost:4000/api/auth/callback`
> - Production : `https://votre-domaine.fr/api/auth/callback`

## 2. Récupérer les identifiants

Sur la page de l'application créée, notez :

| Champ | Emplacement |
|---|---|
| **Application (client) ID** | Page Overview → `Application (client) ID` |
| **Directory (tenant) ID** | Page Overview → `Directory (tenant) ID` |

## 3. Générer le Client Secret

1. Menu à gauche → **Certificates & secrets** → **Client secrets** → **New client secret**
2. **Description** : `ISBibliotheque dev`
3. **Expires** : 180 days (ou 1 an selon votre politique)
4. Cliquez **Add**
5. **Copiez la Value immédiatement** — elle ne s'affichera plus après avoir quitté la page

## 4. Configurer le fichier `.env`

Ouvrez `.env` à la racine du projet et remplissez :

```env
OIDC_ISSUER=https://login.microsoftonline.com/{tenant_id}/v2.0
OIDC_CLIENT_ID={application_client_id}
OIDC_CLIENT_SECRET={valeur_du_secret}
OIDC_REDIRECT_URI=http://localhost:3001/api/auth/callback
```

- `{tenant_id}` = le **Directory (tenant) ID** de l'étape 2
- `{application_client_id}` = le **Application (client) ID** de l'étape 2
- `{valeur_du_secret}` = la **Value** copiée à l'étape 3 (longue chaîne, PAS le Secret ID)

> **Ne pas confondre** : Le **Secret ID** est un UUID (ex: `fb7320a1-...`). La **Value** est une longue chaîne alphanumérique (ex: `q8n~v7H...`).

### Valeurs par défaut selon l'environnement

| Environnement | `OIDC_REDIRECT_URI` |
|---|---|
| Docker (dev) | `http://localhost:3001/api/auth/callback` |
| Sans Docker (dev) | `http://localhost:4000/api/auth/callback` |
| Production | `https://portail.isb-group.fr/api/auth/callback` |

## 5. Redémarrer le backend

```bash
docker compose restart backend
```

## 6. Tester

1. Ouvrez `http://localhost:5173/login`
2. Cliquez sur **Se connecter avec Microsoft**
3. Vous êtes redirigé vers la page de connexion Microsoft
4. Après connexion, vous revenez sur le portail

## Fonctionnement

### Rôles et administration

- **Admin** : Si l'email Microsoft correspond à `AUTH_ADMIN_EMAIL` dans `.env`
- **Utilisateurs** : Les rôles sont déterminés par :
  1. Les **groupes Entra ID** (claim `roles` dans le token) si présents
  2. Sinon, les **groupes locaux** dans `infra/auth/groups.json`

### Déconnexion

La déconnexion efface le cookie JWT ET redirige vers la page de déconnexion Microsoft pour fermer la session côté Entra ID.

### Gestion des mots de passe

Avec Entra ID, plus aucun mot de passe n'est géré par l'application. L'authentification est entièrement déléguée à Microsoft.

## Dépannage

### Erreur 503 "Entra ID non configuré"

Les variables OIDC sont vides ou mal formatées :
- Vérifiez que `OIDC_ISSUER` commence par `https://`
- Vérifiez que `OIDC_CLIENT_SECRET` est la **Value** du secret, pas le Secret ID

### Erreur "Invalid redirect URI"

Le Redirect URI dans Azure ne correspond pas exactement à `OIDC_REDIRECT_URI` :
- Vérifiez l'URL dans Azure Portal → App Registration → Authentication
- Pas de slash final, pas de faute de frappe

### Callback échoué

Vérifiez les logs backend :
```bash
docker compose logs backend
```
