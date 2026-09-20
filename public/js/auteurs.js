// gestion complete de la page auteurs : chargement, ajout, modification, suppression
const messageContainer = document.getElementById('message');
const tbody = document.getElementById('auteurs-tbody');
const form = document.getElementById('auteur-form');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-edit-btn');
const nomInput = document.getElementById('nom');
const nationaliteInput = document.getElementById('nationalite');

let idEnEdition = null;

// charge la liste complete des auteurs, pas de pagination ni de recherche demandee pour cette ressource
async function chargerAuteurs() {
    try {
        const auteurs = await api.get('/auteurs');
        afficherAuteurs(auteurs);
    } catch (err) {
        showMessage(messageContainer, `Impossible de charger les auteurs : ${err.message}`);
    }
}

function afficherAuteurs(auteurs) {
    if (auteurs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="empty-state">Aucun auteur enregistré pour le moment.</td></tr>';
        return;
    }

    tbody.innerHTML = auteurs.map((auteur) => `
        <tr>
        <td>${echapperHtml(auteur.nom)}</td>
        <td>${auteur.nationalite ? echapperHtml(auteur.nationalite) : '<span class="text-muted">Non renseignée</span>'}</td>
        <td class="text-center">
            <button type="button" class="btn-outline btn-small" data-modifier="${auteur.id}">Modifier</button>
            <button type="button" class="btn-danger btn-small" data-supprimer="${auteur.id}">Supprimer</button>
        </td>
        </tr>
    `).join('');
}

// remet le formulaire dans son etat initial d'ajout
function reinitialiserFormulaire() {
    idEnEdition = null;
    form.reset();
    formTitle.textContent = 'Ajouter un auteur';
    submitBtn.textContent = "Ajouter l'auteur";
    cancelBtn.hidden = true;
}

// recharge un auteur precis et passe le formulaire en mode edition
async function passerEnModeEdition(id) {
    try {
        const auteur = await api.get(`/auteurs/${id}`);
        idEnEdition = id;
        nomInput.value = auteur.nom;
        nationaliteInput.value = auteur.nationalite || '';
        formTitle.textContent = "Modifier l'auteur";
        submitBtn.textContent = 'Enregistrer les modifications';
        cancelBtn.hidden = false;
        nomInput.focus();
    } catch (err) {
        showMessage(messageContainer, `Impossible de charger cet auteur : ${err.message}`);
    }
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessage(messageContainer);

    const nom = nomInput.value.trim();
    const nationalite = nationaliteInput.value.trim();

    if (!nom) {
        showMessage(messageContainer, 'Le nom est obligatoire.');
        return;
    }

    const donnees = { nom, nationalite: nationalite || null };

    try {
        if (idEnEdition) {
        await api.put(`/auteurs/${idEnEdition}`, donnees);
        showMessage(messageContainer, 'Auteur modifié avec succès.', 'success');
        } else {
        await api.post('/auteurs', donnees);
        showMessage(messageContainer, 'Auteur ajouté avec succès.', 'success');
        }
        reinitialiserFormulaire();
        chargerAuteurs();
    } catch (err) {
        showMessage(messageContainer, err.message);
    }
});

cancelBtn.addEventListener('click', reinitialiserFormulaire);

// delegation d'evenements sur le tableau pour gerer modification et suppression sans reattacher a chaque rendu
tbody.addEventListener('click', async (e) => {
    const idModifier = e.target.dataset.modifier;
    const idSupprimer = e.target.dataset.supprimer;

    if (idModifier) {
        passerEnModeEdition(idModifier);
    }

    if (idSupprimer) {
        const confirmation = confirm('Supprimer cet auteur ? Cette action est irréversible.');
        if (!confirmation) return;

        try {
            await api.delete(`/auteurs/${idSupprimer}`);
            showMessage(messageContainer, 'Auteur supprimé avec succès.', 'success');
            chargerAuteurs();
        } catch (err) {
            const messageAffiche = err.message.includes('référencée ailleurs')
                ? "Impossible d'effectuer cette action : cet auteur est référencé ailleurs (ex. un livre, un emprunt)."
                : err.message;
            showMessage(messageContainer, messageAffiche);
        }
    }
});

chargerAuteurs();