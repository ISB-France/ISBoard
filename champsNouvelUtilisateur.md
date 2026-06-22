# Champs d'un Collaborateur (Utilisateur)

## Table principale : `crbcb_Collaborateurs`

## Identité

| Champ | Type | Description |
|---|---|---|
| **Nom** | Texte (100) | Nom de famille (obligatoire) |
| **Prénom** | Texte (100) | Prénom (obligatoire) |
| **Sexe** | Liste | Homme / Femme / Non-Binaire |
| **Date de naissance** | Date | Date de naissance |
| **Email** | Texte (500) | Email professionnel |
| **Téléphone** | Texte (50) | Téléphone professionnel |
| **Photo** | Image | Photo du collaborateur |

## Contrat

| Champ | Type | Description |
|---|---|---|
| **Matricule** | Texte (50) | Matricule SAGE (auto-généré) |
| **Date d'embauche** | Date | Date d'entrée dans le groupe |
| **Date de sortie** | Date | Date de fin de contrat |
| **Type de contrat** | Liste | CDI / CDD / Intérim / Alternance / Stage |
| **Statut** | Liste | Actif / Inactif / Sortie |
| **Coefficient** | Texte (20) | Coefficient conventionnel |
| **Salaire brut** | Monétaire | Salaire mensuel brut (RH uniquement) |
| **Forfait jour** | Oui/Non | Forfait annuel en jours |
| **Tickets restaurant** | Oui/Non | Bénéficie de tickets restaurant |
| **Cadre (PopExploitation)** | Oui/Non | Population exploitation opérationnelle |

## Organisation

| Champ | Type | Description |
|---|---|---|
| **Site** | Recherche | Site administratif (→ Sites) |
| **Poste** | Recherche | Poste occupé (→ Postes) |
| **Fonction** | Recherche | Fonction dans l'organigramme (→ Fonctions) |
| **Rôle applicatif** | Recherche | Admin / RH / Manager / Inconnu / Désactivé (→ Rôles) |
| **N+1 (ValideurN1)** | Recherche | Supérieur hiérarchique direct (→ Collaborateurs) |
| **Agence intérim** | Recherche | Agence d'intérim (visible si contrat = Intérim) |

## Notes

| Champ | Type | Description |
|---|---|---|
| **Commentaire RH** | Texte long (100000) | Note interne RH (non visible par le collaborateur) |

## Champs calculés (lecture seule)

| Champ | Description |
|---|---|
| **NomComplet** | `Upper(Nom) & " " & Prenom` |
| **Âge** | Calculé depuis DateNaissance |
| **Ancienneté** | Calculé depuis DateEmbauche |
