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
}

// vide le conteneur de message et annule la disparition automatique en attente
function clearMessage(container) {
  clearTimeout(container.minuteurMessage);
  container.innerHTML = '';
}
