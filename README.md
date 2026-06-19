# ISB-EAP

Application Power Apps (Canvas App) + Microsoft Dataverse pour la gestion des **Entretiens Annuels et Professionnels (EAP)** des collaborateurs du **Groupe ISB**.

## Table des matières

- [Présentation](#présentation)
- [Stack technologique](#stack-technologique)
- [Architecture](#architecture)
- [Tables (Entités Dataverse)](#tables-entités-dataverse)
- [Relations entre les tables](#relations-entre-les-tables)
- [Applications Canvas](#applications-canvas)
- [Workflows Power Automate](#workflows-power-automate)
- [Modèle de sécurité](#modèle-de-sécurité)
- [Intégrations](#intégrations)
- [Documentation](#documentation)

---

## Présentation

ISB-EAP gère l'intégralité du cycle de vie des entretiens employés :

- **EAP** — Entretien Annuel Professionnel
- **EPP** — Entretien Professionnel Périodique
- **BIL** — Bilan
- **EFC** — Entretien de Fin de Carrière


Fonctionnalités principales :

- Modèles d'entretien configurables avec questionnaires dynamiques
- Évaluation des compétences et des objectifs
- Suivi de l'évolution professionnelle et salariale (intégration SAGE)
- Génération automatique de PDF signés
- Notifications email
- Import/export via Excel Online
- Stockage des documents sur OneDrive / SharePoint

---

## Stack technologique

### Actuel (production)

| Technologie | Rôle |
|---|---|
| **Power Apps (Canvas App)** | Interface utilisateur (2 apps) |
| **Microsoft Dataverse** (v9.2) | Base de données / persistance |
| **Power Automate** | Workflows backend (16+ flux) |
| **Office 365** | Email, OneDrive, SharePoint, Excel Online |
| **SAGE** | Import RH / paie |

### Prévu (refonte Python/FastAPI)

| Technologie | Version | Rôle |
|---|---|---|
| **FastAPI** | 0.115+ | API REST asynchrone |
| **SQLAlchemy** | 2.0+ | ORM |
| **Alembic** | 1.14+ | Migrations |
| **PostgreSQL** | 16+ | Base de données |
| **Redis** | 7+ | Cache / broker Celery |
| **Celery** | 5.4+ | Tâches asynchrones |
| **WeasyPrint / ReportLab** | — | Génération PDF |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Power Apps (Canvas)                 │
│  ┌─────────────────────┐  ┌──────────────────────┐  │
│  │      ISB-RH         │  │  Navbar (composant)   │  │
│  │  (App principale)   │  │  (Barre de nav.)      │  │
│  └────────┬────────────┘  └──────────────────────┘  │
└───────────┼─────────────────────────────────────────┘
            │ Connecteurs
    ┌───────┼───────┬──────────────┬──────────────┐
    ▼       ▼       ▼              ▼              ▼
┌──────┐ ┌─────┐ ┌────────┐ ┌──────────┐ ┌──────────┐
│Data- │ │Excel│ │Outlook │ │ OneDrive │ │SharePoint│
│verse │ │Online│ │Mail    │ │  (docs)  │ │(archives)│
└──┬───┘ └─────┘ └────────┘ └──────────┘ └──────────┘
   │
   ▼
┌────────────────────────────────────────────────────┐
│               Power Automate (16+ flux)             │
│  Création PDF · Envoi emails · Imports · Màj données│
└────────────────────────────────────────────────────┘
   ▲
   │
┌──┴──────────┐
│   SAGE      │ ← Import RH mensuel (compteurs, évolution, salaire)
└─────────────┘
```

---

## Tables (Entités Dataverse)

31 entités personnalisées (préfixe `crbcb_`).

### Tables de référence

| Table | Description |
|---|---|
| `crbcb_Sites` | Sites géographiques de l'entreprise |
| `crbcb_Postes` | Postes / intitulés de poste |
| `crbcb_Fonctions` | Fonctions hiérarchiques |
| `crbcb_Roles` | Roles applicatifs (Admin, RH, Manager, Collaborateur, Inconnu) |
| `crbcb_Agences_Interims` | Agences d'intérim partenaires |
| `crbcb_EAP_Type_Entretien` | Types d'entretien (EPP, EAP, BIL, EFJ, EMC, EFC, EAB) |

### Table centrale : Collaborateurs

| Table | Rôle | Champs clés |
|---|---|---|
| `crbcb_Collaborateurs` | **Table centrale** — profil complet employé | Matricule, Nom, Prénom, Email, Photo, DateEmbauche, TypeContrat, Salaire, Coefficient, FK → Sites/Postes/Fonctions/Rôles, FK auto-référence ValideurN1 (N+1) |

### Gestion des entretiens

| Table | Description |
|---|---|
| `crbcb_Campagnes_EAP` | Campagnes d'entretien (Nom, Année, Dates, Statut) |
| `crbcb_Entretiens_EAP` | **Table cœur** — tous les entretiens (Type, Statut, Signatures, Bilan, Contenu JSON, Lien PDF, FK → Collaborateur, Manager, Campagne, Template) |
| `crbcb_EAP_Template` | Modèles de questionnaire réutilisables (FK → Type_Entretien) |
| `crbcb_EAP_Question` | Banque de questions (Texte, Catégorie, Type réponse, Obligatoire) |
| `crbcb_EAP_Template_Question` | Association Template → Question avec ordre |
| `crbcb_EAP_Reponse` | Réponses aux questions par entretien |
| `crbcb_EAP_TableauQuestions` | Grilles de questions (matricielles) |
| `crbcb_EAP_TableauReponses` | Grilles de réponses (matricielles) |

### Évaluation (Compétences & Objectifs)

| Table | Description |
|---|---|
| `crbcb_EAP_Competences` | Compétences évaluées par entretien |
| `crbcb_EAP_Competences_Entretien` | Grille détaillée des compétences de l'entretien |
| `crbcb_EAP_Comptences_Entretien_Futur` | Compétences futures à développer |
| `crbcb_EAP_Objectifs` | Objectifs par entretien |
| `crbcb_EAP_Objectifs_Entretien` | Grille détaillée des objectifs de l'entretien |
| `crbcb_EAP_Objectifs_Entretien_Futur` | Objectifs futurs (N+1) |
| `crbcb_EAP_Information_Entretien` | **Table pivot** liant entretien ↔ objectifs et compétences (présents et futurs) |
| `crbcb_EAP_Formation` | Formations suivies / demandées |

### Suivi RH (intégration SAGE)

| Table | Description |
|---|---|
| `crbcb_Compteurs_RH` | Compteurs RH mensuels (congés, RTT, heures sup, nuit, tickets resto, primes) depuis SAGE |
| `crbcb_Historique_Evolutions` | Historique annuel (poste, coefficient, salaire, formation) |
| `crbcb_Jours_Travailles` | Jours travaillés par mois |
| `crbcb_Evolutionsprofessionnelles` | Historique des évolutions de poste |
| `crbcb_EvolutionsSalaire` | Historique des augmentations salariales |

### Hiérarchie & Audit

| Table | Description |
|---|---|
| `crbcb_Sup_Hierarchiques` | Historique des relations N+1 / N+2 |
| `crbcb_EAP_ImportLog` | Journal des imports de données (SAGE) |
| `crbcb_Collaborateur_ImportLog` | Journal d'import spécifique aux collaborateurs |

---

## Relations entre les tables

```
Sites ──┐
Postes ─┼── Collaborateurs ──┬── Entretiens_EAP ──┬── Reponse
Fonctions ─┘                 │                    ├── Competences_Entretien
Roles ──┐                    │                    ├── Objectifs_Entretien
Agences ─┘                   │                    └── Information_Entretien (pivot)
                              │                           ├── Objectifs_Entretien_Futur
                              │                           └── Competences_Entretien_Futur
                              ├── Campagnes_EAP
                              ├── Compteurs_RH (SAGE)
                              ├── Historique_Evolutions
                              ├── Jours_Travailles
                              ├── Evolutionsprofessionnelles
                              └── EvolutionsSalaire
```

---

## Applications Canvas

| App | Fichier | Type | Rôle |
|---|---|---|---|
| **ISB-RH** | `crbcb_isbrh_6a938` | Tablet (1366×768) | Application principale : tableau de bord, entretiens, compétences, objectifs, évolutions |
| **Navbar** | `crbcb_navbarchanger_2ef88` | Phone (640×80) | Bibliothèque de composants : barre de navigation + header réutilisable |

---

## Workflows Power Automate

16+ flux Cloud Automate :

| Catégorie | Workflows |
|---|---|
| **Gestion des intervenants** | AgenceInterim, Collaborateur, Fonction, Poste, Site |
| **Entretiens** | Entretiens (logique métier principale) |
| **Emails** | EntretienBilanEmail, EntretienChargeEmail, EntretienEvaluationEmail, EntretienProfessionnelEmail, EnvoideMail |
| **Documents** | CreatePDF, Json_Pdf_Mail_EAP (JSON → PDF + email) |
| **Évolution** | EvolutionProfessionnelle, EvolutionSalaire |
| **Import** | Formation, Excel_Json_Formation (Excel → JSON) |

---

## Modèle de sécurité

4 rôles applicatifs :

| Rôle | Permissions |
|---|---|
| **Admin** | Accès total à toutes les entités, workflows, utilisateurs, rapports |
| **Manager** | Vue équipe, création/édition/signature des entretiens de son équipe |
| **Collaborateur** | Vue de son propre entretien, saisie des réponses, signature |
| **Lecteur (Audit)** | Accès en lecture seule, consultation des rapports |

Filtrage au niveau des enregistrements basé sur le propriétaire, la hiérarchie et le rôle.

---

## Intégrations

| Connecteur | Usage |
|---|---|
| Microsoft Dataverse | Base de données principale |
| Excel Online (Business) | Import / export de données |
| Office 365 Outlook | Envoi d'emails (2 instances) |
| OneDrive for Business | Stockage des documents (2 instances) |
| SharePoint Online | Archivage des documents (2 instances) |
| SAGE (externe) | Import RH mensuel (compteurs, évolutions, salaires) |

---

## Documentation

Toute la documentation se trouve dans le dossier `doc/` :

| Fichier | Contenu |
|---|---|
| `INDEX_DOCUMENTATION.md` | Index principal — point d'entrée |
| `SYNTHESE_DOCUMENTATION.md` | Synthèse globale |
| `DOCUMENTATION_COMPLETE.md` | Documentation générale (~40 pages) |
| `DOCUMENTATION_TECHNIQUE.md` | Documentation technique (~25 pages) |
| `GUIDES_PRATIQUES.md` | Guides utilisateur et admin (~30 pages) |
| `TECH_STACK.md` | Stack prévu pour la refonte Python/FastAPI |
| `tables_database.md` | Description détaillée de toutes les tables |

---

## Structure du dépôt

```
ISB-EAP/
├── README.md                  ← Ce fichier
├── doc/                       ← Documentation complète (~125 pages)
└── PowerApps/
    └── src/ISB-EAP/           ← Export solution Power Apps (unmanaged)
        ├── CanvasApps/        ← 2 apps Canvas (ISB-RH + Navbar)
        ├── Entities/          ← 31 définitions d'entités Dataverse
        ├── OptionSets/        ← 11 listes de choix globales
        ├── Workflows/         ← 16+ flux Power Automate
        └── Other/             ← Manifeste solution, customizations, relations
```
