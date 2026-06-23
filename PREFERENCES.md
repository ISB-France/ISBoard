# Page Préférences

**URL :** `/preferences`

**Accès :** Menu utilisateur (Header) > **Préférences** — aucune authentification requise.

---

## Fonctionnalités

### Couleur d'accentuation

Sélection de la couleur principale du portail parmi 14 thèmes :

**Clairs (7) :**

| ID | Label | Icône | Teinte (hue) |
|---|---|---|---|
| `isb` | ISB | 🟤 | 36 |
| `blue` | Bleu | 🔵 | 220 |
| `green` | Vert | 🟢 | 142 |
| `purple` | Violet | 🟣 | 270 |
| `red` | Rouge | 🔴 | 0 |
| `teal` | Teal | 🩵 | 180 |
| `pink` | Rose | 🩷 | 330 |

**Foncés (7) :**

| ID | Label | Icône | Teinte (hue) |
|---|---|---|---|
| `slate` | Ardoise | 🌑 | 220 |
| `midnight` | Minuit | 🌃 | 240 |
| `charcoal` | Charbon | ⚫ | 30 |
| `forest` | Forêt | 🌲 | 140 |
| `plum` | Prune | 🍇 | 280 |
| `navy` | Marine | ⚓ | 220 |
| `wine` | Vin | 🍷 | 350 |

Le choix est appliqué instantanément et persisté dans `localStorage` (clé `isb-color-theme`).

---

## Architecture

### Frontend — `apps/frontend/src/pages/Preferences.tsx`

Composant React (88 lignes). Aucun appel API, aucun état local complexe.

- Utilise `useColorTheme()` pour lire/appliquer le thème
- Affiche une grille de 14 boutons (un par thème)
- Le thème actif est surligné (bordure `primary` + fond `secondary`)

### Système de thème — `apps/frontend/src/contexts/ColorThemeContext.tsx`

Cœur du système de personnalisation.

**Structures :**

```ts
interface ColorTheme {
  id: string
  label: string
  icon: string    // emoji
  hue: number     // teinte HSL (0-360)
  dark: boolean
}
```

**Fonctionnement de `applyTheme(hue, dark)` :**

Calcule 22 variables CSS selon le mode clair/foncé :

| Variable | Clair | Foncé |
|---|---|---|
| `--background` | `{hue} 100% 97%` | `{hue} 40% 8%` |
| `--foreground` | `{hue} 100% 12%` | `{hue} 60% 90%` |
| `--primary` | `{hue} 100% 12%` | `{hue} 60% 70%` |
| `--primary-foreground` | `46 100% 50%` | `{hue} 80% 20%` |
| `--card` | `0 0% 100%` | `0 0% 12%` |
| `--secondary` | `{hue} 100% 93%` | `{hue} 40% 16%` |
| `--border` | `{hue} 100% 88%` | `{hue} 30% 24%` |
| `--muted` | `{hue} 16% 88%` | `{hue} 30% 20%` |
| `--muted-foreground` | `{hue} 18% 48%` | `{hue} 30% 60%` |
| `--accent` | `{hue} 16% 88%` | `{hue} 30% 20%` |
| `--ring` | `{hue} 100% 12%` | `{hue} 60% 70%` |

La classe `.dark` est ajoutée/retirée sur `<html>` selon le mode.

### Variables CSS de base — `apps/frontend/src/styles/index.css`

Valeurs par défaut (thème ISB, hue=36) avec les polices :
- **DM Sans** — texte (`font-sans`)
- **Plus Jakarta Sans** — titres (`font-heading`)

Importées via Google Fonts.

### Configuration Tailwind — `apps/frontend/tailwind.config.ts`

Mappe toutes les variables CSS en classes utilitaires :

| Classe Tailwind | Variable CSS |
|---|---|
| `bg-background` | `--background` |
| `text-foreground` | `--foreground` |
| `bg-primary` | `--primary` |
| `text-primary-foreground` | `--primary-foreground` |
| `border-border` | `--border` |
| `bg-card` | `--card` |
| `bg-secondary` | `--secondary` |
| `text-muted-foreground` | `--muted-foreground` |

Et des alias legacy ISB : `bg-isb-bg`, `text-isb-text`, `text-isb-muted`, etc.

---

## Assets

### Logos

| Fichier | Utilisation |
|---|---|
| `apps/frontend/assets/Logo_isb_darkmode.png` | Thèmes clairs |
| `apps/frontend/assets/Logo_isb_whitemode.png` | Thèmes foncés |

Le composant `ISBLogo` (`apps/frontend/src/components/ISBLogo.tsx`) choisi le bon fichier selon `theme.dark`.

### Icônes (lucide-react)

- `ArrowLeft` — bouton retour
- `Palette` — en-tête de section
- `Settings` — entrée du menu Header

### Émojis

24 émojis inline définis dans `ColorThemeContext.tsx` servant d'icônes de thème.

---

## Flux de données

```
Browser (Preferences.tsx)
  │
  ├─ useColorTheme()
  │   ├─ theme      → thème actif
  │   ├─ themes     → liste des 14 thèmes
  │   └─ setTheme() → applique + localStorage
  │
  └─ Clic sur un thème
      → setTheme(id)
        → applyTheme(hue, dark)
          → root.style.setProperty(...)  (22 vars CSS)
          → root.classList.toggle('dark')
        → localStorage.setItem('isb-color-theme', id)
```

**Aucun appel API** — 100% client-side.

---

## Dépendances UI

- `lucide-react` — ArrowLeft, Palette
- `useColorTheme()` — contexte de thème (`ColorThemeContext`)
- `ISBLogo` — composant logo (PNG)
- Pas de `Button`/`Card`/`Input` shadcn — tout le rendu est en HTML natif + Tailwind

---

## Différence avec la page Profil

| Aspect | Profil | Préférences |
|---|---|---|
| API | 3 endpoints REST | Aucun |
| Base de données | Table `User` (Prisma) | Aucune |
| Persistance | Base de données | `localStorage` uniquement |
| Authentification | Requise (`requireAuth`) | Non requise |
| États | 5 états (loading, editing, saving…) | Aucun état complexe |
| Header | Header générique réutilisé | Header intégré au composant |
