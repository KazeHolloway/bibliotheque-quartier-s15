const statsContainer = document.getElementById('stats');
const messageContainer = document.getElementById('message');

// recupere les statistiques et construit les cartes du tableau de bord
async function chargerStats() {
  try {
    const stats = await api.get('/stats');
    const livreTop = stats.livre_le_plus_emprunte;
    const adherentTop = stats.adherent_le_plus_actif;

    statsContainer.innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Livres au catalogue</div>
        <div class="stat-value">${stats.total_livres}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Auteurs enregistrés</div>
        <div class="stat-value">${stats.total_auteurs}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Adhérents inscrits</div>
        <div class="stat-value">${stats.total_adherents}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Emprunts en cours</div>
        <div class="stat-value">${stats.emprunts_en_cours}</div>
      </div>
      <div class="stat-card ${stats.emprunts_en_retard > 0 ? 'stat-alert' : ''}">
        <div class="stat-label">Emprunts en retard</div>
        <div class="stat-value">${stats.emprunts_en_retard}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Livre le plus emprunté</div>
        <div class="stat-value" style="font-size:1.2rem;">
          ${livreTop ? livreTop.titre : 'Aucun emprunt pour le moment'}
        </div>
        ${livreTop ? `<div class="stat-detail">${livreTop.nombre_emprunts} emprunt(s)</div>` : ''}
      </div>
      <div class="stat-card">
        <div class="stat-label">Adhérent le plus actif</div>
        <div class="stat-value" style="font-size:1.2rem;">
          ${adherentTop ? adherentTop.nom : 'Aucun emprunt pour le moment'}
        </div>
        ${adherentTop ? `<div class="stat-detail">${adherentTop.nombre_emprunts} emprunt(s)</div>` : ''}
      </div>
    `;
  } catch (err) {
    showMessage(messageContainer, `Impossible de charger les statistiques : ${err.message}`);
    statsContainer.innerHTML = '';
  }
}

chargerStats();
