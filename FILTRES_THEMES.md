# Filtres des thèmes — mécanisme de sélection et d'application

## 1. Définition des thèmes

Fichier : `apps/frontend/src/contexts/ColorThemeContext.tsx` (lignes 3-28)

Chaque thème est un objet `ColorTheme` :

```ts
interface ColorTheme {
  id: string      // identifiant unique
  label: string   // nom affiché
  icon: string    // emoji représentatif
  hue: number     // teinte HSL (0-360)
  dark: boolean   // mode sombre ?
}
```

Les 14 thèmes sont stockés dans un tableau constant `THEMES` (lignes 11-28), divisé en deux groupes — 7 clairs (`dark: false`), 7 foncés (`dark: true`).

---

## 2. Filtrage du thème actif

### 2.1 Au démarrage — `ColorThemeProvider` (lignes 92-98)

```ts
const [theme, setThemeState] = useState<ColorTheme>(() => {
  const id = getStoredThemeId()       // lit localStorage
  const t = THEMES.find((t) => t.id === id) ?? THEMES[0]  // filtre par id
  applyTheme(t.hue, t.dark)
  return t
})
```

Le filtre `THEMES.find((t) => t.id === id)` extrait le thème correspondant à l'ID stocké. Si aucun ne correspond (fallback), le premier thème (`isb`) est utilisé.

### 2.2 Au changement — `setTheme(id)` (lignes 100-107)

```ts
function setTheme(id: string) {
  const t = THEMES.find((t) => t.id === id)  // filtre par id
  if (t) {
    applyTheme(t.hue, t.dark)
    setThemeState(t)
    localStorage.setItem(THEME_KEY, id)       // persisté
  }
}
```

Même mécanisme : filtrage par `find()` puis application et persistance.

### 2.3 Lecture depuis le stockage — `getStoredThemeId()` (lignes 32-35)

```ts
function getStoredThemeId(): string {
  if (typeof window === 'undefined') return 'isb'
  return localStorage.getItem(THEME_KEY) ?? 'isb'
}
```

Filtre la clé `isb-color-theme` dans `localStorage`. Valeur par défaut : `'isb'`.

---

## 3. Application des couleurs — `applyTheme(hue, dark)`

Fichier : `apps/frontend/src/contexts/ColorThemeContext.tsx` (lignes 37-82)

C'est le cœur du système : une fonction qui prend une **teinte** et un **mode** et calcule 22 variables CSS.

### 3.1 Principes

Pour chaque variable CSS, on définit des valeurs clair/foncé pour :

| Paramètre | Variables |
|---|---|
| Luminosité (`light`) | `bgLight`, `fgLight`, `cardLight`, `secLight`, `mutLight`, `mutFgLight`, `accLight`, `borderLight` |
| Saturation (`sat`) | `satPrimary`, `satBg`, `satSec`, `satAcc`, `satMut`, `satMutFg`, `satBorder` |
| Teinte (`hue`) | `priHue`, `priFgHue` (par défaut la hue du thème) |
| Saturation primaire | `priSat`, `priFgSat` |
| Luminosité primaire | `priLight`, `priFgLight` |

Le sélecteur ternaire filtre la valeur selon le mode :

```ts
const bgLight = dark ? 8 : 97    // si dark → 8%, sinon → 97%
const satBg   = dark ? 40 : 100  // si dark → 40%, sinon → 100%
```

### 3.2 Règles de transformation

| Variable | Clair (dark=false) | Foncé (dark=true) |
|---|---|---|
| Fond général → clair, foncé → très sombre | `--background` | `{hue} 100% 97%` → `{hue} 40% 8%` |
| Texte → très sombre, foncé → très clair | `--foreground` | `{hue} 100% 12%` → `{hue} 60% 90%` |
| Primaire → ton foncé, foncé → ton clair | `--primary` | `{hue} 100% 12%` → `{hue} 60% 70%` |
| Cartes → blanc, foncé → gris foncé | `--card` | `0 0% 100%` → `0 0% 12%` |
| Bordures → saturation max, foncé → saturé réduite | `--border` | `{hue} 100% 88%` → `{hue} 30% 24%` |
| `--primary-foreground` → fixe `46 100% 50%` (jaune ISB), foncé → `{hue} 80% 20%` |

### 3.3 Application au DOM (lignes 61-81)

```ts
root.style.setProperty('--background', `${hue} ${satBg}% ${bgLight}%`)
```

Chaque variable est écrite directement sur `document.documentElement` via `style.setProperty`.

La classe `.dark` est ajoutée/retirée sur `<html>` pour les sélecteurs CSS qui en dépendent :

```ts
root.classList.toggle('dark', dark)
```

---

## 4. Affichage dans la page Préférences

Fichier : `apps/frontend/src/pages/Preferences.tsx` (lignes 67-92)

Le template filtre visuellement le thème actif par comparaison :

```tsx
{colorThemes.map((t) => (
  <button
    style={{
      borderColor: colorTheme.id === t.id ? 'hsl(var(--primary))' : 'hsl(var(--border))',
      backgroundColor: colorTheme.id === t.id ? 'hsl(var(--secondary))' : 'transparent',
    }}
  >
    <div style={{ backgroundColor: `hsl(${t.hue} 100% 12%)` }}>
      {t.icon}
    </div>
    <span style={{ color: colorTheme.id === t.id ? '...' : '...' }}>
      {t.label}
    </span>
  </button>
))}
```

Le thème actif est mis en évidence par :
- **Bordure** `primary` (au lieu de `border`)
- **Fond** `secondary` (au lieu de transparent)
- **Texte** `foreground` (au lieu de `muted-foreground`)
- **Nuancier** : `hsl({hue} 100% 12%)` — pastille de couleur représentative

---

## 5. Flux complet

```
Démarrage
  └─ ColorThemeProvider
       ├─ getStoredThemeId()              → localStorage.getItem('isb-color-theme')
       ├─ THEMES.find(id)                  → filtre le thème correspondant
       ├─ applyTheme(hue, dark)            → calcule 22 valeurs HSL
       │    └─ root.style.setProperty(...)  → 22 variables CSS
       │    └─ root.classList.toggle('dark')
       └─ useState(theme)                  → état React

Clic utilisateur sur un thème
  └─ setTheme(id)
       ├─ THEMES.find(id)                  → filtre le thème choisi
       ├─ applyTheme(hue, dark)
       ├─ setThemeState(t)                  → met à jour l'état React
       └─ localStorage.setItem(key, id)    → persisté
```

---

## 6. Fichiers impliqués

| Fichier | Rôle |
|---|---|
| `apps/frontend/src/contexts/ColorThemeContext.tsx` | Définition, filtrage, application |
| `apps/frontend/src/pages/Preferences.tsx` | UI de sélection |
| `apps/frontend/src/styles/index.css` | Variables CSS par défaut (hue=36) |
| `apps/frontend/tailwind.config.ts` | Mapping Tailwind ← variables CSS |
| `apps/frontend/src/components/ISBLogo.tsx` | Logo adaptatif selon `theme.dark` |
