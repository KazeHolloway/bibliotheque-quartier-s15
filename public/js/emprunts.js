// gestion complete de la page emprunts : chargement, creation, retour
const messageContainer = document.getElementById('message');
const tbody = document.getElementById('emprunts-tbody');
const form = document.getElementById('emprunt-form');
const submitBtn = document.getElementById('submit-btn');
const adherentSelect = document.getElementById('adherent_id');
const dateInput = document.getElementById('date_retour_prevue');

const livreSelectContainer = document.getElementById('livre-select');
const livreSelectTrigger = document.getElementById('livre-select-trigger');
const livreSelectLabel = document.getElementById('livre-select-label');
const livreSelectList = document.getElementById('livre-select-list');
const livreIdInput = document.getElementById('livre_id');

// renvoie la date du jour au format YYYY-MM-DD en heure locale, jamais via toISOString qui bascule en UTC
function dateDuJourLocale() {
    const d = new Date();
    const annee = d.getFullYear();
    const mois = String(d.getMonth() + 1).padStart(2, '0');
    const jour = String(d.getDate()).padStart(2, '0');
    return `${annee}-${mois}-${jour}`;
}

// convertit une date au format YYYY-MM-DD renvoyee par l'API en affichage JJ/MM/AAAA
function formatDate(chaineDate) {
    if (!chaineDate) return '';
    const [annee, mois, jour] = chaineDate.split('-');
    return `${jour}/${mois}/${annee}`;
}

dateInput.min = dateDuJourLocale();

// charge la liste des adherents pour le menu deroulant natif
async function chargerAdherents() {
    try {
        const adherents = await api.get('/adherents');
        const options = adherents.map((a) => `<option value="${a.id}">${echapperHtml(a.nom)}</option>`).join('');
        adherentSelect.innerHTML = `<option value="">Sélectionner un adhérent</option>${options}`;
    } catch (err) {
        showMessage(messageContainer, `Impossible de charger les adhérents : ${err.message}`);
    }
}

// charge tous les livres et construit les options du selecteur personnalise, disponibles ou non
async function chargerLivres() {
    try {
        const resultat = await api.get('/livres?limit=100');
        construireOptionsLivres(resultat.data);
    } catch (err) {
        showMessage(messageContainer, `Impossible de charger les livres : ${err.message}`);
    }
}

function construireOptionsLivres(livres) {
    if (livres.length === 0) {
        livreSelectList.innerHTML = '<li class="empty-state">Aucun livre au catalogue.</li>';
        return;
    }

    livreSelectList.innerHTML = livres.map((livre) => `
        <li class="livre-select-option ${livre.disponible ? '' : 'is-disabled'}" role="option" data-id="${livre.id}" data-titre="${echapperHtml(livre.titre)}" aria-disabled="${!livre.disponible}">
        <span class="livre-select-option-titre">${echapperHtml(livre.titre)}</span>
        ${livre.disponible
            ? '<span class="badge badge-success">Disponible</span>'
            : '<span class="badge badge-muted">Emprunté</span>'}
        </li>
    `).join('');
}

function ouvrirListeLivres() {
    livreSelectContainer.classList.add('open');
    livreSelectTrigger.setAttribute('aria-expanded', 'true');
}

function fermerListeLivres() {
    livreSelectContainer.classList.remove('open');
    livreSelectTrigger.setAttribute('aria-expanded', 'false');
}

livreSelectTrigger.addEventListener('click', () => {
    const estOuvert = livreSelectContainer.classList.contains('open');
    if (estOuvert) {
        fermerListeLivres();
    } else {
        ouvrirListeLivres();
    }
});

// ferme le selecteur si on clique en dehors, comme le panneau de palette
document.addEventListener('click', (e) => {
    if (!livreSelectContainer.contains(e.target)) {
        fermerListeLivres();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        fermerListeLivres();
    }
});

// selectionne un livre disponible dans la liste, ignore le clic sur un livre deja emprunté
livreSelectList.addEventListener('click', (e) => {
    const option = e.target.closest('.livre-select-option');
    if (!option || option.classList.contains('is-disabled')) return;

    livreSelectList.querySelectorAll('.livre-select-option').forEach((o) => o.classList.remove('is-selected'));
    option.classList.add('is-selected');
    livreSelectLabel.textContent = option.dataset.titre;
    livreIdInput.value = option.dataset.id;
    fermerListeLivres();
});

// remet le formulaire dans son etat initial apres un enregistrement reussi
function reinitialiserFormulaire() {
    form.reset();
    livreIdInput.value = '';
    livreSelectLabel.textContent = 'Sélectionner un livre';
    livreSelectList.querySelectorAll('.livre-select-option').forEach((o) => o.classList.remove('is-selected'));
    dateInput.min = dateDuJourLocale();
}

// charge les emprunts en cours, qui incluent deja le champ en_retard calcule par le backend
async function chargerEmprunts() {
    try {
        const emprunts = await api.get('/emprunts/en-cours');
        afficherEmprunts(emprunts);
    } catch (err) {
        showMessage(messageContainer, `Impossible de charger les emprunts : ${err.message}`);
    }
}

function afficherEmprunts(emprunts) {
    if (emprunts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Aucun emprunt en cours pour le moment.</td></tr>';
        return;
    }

    tbody.innerHTML = emprunts.map((emp) => `
        <tr>
        <td>${echapperHtml(emp.livre_titre)}</td>
        <td>${echapperHtml(emp.adherent_nom)}</td>
        <td>${formatDate(emp.date_emprunt)}</td>
        <td>${formatDate(emp.date_retour_prevue)}</td>
        <td class="text-center">
            ${emp.en_retard
            ? '<span class="badge badge-danger">En retard</span>'
            : '<span class="badge badge-success">En cours</span>'}
        </td>
        <td class="text-center">
            <button type="button" class="btn-success btn-small" data-retour="${emp.id}">Marquer comme rendu</button>
        </td>
        </tr>
    `).join('');
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessage(messageContainer);

    const adherentId = adherentSelect.value;
    const livreId = livreIdInput.value;
    const dateRetour = dateInput.value;

    if (!adherentId) {
        showMessage(messageContainer, "Merci de sélectionner un adhérent.");
        return;
    }
    if (!livreId) {
        showMessage(messageContainer, "Merci de sélectionner un livre disponible.");
        return;
    }
    if (!dateRetour) {
        showMessage(messageContainer, "Merci d'indiquer une date de retour prévue.");
        return;
    }
    if (dateRetour < dateDuJourLocale()) {
        showMessage(messageContainer, "La date de retour prévue ne peut pas être antérieure à aujourd'hui.");
        return;
    }

    const donnees = {
        adherent_id: Number(adherentId),
        livre_id: Number(livreId),
        date_retour_prevue: dateRetour,
    };

    try {
        await api.post('/emprunts', donnees);
        showMessage(messageContainer, 'Emprunt enregistré avec succès.', 'success');
        reinitialiserFormulaire();
        chargerEmprunts();
        chargerLivres();
    } catch (err) {
        showMessage(messageContainer, err.message);
    }
});

// delegation d'evenements sur le tableau pour gerer le retour d'un livre
tbody.addEventListener('click', async (e) => {
    const idRetour = e.target.dataset.retour;
    if (!idRetour) return;

    const confirmation = confirm('Marquer cet emprunt comme rendu ?');
    if (!confirmation) return;

    try {
        await api.put(`/emprunts/${idRetour}/retour`, {});
        showMessage(messageContainer, 'Retour enregistré avec succès.', 'success');
        chargerEmprunts();
        chargerLivres();
    } catch (err) {
        showMessage(messageContainer, err.message);
    }
});

chargerAdherents();
chargerLivres();
chargerEmprunts();