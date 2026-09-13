// liste des palettes disponibles, dans l'ordre d'affichage du panneau
const PALETTES = [
  { id: 'ruby', label: 'Rubis' },
  { id: 'sapphire', label: 'Saphir' },
  { id: 'emerald', label: 'Émeraude' },
  { id: 'gold', label: 'Or' },
  { id: 'silver', label: 'Argent' },
  { id: 'crystal', label: 'Cristal' },
];

// applique le mode et la palette memorises des le chargement, avant meme que le reste du script ne tourne
function appliquerThemeInitial() {
  const mode = localStorage.getItem('folio-mode') || 'dark';
  const palette = localStorage.getItem('folio-palette') || 'ruby';
  document.documentElement.setAttribute('data-mode', mode);
  document.documentElement.setAttribute('data-palette', palette);
}

appliquerThemeInitial();

// construit dynamiquement la liste des palettes dans le panneau lateral
function construirePanneauPalettes() {
  const liste = document.getElementById('palette-list');
  if (!liste) return;

  const paletteActuelle = document.documentElement.getAttribute('data-palette');

  liste.innerHTML = PALETTES.map((p) => `
    <li>
      <button class="palette-item ${p.id === paletteActuelle ? 'active' : ''}" data-palette="${p.id}">
        <span class="palette-dot" data-palette="${p.id}"></span>${p.label}
      </button>
    </li>
  `).join('');

  liste.querySelectorAll('.palette-item').forEach((bouton) => {
    bouton.addEventListener('click', () => {
      const palette = bouton.dataset.palette;
      document.documentElement.setAttribute('data-palette', palette);
      localStorage.setItem('folio-palette', palette);
      liste.querySelectorAll('.palette-item').forEach((b) => b.classList.remove('active'));
      bouton.classList.add('active');
    });
  });
}

// bascule le mode clair et sombre, avec sauvegarde du choix
function initModeToggle() {
  const bouton = document.getElementById('mode-toggle');
  if (!bouton) return;

  bouton.addEventListener('click', () => {
    const modeActuel = document.documentElement.getAttribute('data-mode');
    const nouveauMode = modeActuel === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-mode', nouveauMode);
    localStorage.setItem('folio-mode', nouveauMode);
  });
}

// ouvre et ferme le panneau de selection de palette, avec fermeture au clic sur l'exterieur
function initPaletteToggle() {
  const bouton = document.getElementById('palette-toggle');
  const panneau = document.getElementById('palette-panel');
  const overlay = document.getElementById('overlay');
  if (!bouton || !panneau) return;

  const fermer = () => {
    panneau.classList.remove('open');
    overlay.classList.remove('visible');
    bouton.setAttribute('aria-expanded', 'false');
  };

  bouton.addEventListener('click', () => {
    const estOuvert = panneau.classList.contains('open');
    if (estOuvert) {
      fermer();
    } else {
      panneau.classList.add('open');
      overlay.classList.add('visible');
      bouton.setAttribute('aria-expanded', 'true');
    }
  });

  overlay.addEventListener('click', fermer);
}

// masque ou affiche la sidebar via le bouton hamburger, utile surtout sur mobile
function initHamburger() {
  const bouton = document.getElementById('hamburger');
  if (!bouton) return;

  bouton.addEventListener('click', () => {
    document.body.classList.toggle('sidebar-collapsed');
  });
}

// affiche le bouton remonter en haut apres un certain defilement, et le fait fonctionner
function initScrollTop() {
  const bouton = document.getElementById('scroll-top');
  if (!bouton) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      bouton.classList.add('visible');
    } else {
      bouton.classList.remove('visible');
    }
  });

  bouton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  construirePanneauPalettes();
  initModeToggle();
  initPaletteToggle();
  initHamburger();
  initScrollTop();
});
