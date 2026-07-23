(function () {
  var state = {
    locale: localStorage.getItem('perla_quote_locale') || 'es',
    open: new Set(),
    content: window.PQStore.clone(window.DEFAULT_CONTENT),
    assets: Object.assign({}, window.DEFAULT_ASSETS)
  };

  var root = document.getElementById('pq-root');

  function render() {
    var c = state.content[state.locale];
    root.innerHTML = window.PQRender.renderQuotePage(c, state.assets, state.open);
    document.documentElement.lang = state.locale;
    updateLocaleButtons();
  }

  function updateLocaleButtons() {
    document.querySelectorAll('.pq-locale-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.locale === state.locale);
    });
  }

  root.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-toggle]');
    if (!btn) return;
    var key = btn.dataset.toggle;
    if (state.open.has(key)) state.open.delete(key);
    else state.open.add(key);
    render();
  });

  document.querySelectorAll('.pq-locale-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.locale = btn.dataset.locale;
      localStorage.setItem('perla_quote_locale', state.locale);
      render();
    });
  });

  // Paint immediately with defaults, then swap in the live Firestore
  // content/assets as soon as they arrive (usually well under a second).
  render();
  Promise.all([window.PQStore.load(), window.PQStore.loadAssets()]).then(function (results) {
    state.content = results[0];
    state.assets = results[1];
    render();
  }).catch(function (e) {
    console.error('Hotel Perla: no se pudo cargar el contenido en vivo, mostrando valores por defecto.', e);
  });
})();
