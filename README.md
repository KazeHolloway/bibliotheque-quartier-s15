# Bibliothèque de quartier : Gestion Backend & Frontend

## Concept
Application de gestion d'une bibliothèque de quartier : gestion des auteurs, des adhérents, du catalogue de livres (avec statut de disponibilité) et des emprunts (création, retour, détection automatique des retards), avec un tableau de bord statistique. Projet réalisé sur deux semaines (S14-S15) : de la conception de la base de données jusqu'à l'interface utilisée par le personnel.

## Stack technique
- Node.js / Express (API REST)
- PostgreSQL (via `pg`), requêtes SQL paramétrées et transactions
- Architecture backend : `routes` → `controllers`, middlewares séparés (logger, validation, gestion d'erreurs centralisée)
- HTML5 / CSS3 / JavaScript (Fetch API, async/await) pour le frontend *(en S15)*

## Structure du projet
```bash
bibliotheque-quartier-s15/
├── schema.sql              # script de création des tables
├── ERD.md                  # diagramme entité-relation (Mermaid)
├── .env.example
├── src/
│   ├── config/
│   │   └── db.js            # connexion PostgreSQL (pool)
│   ├── middlewares/
│   │   ├── logger.js
│   │   ├── validate.js
│   │   └── errorHandler.js
│   ├── controllers/
│   │   ├── auteursController.js
│   │   ├── adherentsController.js
│   │   ├── livresController.js
│   │   ├── empruntsController.js
│   │   └── statsController.js
│   ├── routes/
│   │   ├── auteurs.js
│   │   ├── adherents.js
│   │   ├── livres.js
│   │   ├── emprunts.js
│   │   └── stats.js
│   ├── utils/
│   │   ├── AppError.js
│   │   └── asyncHandler.js
│   ├── app.js
│   └── server.js
├── public/                  # frontend HTML/CSS/JS (S15, à venir)
└── README.md
```

## Modèle de données
Voir [`ERD.md`](./ERD.md) pour le diagramme, et [`schema.sql`](./schema.sql) pour le script complet.

Choix de modélisation principaux :
- **`livres.disponible`** est un booléen dénormalisé, maintenu par le backend (transaction SQL) lors de la création/retour d'un emprunt, plutôt que recalculé à chaque lecture. Ça simplifie énormément les listes et le filtrage.
- **« Retard »** n'est pas stocké : il est calculé à la volée (`date_retour_effective IS NULL AND date_retour_prevue < CURRENT_DATE`) pour ne jamais être désynchronisé.
- **Suppression** : toutes les clés étrangères sont en `ON DELETE RESTRICT` on ne supprime jamais un auteur/adhérent/livre référencé ailleurs ; l'API renvoie une erreur 409 claire dans ce cas.
- **Concurrence** : la création d'un emprunt utilise `SELECT ... FOR UPDATE` dans une transaction, pour éviter que deux emprunts soient créés simultanément sur le même livre.

## Installation
```bash
npm install
cp .env.example .env
# éditer .env avec vos identifiants PostgreSQL locaux

# créer la base, puis charger le schéma (via pgAdmin ou psql) :
createdb bibliotheque
psql -U postgres -d bibliotheque -f schema.sql

npm run dev   # ou npm start
```

L'API démarre sur `http://localhost:3000` (voir `PORT` dans `.env`).
Endpoint de contrôle : `GET /api/health`.

## Endpoints principaux

| Méthode        | Route                         | Description                                                        |
| -------------- | ------------------------------| ------------------------------------------------------------------ |
| GET/POST       | `/api/auteurs`                | Liste / création d'auteurs                                         |
| PUT/DELETE     | `/api/auteurs/:id`            | Modification / suppression                                         |
| GET/POST       | `/api/adherents`              | Liste / création d'adhérents                                       |
| GET            | `/api/adherents/:id/emprunts` | Historique des emprunts d'un adhérent                              |
| GET/POST       | `/api/livres`                 | Liste (recherche `?q=`, pagination `?page=&limit=`) / création     |
| GET/PUT/DELETE | `/api/livres/:id`             | Détail / modification / suppression                                |
| POST           | `/api/emprunts`               | Créer un emprunt (refuse si livre déjà emprunté)                   |
| PUT            | `/api/emprunts/:id/retour`    | Enregistrer le retour d'un livre                                   |
| GET            | `/api/emprunts/en-cours`      | Emprunts en cours                                                  |
| GET            | `/api/emprunts/en-retard`     | Emprunts en retard                                                 |
| GET            | `/api/stats`                  | Tableau de bord (totaux, livre le + emprunté, adhérent le + actif) |

## Auteur
MASSAMBA BOUESSO Christophe Darly

## Lien live + Repository + Readme
- Lien live : à venir avec S15 ; une application full-stack avec base de données ne peut pas tourner uniquement sur GitHub Pages (statique) ; le lien sera ajouté une fois le mode de déploiement fait.
- [Lien vers le repository](https://github.com/KazeHolloway/bibliotheque-quartier-s15)
- [Lien vers le readme](https://kazeholloway.github.io/bibliotheque-quartier-s15/)
