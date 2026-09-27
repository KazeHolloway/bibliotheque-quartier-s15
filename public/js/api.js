// toutes les pages consomment l'API via ces fonctions
// le frontend est servi par le meme serveur Express que l'API, donc une URL relative suffit
const API_BASE = '/api';

// fait un appel a l'API et renvoie le JSON, ou lance une erreur avec le message renvoye par le backend
async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  let body = null;
  const text = await response.text();
  if (text) {
    body = JSON.parse(text);
  }

  if (!response.ok) {
    const message = (body && body.error) || `Erreur ${response.status}`;
    throw new Error(message);
  }

  return body;
}

const api = {
  get: (path) => apiRequest(path),
  post: (path, data) => apiRequest(path, { method: 'POST', body: JSON.stringify(data) }),
  put: (path, data) => apiRequest(path, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (path) => apiRequest(path, { method: 'DELETE' }),
};

// neutralise les caractères spéciaux HTML d'une valeur avant de l'injecter via innerHTML
function echapperHtml(valeur) {
  return String(valeur ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// affiche un message d'erreur ou de succes, avec une croix de fermeture et une disparition automatique apres 10 secondes
function showMessage(container, text, type = 'error') {
  container.innerHTML = `
    <div class="message message-${type}">
      <span>${text}</span>
      <button type="button" class="message-close" aria-label="Fermer le message">&times;</button>
    </div>
  `;

  container.querySelector('.message-close').addEventListener('click', () => clearMessage(container));

  clearTimeout(container.minuteurMessage);
  container.minuteurMessage = setTimeout(() => clearMessage(container), 10000);

  // le message ne s'affiche pas forcément dans la partie visible de l'ecran (ex. bas d'une longue liste) :
  // un toast complementaire prend le relais dans ce cas, sans jamais faire doublon avec le message principal
  requestAnimationFrame(() => {
    const messageElement = container.querySelector('.message');
    if (messageElement && !estEntierementVisible(messageElement)) {
      afficherToast(text, type, container);
    }
  });
}

// vide le conteneur de message et annule la disparition automatique en attente
function clearMessage(container) {
  clearTimeout(container.minuteurMessage);
  container.innerHTML = '';
}

// determine si un element est entierement visible dans la fenetre, sans aucune partie coupee, meme d'un seul pixel
function estEntierementVisible(element) {
  const rect = element.getBoundingClientRect();
  const hauteurFenetre = window.innerHeight || document.documentElement.clientHeight;
  const largeurFenetre = window.innerWidth || document.documentElement.clientWidth;
  return rect.top >= 0 && rect.left >= 0 && rect.bottom <= hauteurFenetre && rect.right <= largeurFenetre;
}

// affiche une notification en bas d'ecran ; cliquer dessus fait remonter vers le message complet
function afficherToast(texte, type, containerMessagePrincipal) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.innerHTML = `
    <div class="toast-bulle toast-${type}" tabindex="0" role="button" aria-label="Voir le message complet en haut de la page">
      <svg class="toast-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 15l-6-6-6 6"></path>
      </svg>
      <span class="toast-texte">${texte}</span>
      <button type="button" class="toast-fermer" aria-label="Fermer la notification">&times;</button>
    </div>
  `;
  toast.classList.add('visible');

  const bulle = toast.querySelector('.toast-bulle');

  const allerVersLeMessage = () => {
    fermerToast();
    containerMessagePrincipal.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  bulle.addEventListener('click', (e) => {
    if (e.target.closest('.toast-fermer')) return;
    allerVersLeMessage();
  });

  bulle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      allerVersLeMessage();
    }
  });

  toast.querySelector('.toast-fermer').addEventListener('click', (e) => {
    e.stopPropagation();
    fermerToast();
  });

  clearTimeout(toast.minuteurToast);
  toast.minuteurToast = setTimeout(fermerToast, 10000);
}

// masque la notification en bas d'écran
function fermerToast() {
  const toast = document.getElementById('toast');
  if (!toast) return;
  clearTimeout(toast.minuteurToast);
  toast.classList.remove('visible');
  toast.innerHTML = '';
}