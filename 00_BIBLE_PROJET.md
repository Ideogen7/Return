# 00_BIBLE_PROJET.md

**Return ↺ - Document de Fondation Fonctionnelle**

---

## 1. Vision & Objectifs (Elevator Pitch)

### Quel est le problème résolu ?

Les utilisateurs prêtent régulièrement des objets personnels (livres, outils, argent) à leur entourage. Ces prêts
génèrent trois problèmes majeurs :

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

Contrairement à une simple liste ou un rappel calendrier, Return prend en charge la partie la plus inconfortable du
prêt : demander le retour. L'application devient le messager neutre, préservant ainsi les relations humaines tout en
protégeant les biens de l'utilisateur.

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

-----Contre Expertise--------

1. **Le "Taux d'activation à 48h" est biaisé.** Un utilisateur peut s'inscrire par curiosité sans avoir d'objet à prêter
   immédiatement. Un KPI "temps médian entre inscription et 1er prêt" serait plus représentatif du comportement réel
   d'adoption.

2. **Aucun KPI côté emprunteur.** Le succès de l'app dépend fortement de l'adoption par les emprunteurs (ce sont eux qui
   reçoivent les rappels et confirment les prêts). Il manque des mesures clés :
    - Taux d'installation de l'app après invitation (emprunteur invité → emprunteur inscrit)
    - Taux de confirmation des prêts (accepté vs ignoré vs contesté)
    - Taux de retour spontané (avant le 1er rappel) vs retour après rappel

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

-----Contre Expertise--------

1. **Contradiction sur le canal de notification de l'emprunteur sans compte.** Le persona dit "Peut ou non utiliser
   l'application" et le dictionnaire du domaine (section 3) confirme "Emprunteur ≠ Utilisateur de l'application (peut ne
   pas avoir de compte)". Or, la V1 ne prévoit que les notifications push comme canal. Un emprunteur sans l'app ne peut
   pas recevoir de push. Comment reçoit-il la demande de confirmation du prêt et les rappels ? Les canaux SMS et email
   sont marqués V2+. Il y a un trou fonctionnel fondamental : soit on impose l'installation de l'app à l'emprunteur (ce
   qui contredit le persona), soit on intègre au minimum un canal email dès la V1.

2. **Fusion emprunteur invité → emprunteur inscrit non spécifiée.** Quand un emprunteur invité décide de s'inscrire,
   comment son profil "contact" (créé par le prêteur) fusionne-t-il avec son nouveau compte ? Et si Marie est emprunteur
   chez 3 prêteurs différents avec 3 fiches Borrower distinctes, que se passe-t-il quand elle crée un compte ?

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

- Définition : Transaction enregistrée où un Objet est temporairement transféré d'un Prêteur à un Emprunteur avec
  expectative de retour
- Attributs clés : Date de départ, Date de retour prévue, Statut
- Cycle de vie : Actif → Rappelé → Rendu/Non rendu

**Objet (Item)**

- Définition : Bien physique ou immatériel faisant l'objet d'un Prêt
- Distinction : Objet ≠ Catégorie (ex: "Ma perceuse Bosch" vs "Outil électrique")
- Identification : Photo, Nom, Description, Valeur estimée (optionnelle)
- **Cas spécial** : Type "Argent" → Montant obligatoire (constitue la valeur du prêt)

-----Contre Expertise--------

Le type "Argent" en tant qu'Item est bancal. Un prêt d'argent n'a pas de photo à prendre, pas de reconnaissance d'objet
possible, pas de retour physique (c'est un virement ou du liquide). Le workflow est fondamentalement différent d'un
objet. Ça mériterait soit un type de Loan distinct (LoanType: OBJECT | MONEY), soit au minimum une clarification du
parcours utilisateur spécifique pour ce cas.

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

-----Contre Expertise--------

Le dictionnaire liste 3 canaux (Push, SMS, Email) mais la V1 ne supporte que le push. Le dictionnaire du domaine devrait
refléter le scope réel du MVP pour éviter toute confusion lors de l'implémentation. Proposer : "Canal V1 : Push
notification uniquement. V2+ : SMS, Email."

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

-----Contre Expertise--------

Le résumé du cycle de vie en introduction de l'entité Prêt ("Actif → Rappelé → Rendu/Non rendu") est trompeur. Il omet
les statuts PENDING_CONFIRMATION, ACTIVE_BY_DEFAULT et CONTESTED qui sont pourtant au cœur du workflow de confirmation.
Ce résumé devrait être mis à jour pour refléter le vrai parcours : En attente de confirmation → Actif (ou Contesté /
Actif par défaut) → En attente de retour → Rendu / Non rendu.

### Vocabulaire Exclu (Anti-Patterns)

- ❌ **"Utilisateur"** → Trop vague. Utiliser explicitement Prêteur ou Emprunteur
- ❌ **"Transaction"** → Implique un échange financier. Utiliser Prêt
- ❌ **"Client"** → Connotation commerciale. Ce n'est pas un service payant (pour MVP)
- ❌ **"Propriétaire" / "Possesseur"** → Confusion juridique. Utiliser Prêteur

-----Contre Expertise--------

L'interdiction du terme "Utilisateur" est louable dans le langage métier, mais en pratique l'architecture technique
utilise un modèle `User` (table `users`, `UserService`, `UserRepository`). Il faut clarifier que cette interdiction
s'applique au vocabulaire métier et à la communication, pas au code technique où `User` reste le terme standard pour
désigner un compte authentifié (qui peut être Lender ou Borrower selon le contexte).

---

## 4. Scope Fonctionnel (Macro)

### IN SCOPE - MVP (V1)

#### Epic 1 : Enregistrement de Prêt

- Capture photo d'objet avec reconnaissance automatique
- Saisie manuelle (fallback si reconnaissance échoue)
- Ajout d'Emprunteur (nom + contact)
- Définition de date de retour ou "indéfinie"
- Confirmation et création du Prêt

-----Contre Expertise--------

"Reconnaissance automatique via photo" : est-ce que le ROI est justifié en V1 ? Google Cloud Vision coûte de l'argent,
ajoute de la latence, une gestion d'erreurs complexe (fallback si le service est down), et l'OpenAPI ne liste que 8
catégories (TOOLS, BOOKS, ELECTRONICS, etc.). Entre l'OCR qui suggère "c'est probablement un outil" et l'utilisateur qui
sélectionne "Outils" dans un dropdown en 2 secondes, le gain utilisateur est marginal pour la complexité technique
ajoutée. À considérer comme V2 pour se concentrer sur le cœur métier en MVP.

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

-----Contre Expertise--------

"Configuration de politique de rappel par Prêt" est en tension avec la décision Q4 plus bas qui impose une politique
d'escalade fixe (J+3, J+10, J+17). Si la politique est configurable par prêt, alors Q4 ne décrit qu'une politique par
défaut. Si Q4 est la règle stricte, alors cette Epic survend la configurabilité. Il faut trancher : politique fixe ou
configurable ?

#### Epic 4 : Historique

- Consultation des Prêts terminés (rendus + non rendus)
- Vue par Emprunteur : Taux de retour, délai moyen
- Statistiques personnelles : Objet le plus prêté, meilleur emprunteur

#### Epic 5 : Gestion de Compte

- Inscription / Connexion (email + mot de passe)
- Profil utilisateur basique
- Paramètres de notification (canaux préférés)

-----Contre Expertise--------

"Paramètres de notification (canaux préférés)" est incohérent avec la V1 qui ne propose qu'un seul canal (push). S'il n'
y a qu'un canal, il n'y a rien à "préférer". Cet item devrait être reporté en V2 quand les canaux SMS et email seront
disponibles.

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

-----Contre Expertise--------

"Pas de mode hors ligne avancé" : c'est listé comme limitation assumée mais jamais défini. Quel est le mode hors ligne "
basique" ? L'app fonctionne-t-elle du tout sans internet ? Le prêteur peut-il créer un prêt offline et synchroniser plus
tard ? Ou bien l'app est purement online et affiche un écran d'erreur sans connexion ? Ce point doit être explicité car
il impacte l'architecture frontend (cache local, queue de sync, etc.).

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

-----Contre Expertise--------

Le "consentement implicite" après 48h de silence est juridiquement discutable. Créer un engagement au nom de quelqu'un
qui n'a pas répondu peut poser problème. Si l'emprunteur affirme "je n'ai jamais emprunté ça" et reçoit ensuite des
rappels automatiques, cela pourrait être perçu comme du harcèlement. Alternative à considérer : le prêt reste en PENDING
indéfiniment avec une notification au prêteur "pas de réponse", et c'est le prêteur qui décide manuellement de passer en
ACTIVE ou d'annuler.

### Q2 : Valeur Monétaire de l'Objet ✅

**Décision** : Champ optionnel avec cas spécial pour l'argent

**Règles :**

- Valeur estimée = facultative pour objets physiques
- **Exception** : Type d'objet "Argent" → montant obligatoire
- La valeur permet calculs statistiques et priorisation mais n'est jamais affichée à l'Emprunteur (éviter dimension
  accusatoire)

### Q3 : Ton des Rappels ✅

**Décision** : Modèle pré-défini avec personnalisation encadrée

**Implémentation :**

- Système génère un message diplomatique par défaut
- Le Prêteur peut éditer le message avant envoi
- Garde-fou : validation du ton (pas de vocabulaire agressif détecté par filtre)
- Templates par contexte : rappel préventif / à échéance / relance

-----Contre Expertise--------

Le "garde-fou de validation du ton (pas de vocabulaire agressif détecté par filtre)" est un NLP non trivial. Qui le
développe ? Est-ce un modèle de classification de tonalité, une liste de mots interdits, ou un appel à une API externe ?
Ce n'est mentionné nulle part dans la roadmap backend ni frontend. Si c'est une simple blocklist de mots, c'est
facilement contournable. Si c'est du NLP sérieux, c'est un projet en soi. Risque de scope creep : à clarifier ou
reporter en V2.

**Exemple de modèle :**
> *"Bonjour [Emprunteur], petit rappel amical : le retour de [Objet] est prévu pour le [Date]. Pas d'urgence si tu en as
encore besoin, dis-le moi ! — [Prêteur]"*

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

## Contre Expertise — Manques Transversaux

**RGPD / Protection des données.** L'app stocke des noms, emails, numéros de téléphone, photos d'objets personnels,
historique de prêts. Pour une app européenne, il faut au minimum : recueil du consentement, droit de suppression (droit
à l'oubli), politique de rétention des données, et mention légale. La Bible ne mentionne aucune exigence RGPD. Cela
devrait être un Epic à part entière ou au minimum une section dédiée dans ce document.

**Gestion de la langue / i18n.** L'app envoie des messages diplomatiques aux emprunteurs, mais en quelle langue ?
L'exemple de modèle est en français. Si l'emprunteur est anglophone, il reçoit un message incompréhensible. Même en V1
franco-française, il faut au minimum anticiper l'externalisation des chaînes de caractères pour ne pas avoir à tout
refactorer en V2.

**Scénario de suppression de compte.** Que se passe-t-il si un prêteur supprime son compte alors que des prêts sont en
cours ? Que deviennent les données des emprunteurs liés ? L'OpenAPI prévoit un endpoint `POST /users/me/delete` mais la
Bible ne l'anticipe pas dans le scope fonctionnel ni dans les décisions stratégiques. Le cycle de vie du compte
utilisateur (désactivation, suppression, anonymisation) devrait être spécifié.

---

**Document validé par :** Esdras GBEDOZIN
**Contre-expertise par :** Ismael AÏHOU
**Date de dernière mise à jour :** 10 février 2026
**Version :** 1.0 - MVP Baseline
