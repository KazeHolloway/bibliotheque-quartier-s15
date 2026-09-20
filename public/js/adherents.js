// gestion complete de la page adherents : chargement, ajout, modification, suppression, historique
const messageContainer = document.getElementById('message');
const tbody = document.getElementById('adherents-tbody');
const form = document.getElementById('adherent-form');

const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-edit-btn');

const nomInput = document.getElementById('nom');
const contactInput = document.getElementById('contact');
const modalOverlay = document.getElementById('modal-overlay');

const modal = document.getElementById('historique-modal');
const modalBody = document.getElementById('modal-body');
const modalCloseBtn = document.getElementById('modal-close');

let idEnEdition = null;

// formats acceptes pour le champ contact : email valide, ou numero de telephone simple
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_TELEPHONE = /^[0-9+\-\s]{6,20}$/;

// convertit une date au format YYYY-MM-DD renvoyee par l'API en affichage JJ/MM/AAAA
function formatDate(chaineDate) {
    if (!chaineDate) return '';
    const [annee, mois, jour] = chaineDate.split('-');
    return `${jour}/${mois}/${annee}`;
}

// charge la liste complete des adherents, pas de pagination ni de recherche demandee pour cette ressource
async function chargerAdherents() {
    try {
        const adherents = await api.get('/adherents');
        afficherAdherents(adherents);
    } catch (err) {
        showMessage(messageContainer, `Impossible de charger les adhérents : ${err.message}`);
    }
}

function afficherAdherents(adherents) {
    if (adherents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="empty-state">Aucun adhérent enregistré pour le moment.</td></tr>';
        return;
    }

    tbody.innerHTML = adherents.map((adherent) => `
        <tr>
        <td>${echapperHtml(adherent.nom)}</td>
        <td>${echapperHtml(adherent.contact)}</td>
        <td class="text-center">
            <button type="button" class="btn-secondary btn-small" data-historique="${adherent.id}" data-nom="${echapperHtml(adherent.nom)}">Historique</button>
            <button type="button" class="btn-outline btn-small" data-modifier="${adherent.id}">Modifier</button>
            <button type="button" class="btn-danger btn-small" data-supprimer="${adherent.id}">Supprimer</button>
        </td>
        </tr>
    `).join('');
}

// remet le formulaire dans son etat initial d'ajout
function reinitialiserFormulaire() {
    idEnEdition = null;
    form.reset();
    formTitle.textContent = 'Ajouter un adhérent';
    submitBtn.textContent = "Ajouter l'adhérent";
    cancelBtn.hidden = true;
}

// recharge un adherent precis et passe le formulaire en mode edition
async function passerEnModeEdition(id) {
    try {
        const adherent = await api.get(`/adherents/${id}`);
        idEnEdition = id;
        nomInput.value = adherent.nom;
        contactInput.value = adherent.contact;
        formTitle.textContent = "Modifier l'adhérent";
        submitBtn.textContent = 'Enregistrer les modifications';
        cancelBtn.hidden = false;
        nomInput.focus();
    } catch (err) {
        showMessage(messageContainer, `Impossible de charger cet adhérent : ${err.message}`);
    } 
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessage(messageContainer);

    const nom = nomInput.value.trim();
    const contact = contactInput.value.trim();

    if (!nom || !contact) {
        showMessage(messageContainer, 'Le nom et le contact sont obligatoires.');
        return;
    }

    // le contact doit ressembler a un email ou a un numero de telephone, jamais laisse libre
    if (!REGEX_EMAIL.test(contact) && !REGEX_TELEPHONE.test(contact)) {
        showMessage(messageContainer, 'Le contact doit être un email valide (ex. nom@domaine.com) ou un numéro de téléphone (6 à 20 chiffres, espaces, tirets ou + acceptés).');
        return;
    }

    const donnees = { nom, contact };

    try {
        if (idEnEdition) {
        await api.put(`/adherents/${idEnEdition}`, donnees);
        showMessage(messageContainer, 'Adhérent modifié avec succès.', 'success');
        } else {
        await api.post('/adherents', donnees);
        showMessage(messageContainer, 'Adhérent ajouté avec succès.', 'success');
        }
        reinitialiserFormulaire();
        chargerAdherents();
    } catch (err) {
        showMessage(messageContainer, err.message);
    }
});

cancelBtn.addEventListener('click', reinitialiserFormulaire);

// construit le badge de statut d'un emprunt de l'historique
function construireBadgeHistorique(item) {
    if (item.en_cours && item.en_retard) {
        return '<span class="badge badge-danger">En retard</span>';
    }
    if (item.en_cours) {
        return '<span class="badge badge-success">En cours</span>';
    }
    if (item.ecart_jours > 0) {
        return '<span class="badge badge-warning">Rendu en retard</span>';
    }
    return '<span class="badge badge-info">Rendu à temps</span>';
}

// transforme un nombre de jours en durée lisible (mois de 30 jours, semaines, jours), ex. "1 mois, 2 semaines et 3 jours"
function formaterDuree(nombreJours) {
    const mois = Math.floor(nombreJours / 30);
    const semaines = Math.floor((nombreJours % 30) / 7);
    const jours = (nombreJours % 30) % 7;

    const morceaux = [];
    if (mois > 0) morceaux.push(`${mois} mois`);
    if (semaines > 0) morceaux.push(`${semaines} ${semaines > 1 ? 'semaines' : 'semaine'}`);
    if (jours > 0) morceaux.push(`${jours} ${jours > 1 ? 'jours' : 'jour'}`);

    if (morceaux.length <= 1) return morceaux.join('');
    return `${morceaux.slice(0, -1).join(', ')} et ${morceaux[morceaux.length - 1]}`;
}

// décrit la date de rendu et l'écart avec la date prévue, uniquement pour un emprunt déjà rendu
function construireDetailRendu(item) {
    if (item.en_cours) return '';

    let ecart = 'à la date prévue';
    if (item.ecart_jours < 0) ecart = `${formaterDuree(-item.ecart_jours)} en avance`;
    if (item.ecart_jours > 0) ecart = `${formaterDuree(item.ecart_jours)} en retard`;

    return `<div class="historique-item-dates text-muted">Rendu le ${formatDate(item.date_retour_effective)}, ${ecart}</div>`;
}

// compte les livres déjà rendus dans les temps et hors délai, pour le bilan affiché en bas de la modale
function construireBilanRetours(historique) {
    const rendus = historique.filter((item) => !item.en_cours);
    const rendusATemps = rendus.filter((item) => item.ecart_jours <= 0).length;
    const rendusEnRetard = rendus.length - rendusATemps;

    return `
        <div class="historique-bilan">
            <div class="historique-bilan-ligne">
                <span>Livres rendus dans les temps :</span>
                <span class="badge badge-info">${rendusATemps}</span>
            </div>
            <div class="historique-bilan-ligne">
                <span>Livres rendus hors délai :</span>
                <span class="badge badge-warning">${rendusEnRetard}</span>
            </div>
        </div>
    `;
}

// ouvre la modale et charge l'historique des emprunts de l'adherent concerne
async function ouvrirHistorique(id, nom) {
    document.getElementById('modal-title').textContent = `Historique des emprunts : ${nom}`;
    modalBody.innerHTML = '<p class="text-muted">Chargement de l\'historique...</p>';

    modalOverlay.classList.add('visible');
    modal.classList.add('visible');
    modal.setAttribute('aria-hidden', 'false');

    try {
        const historique = await api.get(`/adherents/${id}/emprunts`);

        if (historique.length === 0) {
        modalBody.innerHTML = '<p class="empty-state">Aucun emprunt enregistré pour cet adhérent.</p>';
        return;
        }

        const listeHtml = historique.map((item) => `
        <div class="historique-item">
            <div>
            <div class="historique-item-titre">${echapperHtml(item.livre_titre)}</div>
            <div class="historique-item-dates text-muted">
                Emprunté le ${formatDate(item.date_emprunt)}, retour prévu le ${formatDate(item.date_retour_prevue)}
            </div>
            ${construireDetailRendu(item)}
            </div>
            ${construireBadgeHistorique(item)}
        </div>
        `).join('');

        modalBody.innerHTML = listeHtml + construireBilanRetours(historique);
    } catch (err) {
        modalBody.innerHTML = `<p class="empty-state">Impossible de charger l'historique : ${err.message}</p>`;
    }
}

// ferme la modale d'historique
function fermerModale() {
    modalOverlay.classList.remove('visible');
    modal.classList.remove('visible');
    modal.setAttribute('aria-hidden', 'true');
}

modalCloseBtn.addEventListener('click', fermerModale);
modalOverlay.addEventListener('click', fermerModale);

// ferme la modale avec la touche echap, seulement si elle est actuellement ouverte
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('visible')) {
        fermerModale();
    }
});

// delegation d'evenements sur le tableau pour gerer historique, modification et suppression sans reattacher a chaque rendu
tbody.addEventListener('click', async (e) => {
    const idHistorique = e.target.dataset.historique;
    const idModifier = e.target.dataset.modifier;
    const idSupprimer = e.target.dataset.supprimer;

    if (idHistorique) {
        ouvrirHistorique(idHistorique, e.target.dataset.nom);
    }

    if (idModifier) {
        passerEnModeEdition(idModifier);
    }

    if (idSupprimer) {
        const confirmation = confirm('Supprimer cet adhérent ? Cette action est irréversible.');
        if (!confirmation) return;

        try {
            await api.delete(`/adherents/${idSupprimer}`);
            showMessage(messageContainer, 'Adhérent supprimé avec succès.', 'success');
            chargerAdherents();
        } catch (err) {
            const messageAffiche = err.message.includes('référencée ailleurs')
                ? "Impossible d'effectuer cette action : cet adhérent est référencé ailleurs (ex. un livre, un emprunt)."
                : err.message;
            showMessage(messageContainer, messageAffiche);
        }
    }
});

chargerAdherents();