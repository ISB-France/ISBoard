# Page Profil

**URL :** `/profile`

**Accès :** Menu utilisateur (Header) > **Mon profil** — authentification requise.

---

## Fonctionnalités

### Consultation

- **Nom** de l'utilisateur (police grasse)
- **Adresse email** (lecture seule)
- **Avatar / Icône** : image uploadée ou émoji
- **Badge Administrateur** (visible si `user.isAdmin`)
- **Méthode de connexion** : Microsoft Entra ID

### Modification

Cliquer sur **Modifier** pour passer en mode édition :

| Champ | Contrôle | Description |
|---|---|---|
| Nom | `Input` texte | Librement modifiable |
| Icône | Grille d'émojis (24 choix) | Sélection par clic |
| Avatar | Upload fichier (`input[type=file]`) | JPEG, PNG, WebP, GIF — max 2 Mo |

Boutons **Enregistrer** / **Annuler** disponibles en bas de la carte en mode édition.

---

## Architecture

### Frontend — `apps/frontend/src/pages/Profile.tsx`

Composant React (327 lignes) rendu par React Router. Utilise le hook `useAuth()`.
L'appel API est fait via `api.auth.profile()` au montage.

**États :**

| State | Déclencheur | Comportement |
|---|---|---|
| `loadingProfile` | Chargement initial | Champs grisés, bouton Modifier désactivé |
| `editing` | Clic sur Modifier | Inputs + grille d'émojis + upload + boutons d'action |
| `showIcons` | Clic sur "Choisir une icône" | Affiche la grille d'émojis (24 choix) |
| `uploading` | Upload en cours | Spinner sur le bouton appareil photo |
| `saving` | Enregistrement en cours | "Enregistrement..." + bouton désactivé |

### Backend — API REST (`apps/backend/src/routes/auth.ts`)

Toutes les routes sont protégées par le middleware `requireAuth`.

| Méthode | Route | Rôle | Service |
|---|---|---|---|
| `GET` | `/auth/profile` | Retourne le profil | `getProfile(email)` |
| `PUT` | `/auth/profile` | Met à jour nom + icône | `upsertProfile(email, data)` |
| `POST` | `/auth/profile/avatar` | Upload avatar (multipart) | `multer` → disque → `upsertProfile` |

Le `PUT` regénère un token JWT (avec le nouveau `name`) et met à jour le cookie.

### Base de données — `Prisma User`

```
model User {
  email   String  @unique
  name    String
  icon    String  @default("")
  ...
}
```

### Service — `apps/backend/src/services/profiles.ts`

Couche d'accès aux données (Prisma).

| Fonction | Description |
|---|---|
| `getProfile(email)` | Lecture d'un utilisateur par email |
| `listProfiles()` | Liste tous les utilisateurs (ordre alphabétique) |
| `upsertProfile(email, data)` | Création ou mise à jour (nom / icône) |
| `updateProfileEmail(old, new)` | Changement d'email (via admin) |

---

## Flux de données

```
Browser (Profile.tsx)
  │
  ├─ GET  /api/auth/profile        → getProfile(email)
  │                                  ← { email, name, icon }
  │
  ├─ PUT  /api/auth/profile        → upsertProfile(email, { name, icon })
  │                                  ← { profile, token, user }
  │
  └─ POST /api/auth/profile/avatar → multer (stockage disque)
                                     → upsertProfile(email, { icon: url })
                                     ← { profile, url }
```

## Dépendances UI

- `lucide-react` — icônes (ArrowLeft, Mail, Shield, Camera, Save, X)
- `sonner` — toasts (succès / erreur)
- `@/components/ui/*` — Button, Input, Card (shadcn/ui)
- `useAuth()` — hook contexte d'authentification
