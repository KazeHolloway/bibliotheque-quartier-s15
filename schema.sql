-- Bibliothèque de quartier : Schéma de Base de Données
-- Akieni Academy | Projet S14-S15 
-- Exécution : psql -U <user> -d <db> -f schema.sql

DROP TABLE IF EXISTS emprunts CASCADE;
DROP TABLE IF EXISTS livres CASCADE;
DROP TABLE IF EXISTS adherents CASCADE;
DROP TABLE IF EXISTS auteurs CASCADE;

-- Table auteurs
CREATE TABLE auteurs (
    id            SERIAL PRIMARY KEY,
    nom           VARCHAR(150) NOT NULL,
    nationalite   VARCHAR(100)
);

-- Table adherents
CREATE TABLE adherents (
    id            SERIAL PRIMARY KEY,
    nom           VARCHAR(150) NOT NULL,
    contact       VARCHAR(150) NOT NULL UNIQUE
);

-- Table livres
-- Relation N,1 avec auteurs (RG : un livre a un seul auteur, un auteur peut avoir plusieurs livres)
CREATE TABLE livres (
    id                  SERIAL PRIMARY KEY,
    titre               VARCHAR(255) NOT NULL,
    auteur_id           INTEGER NOT NULL REFERENCES auteurs(id) ON DELETE RESTRICT,
    annee_publication   INTEGER CONSTRAINT livres_annee_plausible CHECK (annee_publication IS NULL OR annee_publication BETWEEN 1450 AND EXTRACT(YEAR FROM CURRENT_DATE)::integer),
    disponible          BOOLEAN NOT NULL DEFAULT TRUE
);

-- Index utiles pour accélérer la recherche par titre / auteur
CREATE INDEX idx_livres_titre ON livres (titre);
CREATE INDEX idx_livres_auteur_id ON livres (auteur_id);

-- Table : emprunts
-- Relation N,1 avec adherents ET N,1 avec livres
-- date_retour_effective NULL => emprunt en cours
-- date_retour_effective renseignée => emprunt terminé
CREATE TABLE emprunts (
    id                      SERIAL PRIMARY KEY,
    adherent_id             INTEGER NOT NULL REFERENCES adherents(id) ON DELETE RESTRICT,
    livre_id                INTEGER NOT NULL REFERENCES livres(id) ON DELETE RESTRICT,
    date_emprunt            DATE NOT NULL DEFAULT CURRENT_DATE,
    date_retour_prevue      DATE NOT NULL,
    date_retour_effective   DATE,
    CONSTRAINT emprunts_retour_apres_emprunt CHECK (date_retour_prevue >= date_emprunt)
);

CREATE INDEX idx_emprunts_adherent_id ON emprunts (adherent_id);
CREATE INDEX idx_emprunts_livre_id ON emprunts (livre_id);
CREATE INDEX idx_emprunts_en_cours ON emprunts (date_retour_effective);

-- Notes de modélisation :
-- 1a. Un emprunt "en retard" = date_retour_effective IS NULL ET date_retour_prevue < CURRENT_DATE

-- 1b. emprunts_retour_apres_emprunt empêche une date de retour prévue antérieure à la date d'emprunt.
--     Comme date_emprunt vaut la date du jour à la création et ne change plus jamais, ceci interdit
--     de facto une date de retour déjà passée à la création, sans jamais gener le retour tardif
--     d'un emprunt existant (date_emprunt et date_retour_prevue restent fixes apres coup).

-- 2. ON DELETE RESTRICT partout sur les FK : on refuse de supprimer un auteur/adhérent/livre
--    référencé ailleurs, pour préserver l'historique. Le backend renvoie un message
--    clair (409) dans ce cas plutôt que de laisser l'erreur SQL brute.