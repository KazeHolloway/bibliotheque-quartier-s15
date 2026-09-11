# Diagramme entité-relation

```mermaid
erDiagram
    AUTEURS ||--o{ LIVRES : "écrit"
    ADHERENTS ||--o{ EMPRUNTS : "emprunte"
    LIVRES ||--o{ EMPRUNTS : "concerné par"

    AUTEURS {
        int id PK
        varchar nom
        varchar nationalite
    }

    ADHERENTS {
        int id PK
        varchar nom
        varchar contact
    }

    LIVRES {
        int id PK
        varchar titre
        int auteur_id FK
        int annee_publication
        boolean disponible
    }

    EMPRUNTS {
        int id PK
        int adherent_id FK
        int livre_id FK
        date date_emprunt
        date date_retour_prevue
        date date_retour_effective
    }
```

GitHub affiche ce bloc Mermaid directement dans le README/ERD.md — pas besoin d'image externe.
Un `emprunt` "en cours" = `date_retour_effective IS NULL`.
Un `emprunt` "en retard" = `date_retour_effective IS NULL` ET `date_retour_prevue < CURRENT_DATE`.
