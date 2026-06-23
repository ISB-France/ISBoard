# Préférences du projet ISBoard

## Langue
- Interface en français
- Code commenté en français si nécessaire
- Messages de commit en anglais

## Conventions de code
- Frontend : React + TypeScript + Tailwind CSS + shadcn/ui
- Backend : Django + Django REST Framework
- Utiliser des icônes `lucide-react`
- Éviter les commentaires dans le code (sauf si nécessaire)

## Style
- Palette ISB : yellow (#FFDD00), brown (#3B2800), sand, terracotta, coral
- Badges avec couleurs Tailwind : purple (annual), amber (professional), cyan (bilan), indigo (forfait), rose (fin_carriere)
- Thème bois/forêt pour les émojis du profil

## Projet
- Application de gestion d'entretiens RH
- Utilisateurs : admin, rh, manager, employee, stagiaire, alternant
- Types d'entretiens : Évaluation, Professionnel, Bilan, Forfait jours, Fin de carrière
- Hiérarchie N-1/N-n via le champ `manager` sur User
- Filtres : scope (N-1, Mes entretiens, Toute l'équipe), type, statut (En cours/Historique)
- Documents PDF uploadés dans `/media/interview_docs/`
