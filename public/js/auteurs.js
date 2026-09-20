// gestion complete de la page auteurs : chargement, recherche, filtre, pagination, ajout, modification, suppression
const messageContainer = document.getElementById('message');
const tbody = document.getElementById('auteurs-tbody');
const paginationContainer = document.getElementById('pagination');
const form = document.getElementById('auteur-form');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-edit-btn');
const nomInput = document.getElementById('nom');
const nationaliteInput = document.getElementById('nationalite');
const searchInput = document.getElementById('search-input');
const filtreNationaliteSelect = document.getElementById('filtre-nationalite');
const resetFiltresBtn = document.getElementById('reset-filtres-btn');

let idEnEdition = null;
let pageActuelle = 1;
const limiteParPage = 8;
let rechercheActuelle = '';
let delaiRecherche = null;

// remplit le menu deroulant des nationalites reellement presentes en base
async function chargerNationalites() {
    try {
        const nationalites = await api.get('/auteurs/nationalites');
        const options = nationalites.map((n) => `<option value="${echapperHtml(n)}">${echapperHtml(n)}</option>`).join('');
        filtreNationaliteSelect.innerHTML = `<option value="">Toutes les nationalités</option>${options}`;
    } catch (err) {
        showMessage(messageContainer, `Impossible de charger les nationalités : ${err.message}`);
    }
}

// construit une ligne de tableau pour un auteur donne
function construireLigne(auteur) {
    return `
        <tr>
        <td>${echapperHtml(auteur.nom)}</td>
        <td>${auteur.nationalite ? echapperHtml(auteur.nationalite) : '<span class="text-muted">Non renseignée</span>'}</td>
        <td class="text-center">
            <button type="button" class="btn-outline btn-small" data-modifier="${auteur.id}">Modifier</button>
            <button type="button" class="btn-danger btn-small" data-supprimer="${auteur.id}">Supprimer</button>
        </td>
        </tr>
    `;
}

// message affiche quand la liste est vide, adapte selon la recherche et le filtre actifs
function construireMessageVide(nationalite, recherche) {
    if (!nationalite && !recherche) return 'Aucun auteur enregistré pour le moment.';
    if (nationalite) return `Aucun auteur trouvé pour la nationalité "${echapperHtml(nationalite)}".`;
    return 'Aucun auteur trouvé.';
}

// construit les boutons de pagination selon les informations renvoyees par l'API
function construirePagination(pagination) {
    if (pagination.totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    paginationContainer.innerHTML = `
        <button class="btn-ghost btn-small" id="page-precedente" ${pagination.page <= 1 ? 'disabled' : ''}>Précédent</button>
        <span class="page-info">Page ${pagination.page} sur ${pagination.totalPages}</span>
        <button class="btn-ghost btn-small" id="page-suivante" ${pagination.page >= pagination.totalPages ? 'disabled' : ''}>Suivant</button>
    `;

    document.getElementById('page-precedente')?.addEventListener('click', () => {
        pageActuelle -= 1;
        chargerAuteurs();
    });

    document.getElementById('page-suivante')?.addEventListener('click', () => {
        pageActuelle += 1;
        chargerAuteurs();
    });
}

// recupere la liste des auteurs depuis l'API en tenant compte de la recherche, du filtre et de la page en cours
async function chargerAuteurs() {
    try {
        const params = new URLSearchParams({ page: pageActuelle, limit: limiteParPage });
        if (rechercheActuelle) params.set('q', rechercheActuelle);
        if (filtreNationaliteSelect.value) params.set('nationalite', filtreNationaliteSelect.value);

        const resultat = await api.get(`/auteurs?${params.toString()}`);

        if (resultat.data.length === 0) {
            const message = construireMessageVide(filtreNationaliteSelect.value, rechercheActuelle);
            tbody.innerHTML = `<tr><td colspan="3" class="empty-state">${message}</td></tr>`;
        } else {
            tbody.innerHTML = resultat.data.map(construireLigne).join('');
        }

        construirePagination(resultat.pagination);
    } catch (err) {
        showMessage(messageContainer, `Impossible de charger les auteurs : ${err.message}`);
    }
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
        chargerNationalites();
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
            chargerNationalites();
            chargerAuteurs();
        } catch (err) {
            const messageAffiche = err.message.includes('référencée ailleurs')
                ? "Impossible d'effectuer cette action : cet auteur est référencé ailleurs (ex. un livre, un emprunt)."
                : err.message;
            showMessage(messageContainer, messageAffiche);
        }
    }
});

// relance la recherche apres une courte pause, pour eviter une requete a chaque frappe
searchInput.addEventListener('input', () => {
    clearTimeout(delaiRecherche);
    delaiRecherche = setTimeout(() => {
        rechercheActuelle = searchInput.value.trim();
        pageActuelle = 1;
        chargerAuteurs();
    }, 350);
});

filtreNationaliteSelect.addEventListener('change', () => {
    pageActuelle = 1;
    chargerAuteurs();
});

resetFiltresBtn.addEventListener('click', () => {
    searchInput.value = '';
    rechercheActuelle = '';
    filtreNationaliteSelect.value = '';
    pageActuelle = 1;
    chargerAuteurs();
});

chargerNationalites();
chargerAuteurs();