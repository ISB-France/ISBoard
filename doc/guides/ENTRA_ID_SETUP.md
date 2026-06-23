# Configuration Microsoft Entra ID

## 1. Créer l'App Registration

| Champ                       | Valeur                                                                          |
| --------------------------- | ------------------------------------------------------------------------------- |
| **Nom**                     | `ISBibliotheque`                                                                |
| **Supported account types** | Accounts in this organizational directory only (ISB Group only — Single tenant) |
| **Owners**                  | Ajouter les administrateurs SI                                                  |

## 2. Redirect URIs

| Type           | URI                                               |
| -------------- | ------------------------------------------------- |
| **Web — Dev**  | `http://localhost:5173`                           |
| **Web — Prod** | `https://portail.isb-group.fr`                    |
| **SPA — Dev**  | `http://localhost:5173` (si MSAL côté navigateur) |

> Si le backend doit aussi recevoir des redirects (code flow), ajouter également :
>
> - `http://localhost:4000/api/auth/callback` (dev)
> - `https://api.portail.isb-group.fr/api/auth/callback` (prod)

## 3. Certificat & secrets

Créer un **client secret** (⚠️ à copier immédiatement) :

| Champ           | Valeur                                        |
| --------------- | --------------------------------------------- |
| **Description** | `isbibliotheque-backend`                      |
| **Expiration**  | 12 ou 24 mois (selon politique ISB)           |
| **Valeur**      | À stocker dans `.env` → `AZURE_CLIENT_SECRET` |

Ne **jamais** committer ce secret. Il va dans :

- `.env` local
- GitHub Actions secrets (`AZURE_CLIENT_SECRET`)
- Gestionnaire de secrets si déploiement (Docker Swarm secrets, Vault, etc.)

## 4. Scopes / Permissions

Définir un scope API exposé par l'application :

| Champ                          | Valeur                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------- |
| **Scope name**                 | `access_as_user`                                                                |
| **Who can consent?**           | Admins and users                                                                |
| **Admin consent display name** | `Accéder à ISBibliotheque`                                                      |
| **Admin consent description**  | Permet à l'utilisateur de s'authentifier et d'accéder au portail ISBibliotheque |

Si le frontend MSAL appelle directement l'API backend, ajouter ce scope dans `apiPermissions` de l'app.

**Permissions API Graph (optionnel, pour lire les groupes)**

| Permission             | Nécessaire si                                      |
| ---------------------- | -------------------------------------------------- |
| `GroupMember.Read.All` | On utilise les groupes Entra comme source de rôles |
| `User.Read`            | On veut le profil utilisateur (toujours)           |

> ⚠️ Ces permissions nécessitent un **Admin consent** dans le locataire.

## 5. Mapping groupes → rôles

Le backend utilise actuellement `infra/auth/groups.json` avec des rôles locaux.
Pour passer aux groupes Entra ID, deux stratégies possibles :

### Stratégie A : App Roles (recommandée v1)

Déclarer des **App Roles** dans l'App Registration :

| Role                  | Membres (exemples)      |
| --------------------- | ----------------------- |
| `admin`               | `admin@isb-group.fr`    |
| `production.manager`  | `marie@isb-group.fr`    |
| `production.operator` | `paul@isb-group.fr`     |
| `logistics.manager`   | `jean-log@isb-group.fr` |
| `logistics.operator`  | `sophie@isb-group.fr`   |
| `quality.manager`     | `jean@isb-group.fr`     |

Avantage : le role arrive directement dans le token JWT (claim `roles`).
Inconvénient : gestion manuelle dans le portail Azure.

### Stratégie B : Group claims (plus scalable)

- Créer des groupes de sécurité Entra ID (un par rôle)
- Configurer l'app pour émettre des `group claims` dans le token
- Le backend reçoit les `objectId` des groupes → les mappe aux rôles locaux dans `groups.json`

Avantage : gestion centralisée dans Azure AD (équipes IT).
Inconvénient : payload plus lourd (group IDs) + mapping nécessaire.

**Recommandation :** Commencer par **Stratégie A (App Roles)** pour le POC,
puis migrer vers B si la gestion devient lourde.

### Mapping avec les manifests existants

Les rôles Entra ID doivent correspondre au champ `roles` des manifests :

```json
// infra/apps.registry/production/metadata.json
{ "roles": ["production.manager", "production.operator"] }
```

## 6. Fichier `.env` attendu (partie Entra)

```env
AZURE_CLIENT_ID=00000000-0000-0000-0000-000000000000
AZURE_TENANT_ID=11111111-1111-1111-1111-111111111111
AZURE_CLIENT_SECRET=le-secret-copie
AZURE_SCOPES=https://graph.microsoft.com/.default
```

> Remplacer les IDs par ceux du portail Azure après création de l'app.

## 7. Vérification rapide

Une fois configuré, tester avec :

```bash
# Demander un token via OAuth2 Device Code (sans frontend)
curl -X POST https://login.microsoftonline.com/$AZURE_TENANT_ID/oauth2/v2.0/devicecode \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=$AZURE_CLIENT_ID&scope=api://$AZURE_CLIENT_ID/access_as_user"
```

```bash
# Vérifier le mapping roles dans le JWT décodé
# https://jwt.ms — coller le token et vérifier le claim "roles"
```
