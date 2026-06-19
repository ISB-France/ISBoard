# Convention de branches

## Branches principales

| Branche | Usage                                          |
| ------- | ---------------------------------------------- |
| `main`  | Production — code stable et déployé            |
| `dev`   | Intégration — branche commune de développement |

## Branches de travail

Créer une branche depuis `dev` et merger dans `dev` via Pull Request.

```
feature/<description>     → Nouvelle fonctionnalité
fix/<description>         → Correction de bug
refactor/<description>    → Refactoring sans changement fonctionnel
docs/<description>        → Documentation uniquement
chore/<description>       → Tâche technique (CI, config, dépendances)
infra/<description>       → Infrastructure / Docker / Déploiement
```

### Règles

1. Toujours partir de `dev` pour une nouvelle branche
2. Nommer en kebab-case, en anglais ou français (au choix, rester cohérent)
3. Garder les branches courtes (quelques commits, < 1 semaine)
4. Supprimer la branche après merge
5. `main` est protégée — les merges passent par PR avec relecture
6. `dev` peut recevoir des merges directs (small features) ou par PR

### Exemples

```bash
git checkout -b feature/authentification-entra-id
git checkout -b fix/recherche-apps-accentues
git checkout -b docs/api-endpoints
git checkout -b chore/setup-eslint
```

## Workflow Git

```bash
# Démarrer depuis dev à jour
git checkout dev
git pull origin dev

# Créer la branche de travail
git checkout -b feature/ma-feature

# Commits atomiques
git commit -m "feat: ajouter la recherche par catégorie"
git commit -m "fix: corriger le tri alphabétique"

# Pousser
git push origin feature/ma-feature

# Ouvrir une Pull Request vers dev
# → Sélectionner dev comme base
# → Description claire du changement
```

## Convention de commits

Utiliser les préfixes [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — Nouvelle fonctionnalité
- `fix:` — Correction de bug
- `refactor:` — Refactoring
- `docs:` — Documentation
- `chore:` — Tâche technique
- `infra:` — Infrastructure
- `style:` — Formatting, missing semicolons, etc.
- `test:` — Ajout ou modification de tests
