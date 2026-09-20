// annee la plus ancienne acceptee pour une publication, calee sur l'invention de l'imprimerie
const ANNEE_MIN_PUBLICATION = 1450;
const anneeActuelle = new Date().getFullYear();

const messageContainer = document.getElementById('message');
const tbody = document.getElementById('livres-tbody');
const paginationContainer = document.getElementById('pagination');
const form = document.getElementById('livre-form');
const selectAuteur = document.getElementById('auteur_id');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const searchInput = document.getElementById('search-input');
const sortAnneeSelect = document.getElementById('sort-annee');
const sortDispoCheckbox = document.getElementById('sort-dispo');
const filtreDispoSelect = document.getElementById('filtre-disponibilite');
const filtreAuteurSelect = document.getElementById('filtre-auteur');
const resetSortBtn = document.getElementById('reset-sort-btn');
const anneeHint = document.getElementById('annee-hint');

anneeHint.textContent = `Entre ${ANNEE_MIN_PUBLICATION} et ${anneeActuelle}`;

let pageActuelle = 1;
const limiteParPage = 8;
let rechercheActuelle = '';
let idEnEdition = null;
let delaiRecherche = null;

// remplit le menu deroulant des auteurs disponibles pour le formulaire
async function chargerAuteurs() {
  try {
    const auteurs = await api.get('/auteurs');
    const optionsAuteurs = auteurs
      .map((a) => `<option value="${a.id}">${echapperHtml(a.nom)}</option>`)
      .join('');
    selectAuteur.innerHTML = `<option value="">Sélectionner un auteur</option>${optionsAuteurs}`;
    filtreAuteurSelect.innerHTML = `<option value="">Tous les auteurs</option>${optionsAuteurs}`;
  } catch (err) {
    showMessage(messageContainer, `Impossible de charger les auteurs : ${err.message}`);
  }
}

// construit une ligne de tableau pour un livre donne
function construireLigne(livre) {
  const statutBadge = livre.disponible
    ? '<span class="badge badge-success">Disponible</span>'
    : '<span class="badge badge-muted">Emprunté</span>';

  return `
    <tr>
      <td>${echapperHtml(livre.titre)}</td>
      <td>${echapperHtml(livre.auteur_nom)}</td>
      <td>${livre.annee_publication ?? '—'}</td>
      <td class="text-center">${statutBadge}</td>
      <td class="text-center">
        <button class="btn-outline btn-small" data-action="modifier" data-id="${livre.id}">Modifier</button>
        <button class="btn-danger btn-small" data-action="supprimer" data-id="${livre.id}">Supprimer</button>
      </td>
    </tr>
  `;
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
    chargerLivres();
  });

  document.getElementById('page-suivante')?.addEventListener('click', () => {
    pageActuelle += 1;
    chargerLivres();
  });
}

// recupere la liste des livres depuis l'API en tenant compte de la recherche, du tri et de la page en cours
async function chargerLivres() {
  try {
    const params = new URLSearchParams({ page: pageActuelle, limit: limiteParPage });
    if (rechercheActuelle) params.set('q', rechercheActuelle);
    if (sortAnneeSelect.value) params.set('sort', sortAnneeSelect.value);
    if (sortDispoCheckbox.checked) params.set('dispo_first', 'true');
    if (filtreDispoSelect.value) params.set('disponible', filtreDispoSelect.value);
    if (filtreAuteurSelect.value) params.set('auteur_id', filtreAuteurSelect.value);

    const resultat = await api.get(`/livres?${params.toString()}`);

    if (resultat.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5"><p class="empty-state">Aucun livre trouvé.</p></td></tr>';
    } else {
      tbody.innerHTML = resultat.data.map(construireLigne).join('');
    }

    construirePagination(resultat.pagination);
  } catch (err) {
    showMessage(messageContainer, `Impossible de charger les livres : ${err.message}`);
  }
}

// remet le formulaire en mode ajout apres une creation ou une annulation
function reinitialiserFormulaire() {
  form.reset();
  idEnEdition = null;
  formTitle.textContent = 'Ajouter un livre';
  submitBtn.textContent = 'Ajouter le livre';
  cancelEditBtn.hidden = true;
}

// remplit le formulaire avec les valeurs d'un livre existant pour le modifier
async function passerEnModeEdition(id) {
  try {
    const livre = await api.get(`/livres/${id}`);
    document.getElementById('titre').value = livre.titre;
    document.getElementById('auteur_id').value = livre.auteur_id;
    document.getElementById('annee_publication').value = livre.annee_publication ?? '';

    idEnEdition = id;
    formTitle.textContent = 'Modifier le livre';
    submitBtn.textContent = 'Enregistrer les modifications';
    cancelEditBtn.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    showMessage(messageContainer, `Impossible de charger ce livre : ${err.message}`);
  }
}

// supprime un livre apres confirmation de l'utilisateur
async function supprimerLivre(id) {
  const confirmation = confirm('Supprimer ce livre ? Cette action est irréversible.');
  if (!confirmation) return;

  try {
    await api.delete(`/livres/${id}`);
    showMessage(messageContainer, 'Livre supprimé avec succès.', 'success');
    chargerLivres();
  } catch (err) {
    const messageAffiche = err.message.includes('référencée ailleurs')
      ? 'Suppression impossible : ce livre est référencé dans un emprunt.'
      : `Suppression impossible : ${err.message}`;
    showMessage(messageContainer, messageAffiche);
  }
}

// verifie que l'annee saisie est plausible avant d'envoyer le formulaire, message personnalise sinon
function anneeEstValide(annee) {
  if (annee === null) return true;

  if (annee < ANNEE_MIN_PUBLICATION) {
    showMessage(
      messageContainer,
      `L'année de publication doit être ${ANNEE_MIN_PUBLICATION} ou plus tard (l'imprimerie n'existait pas avant).`
    );
    return false;
  }

  if (annee > anneeActuelle) {
    showMessage(
      messageContainer,
      `L'année de publication ne peut pas dépasser l'année en cours (${anneeActuelle}).`
    );
    return false;
  }

  return true;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessage(messageContainer);

  const valeurAnnee = document.getElementById('annee_publication').value;
  const annee = valeurAnnee ? Number(valeurAnnee) : null;

  if (!anneeEstValide(annee)) return;

  const donnees = {
    titre: document.getElementById('titre').value.trim(),
    auteur_id: Number(document.getElementById('auteur_id').value),
    annee_publication: annee,
  };

  try {
    if (idEnEdition) {
      await api.put(`/livres/${idEnEdition}`, donnees);
      showMessage(messageContainer, 'Livre modifié avec succès.', 'success');
    } else {
      await api.post('/livres', donnees);
      showMessage(messageContainer, 'Livre ajouté avec succès.', 'success');
    }

    reinitialiserFormulaire();
    chargerLivres();
  } catch (err) {
    showMessage(messageContainer, err.message);
  }
});

cancelEditBtn.addEventListener('click', reinitialiserFormulaire);

// delegation d'evenements sur le tableau pour gerer les clics modifier et supprimer
tbody.addEventListener('click', (e) => {
  const bouton = e.target.closest('button');
  if (!bouton) return;

  const id = bouton.dataset.id;
  if (bouton.dataset.action === 'modifier') passerEnModeEdition(id);
  if (bouton.dataset.action === 'supprimer') supprimerLivre(id);
});

// relance la recherche apres une courte pause, pour eviter une requete a chaque frappe
searchInput.addEventListener('input', () => {
  clearTimeout(delaiRecherche);
  delaiRecherche = setTimeout(() => {
    rechercheActuelle = searchInput.value.trim();
    pageActuelle = 1;
    chargerLivres();
  }, 350);
});

// change de tri : on revient a la page 1 pour eviter une page vide incoherente
sortAnneeSelect.addEventListener('change', () => {
  pageActuelle = 1;
  chargerLivres();
});

sortDispoCheckbox.addEventListener('change', () => {
  pageActuelle = 1;
  chargerLivres();
});

filtreDispoSelect.addEventListener('change', () => {
  pageActuelle = 1;
  chargerLivres();
});

filtreAuteurSelect.addEventListener('change', () => {
  pageActuelle = 1;
  chargerLivres();
});

resetSortBtn.addEventListener('click', () => {
  searchInput.value = '';
  rechercheActuelle = '';
  sortAnneeSelect.value = '';
  sortDispoCheckbox.checked = false;
  filtreDispoSelect.value = '';
  filtreAuteurSelect.value = '';
  pageActuelle = 1;
  chargerLivres();
});

chargerAuteurs();
chargerLivres();