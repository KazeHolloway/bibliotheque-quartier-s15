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

// affiche un message d'erreur ou de succes dans le conteneur donne
function showMessage(container, text, type = 'error') {
  container.innerHTML = `<div class="message message-${type}">${text}</div>`;
}

// vide le conteneur de message
function clearMessage(container) {
  container.innerHTML = '';
}
