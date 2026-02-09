# 00_BIBLE_PROJET.md
**Return ↺ - Document de Fondation Fonctionnelle**

---

## 1. Vision & Objectifs (Elevator Pitch)

### Quel est le problème résolu ?

Les utilisateurs prêtent régulièrement des objets personnels (livres, outils, argent) à leur entourage. Ces prêts génèrent trois problèmes majeurs :

1. **Oubli** : Après plusieurs semaines/mois, l'utilisateur ne se souvient plus qui a emprunté l'objet
2. **Friction sociale** : La réclamation d'un objet prêté crée une gêne et peut être perçue comme mesquine
3. **Perte définitive** : Faute de suivi, les objets ne sont jamais rendus et sont perdus

### Quelle est la solution proposée ?

**Return** est un registre personnel de prêts qui agit comme un tiers de confiance neutre. L'application :
- Capture instantanément les prêts via photo (reconnaissance d'objet)
- Suit automatiquement les échéances de retour
- Gère les rappels diplomatiques à la place de l'utilisateur
- Archive l'historique complet des prêts

### Quelle est la proposition de valeur unique ?

**Return ne gère pas seulement la mémoire, mais délègue la friction sociale.**

Contrairement à une simple liste ou un rappel calendrier, Return prend en charge la partie la plus inconfortable du prêt : demander le retour. L'application devient le messager neutre, préservant ainsi les relations humaines tout en protégeant les biens de l'utilisateur.

### KPIs de succès

**Mesures d'adoption :**
- Taux d'activation : % d'utilisateurs qui enregistrent leur premier prêt dans les 48h
- Nombre moyen de prêts enregistrés par utilisateur actif par mois
- Taux de rétention à 30/60/90 jours

**Mesures d'efficacité :**
- Taux de retour : % d'objets effectivement rendus après rappel
- Délai moyen de retour (avant/après date prévue)
- Taux d'utilisation de la fonctionnalité "rappel automatique"

**Mesures de satisfaction :**
- Net Promoter Score (NPS)
- Taux de prêts marqués comme "non rendus après rappel"
- Réduction du temps passé à gérer mentalement les prêts (enquête qualitative)

---

## 2. Acteurs & Personas

### 2.1 Prêteur (Utilisateur Principal)

**Profil :**
- Personne qui prête régulièrement des objets à son entourage (famille, amis, collègues)
- Age : 25-55 ans
- Sensible à l'organisation, mais débordé par la vie quotidienne

**Besoins :**
- Enregistrer un prêt rapidement (< 30 secondes)
- Savoir en un coup d'œil ce qui est prêté et à qui
- Recevoir des alertes avant les dates de retour
- Déléguer la demande de retour pour éviter la gêne

**Frustrations :**
- Peur de passer pour quelqu'un de radin en réclamant
- Charge mentale : "Est-ce que j'oublie quelque chose ?"
- Perte d'objets de valeur sentimentale ou financière
- Interfaces complexes qui prennent plus de temps que le prêt lui-même

**Objectifs :**
- Prêter sereinement sans risque de perte
- Maintenir de bonnes relations avec son entourage
- Récupérer ses biens sans conflit

### 2.2 Emprunteur

**Profil :**
- Personne qui emprunte un objet enregistré dans Return
- Peut ou non utiliser l'application
- Relation personnelle avec le Prêteur

**Besoins :**
- Comprendre qu'un rappel est automatique et non accusateur
- Connaître la date de retour attendue
- Pouvoir communiquer un délai supplémentaire si besoin

**Frustrations :**
- Sentiment d'être surveillé ou suspecté
- Notification perçue comme agressive
- Oubli sincère de la date de retour

**Objectifs :**
- Honorer ses engagements de retour
- Préserver sa réputation de "bon emprunteur"
- Éviter les malaises sociaux

### 2.3 Système (Acteur Technique)

**Rôle :**
- Automatisation des rappels selon planification
- Reconnaissance d'image pour identification d'objets
- Gestion des notifications multi-canaux

**Besoins :**
- Accès aux données de prêts (dates, objets, contacts)
- Capacité d'envoi de notifications (push, SMS, email)
- Algorithme de tonalité diplomatique pour les messages

---

## 3. Dictionnaire du Domaine (Ubiquitous Language)

### Entités Métier Principales

**Prêt (Loan)**
- Définition : Transaction enregistrée où un Objet est temporairement transféré d'un Prêteur à un Emprunteur avec expectative de retour
- Attributs clés : Date de départ, Date de retour prévue, Statut
- Cycle de vie : Actif → Rappelé → Rendu/Non rendu

**Objet (Item)**
- Définition : Bien physique ou immatériel faisant l'objet d'un Prêt
- Distinction : Objet ≠ Catégorie (ex: "Ma perceuse Bosch" vs "Outil électrique")
- Identification : Photo, Nom, Description, Valeur estimée (optionnelle)
- **Cas spécial** : Type "Argent" → Montant obligatoire (constitue la valeur du prêt)

**Prêteur (Lender)**
- Définition : Utilisateur propriétaire de l'Objet qui initie le Prêt
- Techniquement : Compte principal dans l'application

**Emprunteur (Borrower)**
- Définition : Personne physique à qui l'Objet est prêté
- Distinction : Emprunteur ≠ Utilisateur de l'application (peut ne pas avoir de compte)
- Identification : Nom, Contact (téléphone/email)

**Rappel (Reminder)**
- Définition : Notification automatique envoyée à l'Emprunteur selon la politique de rappel du Prêt
- Types : Préventif (avant échéance), À échéance, Relance (après échéance)
- Canal : Push notification, SMS, Email

**Historique de Prêt (Loan History)**
- Définition : Archive immuable de tous les Prêts passés avec leur issue
- Usage : Calcul du "score de confiance" d'un Emprunteur

**Statut de Prêt (Loan Status)**
- **En attente de confirmation** : Prêt créé par le Prêteur, non encore confirmé par l'Emprunteur
- **Actif** : Prêt confirmé en cours, date de retour non atteinte
- **Actif par défaut** : Prêt non confirmé mais accepté implicitement (timeout 48h)
- **Contesté** : Prêt refusé par l'Emprunteur, rappels désactivés
- **En attente de retour** : Date dépassée, rappel(s) envoyé(s)
- **Rendu** : Objet restitué, Prêt clos avec succès
- **Non rendu (abandonné)** : Objet non restitué après 3 rappels, Prêt clos en échec

### Vocabulaire Exclu (Anti-Patterns)

- ❌ **"Utilisateur"** → Trop vague. Utiliser explicitement Prêteur ou Emprunteur
- ❌ **"Transaction"** → Implique un échange financier. Utiliser Prêt
- ❌ **"Client"** → Connotation commerciale. Ce n'est pas un service payant (pour MVP)
- ❌ **"Propriétaire" / "Possesseur"** → Confusion juridique. Utiliser Prêteur

---

## 4. Scope Fonctionnel (Macro)

### IN SCOPE - MVP (V1)

#### Epic 1 : Enregistrement de Prêt
- Capture photo d'objet avec reconnaissance automatique
- Saisie manuelle (fallback si reconnaissance échoue)
- Ajout d'Emprunteur (nom + contact)
- Définition de date de retour ou "indéfinie"
- Confirmation et création du Prêt

#### Epic 2 : Tableau de Bord
- Vue liste de tous les Prêts actifs
- Filtres : Statut, Emprunteur, Date de retour
- Compteurs : Nombre d'objets prêtés, valeur totale estimée
- Action rapide : Marquer comme rendu

#### Epic 3 : Système de Rappels
- Configuration de politique de rappel par Prêt (ex: 3 jours avant, puis tous les 7 jours après)
- Envoi automatique de notification à l'Emprunteur
- Modèle de message diplomatique et neutre
- Log des rappels envoyés

#### Epic 4 : Historique
- Consultation des Prêts terminés (rendus + non rendus)
- Vue par Emprunteur : Taux de retour, délai moyen
- Statistiques personnelles : Objet le plus prêté, meilleur emprunteur

#### Epic 5 : Gestion de Compte
- Inscription / Connexion (email + mot de passe)
- Profil utilisateur basique
- Paramètres de notification (canaux préférés)

### OUT OF SCOPE - V1

#### Fonctionnalités Reportées V2+
- ❌ Réseau social / Partage public de prêts
- ❌ Marketplace ou location payante d'objets
- ❌ Gestion de prêts entre tiers (A prête à B qui sous-prête à C)
- ❌ Système de caution ou garantie financière
- ❌ Intégration calendrier externe (Google Calendar, etc.)
- ❌ Export comptable ou fiscal
- ❌ Version web (mobile-first pour MVP)
- ❌ Scan de code-barres / QR code pour inventaire
- ❌ Géolocalisation de l'objet
- ❌ Signature électronique ou contrat de prêt

#### Limitations Techniques Assumées V1
- Reconnaissance d'objet basique (top 100 catégories courantes)
- 1 seul canal de notification (push uniquement)
- Stockage local + sync cloud simple (pas de mode hors ligne avancé)
- Pas de gestion multi-comptes (1 utilisateur = 1 compte)

---

## Décisions Stratégiques

Les questions ouvertes ont été clarifiées avec les réponses suivantes :

### Q1 : Consentement de l'Emprunteur ✅
**Décision** : Acceptation recommandée mais non bloquante (Workflow hybride)

**Fonctionnement :**
1. Le Prêteur crée le Prêt → Statut initial = **"En attente de confirmation"**
2. L'Emprunteur reçoit une notification de demande de confirmation
3. Trois issues possibles :
   - **Accepté** → Statut = **"Actif"** (rappels automatiques activés)
   - **Refusé** → Statut = **"Contesté"** (rappels désactivés, alerte au Prêteur)
   - **Ignoré pendant 48h** → Statut = **"Actif par défaut"** (consentement implicite)

**Rationale** : 
- Protège contre les abus tout en évitant le blocage du Prêteur
- L'Emprunteur découvre l'application via invitation naturelle
- Le taux d'acceptation devient un indicateur de confiance exploitable

### Q2 : Valeur Monétaire de l'Objet ✅
**Décision** : Champ optionnel avec cas spécial pour l'argent

**Règles :**
- Valeur estimée = facultative pour objets physiques
- **Exception** : Type d'objet "Argent" → montant obligatoire
- La valeur permet calculs statistiques et priorisation mais n'est jamais affichée à l'Emprunteur (éviter dimension accusatoire)

### Q3 : Ton des Rappels ✅
**Décision** : Modèle pré-défini avec personnalisation encadrée

**Implémentation :**
- Système génère un message diplomatique par défaut
- Le Prêteur peut éditer le message avant envoi
- Garde-fou : validation du ton (pas de vocabulaire agressif détecté par filtre)
- Templates par contexte : rappel préventif / à échéance / relance

**Exemple de modèle :**
> *"Bonjour [Emprunteur], petit rappel amical : le retour de [Objet] est prévu pour le [Date]. Pas d'urgence si tu en as encore besoin, dis-le moi ! — [Prêteur]"*

### Q4 : Définition de "Non Rendu" ✅
**Décision** : Politique d'escalade automatique avec visibilité permanente

**Règles :**
- Séquence de rappels : 3 rappels espacés de 7 jours après échéance
- Après le 3ème rappel ignoré → Statut automatique = **"Non rendu (abandonné)"**
- Le Prêteur peut toujours voir cet objet dans l'onglet "Non rendus"
- Possibilité de réactiver manuellement le Prêt si l'objet est finalement rendu

**Timeline exemple :**
- J0 : Date de retour prévue (pas de rappel immédiat)
- J+3 : 1er rappel
- J+10 : 2ème rappel
- J+17 : 3ème et dernier rappel
- J+18 : Clôture automatique avec statut "Non rendu"

### Q5 : Monétisation ✅
**Décision** : Gratuit au lancement, architecture prête pour Freemium

**V1 (MVP) :**
- Aucune limitation fonctionnelle
- Aucun paiement requis
- Focus : traction et validation du besoin

**Post-MVP (V2+) :**
- Modèle Freemium envisagé
- Limite possible : X prêts actifs simultanés pour version gratuite
- Fonctionnalités premium potentielles : rappels SMS, export de données, multi-comptes

**Impact Architecture :**
- Prévoir dès V1 un champ `subscription_tier` dans le modèle Utilisateur
- Implémenter des quotas désactivés mais présents en base de code

---

**Document validé par :** Esdras GBEDOZIN 
**Date de dernière mise à jour :** 8 février 2026  
**Version :** 1.0 - MVP Baseline
