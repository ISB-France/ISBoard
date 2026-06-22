# SYNTHÈSE DU BESOIN — EAP ISB 2025

## 1. CONTEXTE
Mise en place d'un outil de gestion des entretiens annuels pour le groupe ISB. Le besoin couvre 5 types d'entretiens avec des périodicités, populations et processus de signature différents.

---

## 2. LES 5 TYPES D'ENTRETIEN

| Type d'entretien | Périodicité | Population concernée | Signature |
|---|---|---|---|
| **Entretien professionnel** | Tous les ans | Tous les salariés (sauf opérationnels d'exploitation) | Manager + salarié |
| | Tous les 2 ans | Opérationnels d'exploitation | Manager + salarié |
| **Entretien d'évaluation** | Tous les ans | Tous les salariés (sauf opérationnels d'exploitation) | Manager + salarié |
| | Tous les 2 ans | Opérationnels d'exploitation | Manager + salarié |
| **Entretien de bilan** | Tous les 6 ans | Tous les salariés | Manager + salarié |
| **Entretien forfait/charges** | Tous les ans | Salariés au forfait jours uniquement | Manager + salarié |
| **Entretien de fin de carrière** | À 59 ans | Tous les salariés | RH uniquement (1 RDV) |

---

## 3. ENTRETIEN PROFESSIONNEL

### Objectif
Accompagner le salarié dans ses perspectives d'évolution professionnelle (qualifications, emploi).

### Thèmes à aborder
- Poste de travail (tâches, missions, évolution)
- Compétences
- Difficultés rencontrées
- Souhaits de changement ou d'évolution
- Formations déjà suivies, certifications obtenues (diplôme, titre professionnel…)
- Projet professionnel ou de formation envisageable
- Actions de formation, bilan de compétences ou VAE à mettre en place

### Particularités
- Suivi des évolutions de poste, statut, niveau et coeff sur 6 ans
- Conserver les historiques des 5 dernières années
- Ajouter les évolutions de l'année N-1 dans ces 4 domaines
- Possibilité de sauvegarde sur le service
- En fin de relation, pouvoir garder la dernière campagne

---

## 4. PRÉAMBULE (Avant entretien professionnel & évaluation)

- Envoi possible par mail ou impression papier avant l'entretien
- Contenu modifiable chaque année par le service RH
- Notification automatique aux employés et évaluateurs (confirmation date/heure)
- **Proposition : ne pas l'intégrer au logiciel**

---

## 5. ENTRETIEN D'ÉVALUATION ANNUEL

### Objectif
Créer un espace de dialogue entre le salarié et son manager ; évaluer et fixer les objectifs professionnels.

### Points abordés
- **Bilan annuel** : récapitulatif des entretiens effectués (date et typologie) des 6 dernières années civiles — récupérer les données confidentielles des 5 années précédentes historisées
- **Évaluation des objectifs et compétences** : évaluer ceux de l'année précédente et en saisir de nouveaux

---

## 6. ENTRETIEN DE BILAN (Tous les 6 ans)

### Objectif
État des lieux récapitulatif du parcours professionnel tous les 6 ans.

### Vérifications
- Vérifier que les entretiens professionnels prévus ont bien eu lieu au cours des 6 dernières années
- S'assurer que le salarié a :
  - Suivi au moins une action de formation
  - Acquis des éléments de certification (formation ou VAE)
  - Bénéficié d'une progression salariale ou professionnelle

### Particularités
- Évolutions salariales (date et montant) : historique 5 ans + année N-1
- Formations : historique 5 ans + année N-1
- Évolutions professionnelles (poste, statut, niveau, coeff) : idem
- Souhait d'évolution : idem
- Attention aux changements de catégorie ou paramètres en cours d'année

---

## 7. ENTRETIEN FORFAIT JOURS & CHARGES (Tous les ans)

### Objectif
Entretien obligatoire une fois par an pour les salariés au forfait jours (Article L3121-65).

### 4 grands thèmes
1. Charge de travail (doit être raisonnable)
2. Organisation du travail
3. Droit à la déconnexion & Temps de repos
4. Articulation vie professionnelle / vie personnelle
5. Rémunération

---

## 8. ENTRETIEN DE FIN DE CARRIÈRE (À 59 ans)

### Objectif
- Faciliter la transition entre vie professionnelle et départ à la retraite
- Connaître les dates de départ en retraite pour organiser l'avenir de l'entreprise
- Maintenir la motivation jusqu'au départ
- Prévenir la perte des savoir-faire et compétences (anticiper une période de passation)
- Déclenchement : à 59 ans

---

## 9. PRÉREQUIS FONCTIONNELS & TECHNIQUES (SLIDE 17)

### Phase préparatoire
- Récupération de l'historique (démarrage octobre pour RH, décembre pour managers)
- Import d'une base de données annuelle depuis **SAGE** (ensemble de la population)
- Paramétrage intégré pour sélectionner la population concernée chaque année
- Gestion des cycles de 6 ans glissants
- **Ne pas réimporter manuellement les données fixes chaque année**

### Fonctionnalités attendues (sans support Köstango)
- Extractions régulières possibles
- Extraction de fin de campagne avec tout le contenu
- Ajout / suppression de questions
- Ajout / suppression de parties
- Modification des tables
- Adaptation aux évolutions législatives

### Configuration & ergonomie
- Outil facile, interface conviviale et intuitive
- Verrouillage / non-modifiable dès que l'entretien est réalisé et validé (les autres restent actifs)
- Impression PDF de chaque entretien
- Signature manager + salarié (digitalisation des signatures certifiées ?)
- 3 comptes administrateur
- 58 habilitations manager (accès uniquement à sa population = confidentialité)
- Attention au coût du nombre de licences

---

## 10. RÉCAPITULATIF DES CONTRAINTES TRANSVERSES

| Contrainte | Détail |
|---|---|
| **Historique** | Conserver 5-6 ans de données selon le type d'entretien |
| **Import** | Base annuelle depuis SAGE ; ne pas réimporter les données fixes |
| **Cycles glissants** | 6 ans pour l'entretien professionnel et de bilan |
| **Verrouillage** | Entretien validé = verrouillé (non modifiable) |
| **Habilitations** | 3 admins, 58 managers avec accès limité à leur périmètre |
| **PDF** | Impression + signature numérique certifiée (à confirmer) |
| **Notifications** | Automatiques pour confirmation des entretiens |
| **Évolutions législatives** | L'outil doit pouvoir s'adapter |
| **Extraction** | Régulière + extraction complète en fin de campagne |
