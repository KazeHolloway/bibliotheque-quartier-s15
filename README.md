# Folio-Lib

Application de gestion d'une bibliothèque de quartier : auteurs, adhérents, catalogue de livres et emprunts, avec un tableau de bord statistique. Projet réalisé sur deux semaines (S14-S15, dans le cadre de ma formation à Akieni Academy, Cohorte 2, Module 3) : de la conception de la base de données jusqu'à l'interface utilisée par le personnel.

**Démo en ligne : [folio-lib.onrender.com](https://folio-lib.onrender.com)**

## Sommaire

- [Folio-Lib](#folio-lib)
  - [Sommaire](#sommaire)
  - [À propos](#à-propos)
  - [Fonctionnalités](#fonctionnalités)
    - [Tableau de bord](#tableau-de-bord)
    - [Livres](#livres)
    - [Auteurs](#auteurs)
    - [Adhérents](#adhérents)
    - [Emprunts](#emprunts)
    - [Ensemble du site](#ensemble-du-site)
  - [Expérience utilisateur et design](#expérience-utilisateur-et-design)
  - [Public visé](#public-visé)
  - [Stack technique](#stack-technique)
  - [Structure du projet](#structure-du-projet)
  - [Modèle de données](#modèle-de-données)
  - [Installation locale](#installation-locale)
  - [Déploiement](#déploiement)
  - [Endpoints de l'API](#endpoints-de-lapi)
  - [Auteur du projet](#auteur-du-projet)
  - [Liens : Live + Repository + README](#liens--live--repository--readme)

## À propos

Une bibliothèque de quartier informatise la gestion de ses livres, de ses adhérents et de ses emprunts. Folio-Lib couvre l'ensemble du besoin : de la base de données relationnelle jusqu'à l'interface graphique utilisée au quotidien par le personnel, en passant par une API REST complète.

## Fonctionnalités

### Tableau de bord
- Nombre total de livres, d'auteurs et d'adhérents
- Nombre d'emprunts en cours et d'emprunts en retard, avec mise en évidence visuelle s'il y en a
- Livre le plus emprunté et adhérent le plus actif, avec leur nombre d'emprunts

### Livres
- Consultation du catalogue avec le nom de l'auteur associé à chaque livre
- Ajout, modification, suppression (titre, auteur, année de publication)
- Statut de disponibilité visible (disponible / emprunté)
- Recherche par titre ou nom d'auteur
- Tri par titre ou par année de publication, croissant ou décroissant, avec option d'afficher les disponibles en premier
- Pagination du catalogue

### Auteurs
- Consultation de la liste, ajout, modification, suppression (nom, nationalité)
- Message d'erreur explicite si un auteur est encore référencé par un livre

### Adhérents
- Consultation de la liste, ajout, modification, suppression (nom, contact)
- Validation du champ contact (email ou numéro de téléphone)
- Consultation de l'historique complet des emprunts d'un adhérent (en cours et passés) dans une fenêtre modale, avec le statut de chaque emprunt
- Message d'erreur explicite si un adhérent est encore référencé par un emprunt

### Emprunts
- Enregistrement d'un emprunt : choix de l'adhérent, choix du livre via un sélecteur affichant la disponibilité de chaque livre, date de retour prévue
- Refus automatique si le livre est déjà emprunté
- Passage automatique du livre au statut "emprunté" à la création, et à "disponible" au retour
- Liste des emprunts en cours avec distinction visuelle immédiate entre "en cours" et "en retard"
- Enregistrement du retour d'un livre en un clic

### Ensemble du site
- Navigation claire entre Tableau de bord, Livres, Auteurs, Adhérents et Emprunts
- Formulaires avec validation et messages d'erreur clairs, sans dépendre des bulles natives du navigateur
- Communication avec l'API entièrement via `fetch()`

## Expérience utilisateur et design

- Mode clair et mode sombre, mémorisés d'une visite à l'autre
- 6 palettes de couleurs au choix (Rubis, Saphir, Émeraude, Or, Argent, Cristal), déclinées en clair et en sombre, mémorisées également
- Interface entièrement responsive : sidebar rétractable en tiroir plein écran sur mobile, mise en page adaptée sur tablette et desktop
- Icônes SVG dessinées à la main, cohérentes avec le thème actif
- Animations de survol sur l'ensemble des éléments interactifs (boutons, cartes, liens de navigation)
- Messages de succès et d'erreur avec fermeture manuelle ou automatique
- Bouton de retour en haut de page
- Aucune bulle de validation native du navigateur : tous les messages sont personnalisés et cohérents avec le design du site

## Public visé

Folio-Lib est un outil de gestion interne destiné au personnel d'une bibliothèque de quartier (typiquement un ou une bibliothécaire), pas une application grand public. Toutes les actions (ajout, modification, suppression) sont accessibles à quiconque dispose du lien : le projet, tel que défini par le cahier des charges, ne comprend pas de système d'authentification ou de gestion de comptes.

## Stack technique

- Node.js / Express (API REST)
- PostgreSQL (via `pg`) - V17.11-3 en local, connexion chiffrée (SSL) en production
- Architecture backend : `routes` → `controllers`, middlewares séparés (logger, validation, gestion d'erreurs centralisée)
- HTML5 / CSS3 / JavaScript vanilla (Fetch API, async/await) pour le frontend, aucun framework

## Structure du projet

```bash
bibliotheque-quartier-s15/
├── public/                          # frontend
│   ├── css/
│   │   └── style.css                # feuille de style unique, thème et composants
│   ├── js/
│   │   ├── adherents.js
│   │   ├── api.js                   # wrapper fetch et gestion des messages, partagé
│   │   ├── auteurs.js
│   │   ├── dashboard.js
│   │   ├── emprunts.js
│   │   ├── livres.js
│   │   ├── theme-init.js            # anti-flash, applique le thème avant l'affichage
│   │   └── theme.js                 # palette, mode clair/sombre, sidebar, partage
│   ├── adherents.html
│   ├── auteurs.html
│   ├── emprunts.html
│   ├── index.html                   # tableau de bord
│   └── livres.html
├── src/                             # backend
│   ├── config/
│   │   └── db.js                    # connexion PostgreSQL (pool, SSL en production)
│   ├── controllers/
│   │   ├── adherentsController.js
│   │   ├── auteursController.js
│   │   ├── empruntsController.js
│   │   ├── livresController.js
│   │   └── statsController.js
│   ├── middlewares/
│   │   ├── errorHandler.js          # gestion centralisée des erreurs
│   │   ├── logger.js
│   │   └── validate.js
│   ├── routes/
│   │   ├── adherents.js
│   │   ├── auteurs.js
│   │   ├── emprunts.js
│   │   ├── livres.js
│   │   └── stats.js
│   ├── utils/
│   │   ├── AppError.js
│   │   └── asyncHandler.js
│   ├── app.js                       # configuration Express, sert aussi le frontend
│   └── server.js                    # point d'entrée
├── .env.example
├── .gitignore
├── ERD.md                           # diagramme entité-relation (Mermaid)
├── package.json
├── package-lock.json
├── README.md
└── schema.sql                       # script de création des tables
```

## Modèle de données

Voir [`ERD.md`](./ERD.md) pour le diagramme, et [`schema.sql`](./schema.sql) pour le script complet.

Choix de modélisation principaux :
- **`livres.disponible`** est un booléen dénormalisé, maintenu par le backend (transaction SQL) lors de la création ou du retour d'un emprunt, plutôt que recalculé à chaque lecture. Ça simplifie énormément les listes et le filtrage.
- **« Retard »** n'est pas stocké : il est calculé à la volée (`date_retour_effective IS NULL AND date_retour_prevue < CURRENT_DATE`) pour ne jamais être désynchronisé.
- **Suppression** : toutes les clés étrangères sont en `ON DELETE RESTRICT`, on ne supprime jamais un auteur, un adhérent ou un livre référencé ailleurs ; l'API renvoie une erreur 409 claire dans ce cas.
- **Concurrence** : la création d'un emprunt utilise `SELECT ... FOR UPDATE` dans une transaction, pour éviter que deux emprunts soient créés simultanément sur le même livre.

## Installation locale

```bash
npm install
cp .env.example .env
# éditer .env avec vos identifiants PostgreSQL locaux

# créer la base, puis charger le schéma (via pgAdmin ou psql) :
createdb bibliotheque
psql -U postgres -d bibliotheque -f schema.sql

npm run dev   # ou npm start
```

L'application démarre sur `http://localhost:3000` (voir `PORT` dans `.env`), frontend et API compris.
Endpoint de contrôle : `GET /api/health`.

## Déploiement

L'application est déployée sur [Render](https://render.com) : un service web Node.js et une base PostgreSQL, tous deux en région Frankfurt (EU Central).

**Démo : [https://folio-lib.onrender.com](https://folio-lib.onrender.com)**

À noter sur le plan gratuit utilisé :
- Le service web se met en veille après 15 minutes d'inactivité ; la première requête suivante déclenche un réveil automatique de 30 à 50 secondes, aucune action requise.
- La base de données gratuite a une durée de vie limitée dans le temps. Si elle a expiré au moment où vous lisez ceci, le code reste intact sur ce dépôt : il suffit de recréer une base et de rejouer `schema.sql` pour redémontrer le projet.

## Endpoints de l'API

| Méthode        | Route                         | Description                                                        |
| -------------- | ------------------------------| ------------------------------------------------------------------ |
| GET/POST       | `/api/auteurs`                | Liste / création d'auteurs                                         |
| PUT/DELETE     | `/api/auteurs/:id`            | Modification / suppression                                         |
| GET/POST       | `/api/adherents`              | Liste / création d'adhérents                                       |
| GET            | `/api/adherents/:id/emprunts` | Historique des emprunts d'un adhérent                              |
| GET/POST       | `/api/livres`                 | Liste (recherche `?q=`, pagination `?page=&limit=`, tri `?sort=`) / création |
| GET/PUT/DELETE | `/api/livres/:id`             | Détail / modification / suppression                                |
| POST           | `/api/emprunts`               | Créer un emprunt (refuse si livre déjà emprunté)                   |
| PUT            | `/api/emprunts/:id/retour`    | Enregistrer le retour d'un livre                                   |
| GET            | `/api/emprunts`               | Liste complète des emprunts                                        |
| GET            | `/api/emprunts/en-cours`      | Emprunts en cours                                                  |
| GET            | `/api/emprunts/en-retard`     | Emprunts en retard                                                 |
| GET            | `/api/stats`                  | Tableau de bord (totaux, livre le + emprunté, adhérent le + actif) |
| GET            | `/api/health`                 | Contrôle de santé de l'API                                         |

## Auteur du projet

MASSAMBA BOUESSO Christophe Darly (GitHub : [KazeHolloway](https://github.com/KazeHolloway))

## Liens : Live + Repository + README

- [Lien live](https://folio-lib.onrender.com)
- [Lien vers le repository](https://github.com/KazeHolloway/bibliotheque-quartier-s15)
- [Lien vers le README](https://kazeholloway.github.io/bibliotheque-quartier-s15/)