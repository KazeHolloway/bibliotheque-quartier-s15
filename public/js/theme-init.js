// applique tout de suite le theme memorise, avant meme l'affichage de la page, pour eviter un flash de mauvaise couleur
(function () {
  var mode = localStorage.getItem('folio-mode') || 'dark';
  var palette = localStorage.getItem('folio-palette') || 'ruby';
  document.documentElement.setAttribute('data-mode', mode);
  document.documentElement.setAttribute('data-palette', palette);
})();
