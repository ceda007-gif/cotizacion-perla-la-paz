/* Loads/saves the editable content model to Firestore, so edits are visible
   to every visitor (not just this browser). Public reads are open; writes
   are restricted to the signed-in admin by Firestore security rules (see
   firestore.rules). */

function pqDeepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function pqLoadContent() {
  var fallback = pqDeepClone(window.DEFAULT_CONTENT);
  return window.PQ_DB.collection('content').doc('site').get().then(function (doc) {
    if (!doc.exists) return fallback;
    var saved = doc.data() || {};
    return {
      es: Object.assign({}, fallback.es, saved.es),
      en: Object.assign({}, fallback.en, saved.en)
    };
  }).catch(function (e) {
    console.warn('No se pudo leer el contenido de Firestore, usando valores por defecto.', e);
    return fallback;
  });
}

function pqSaveContent(content) {
  return window.PQ_DB.collection('content').doc('site').set(content);
}

function pqLoadAssets() {
  var fallback = Object.assign({}, window.DEFAULT_ASSETS);
  return window.PQ_DB.collection('assets').doc('site').get().then(function (doc) {
    if (!doc.exists) return fallback;
    return Object.assign(fallback, doc.data() || {});
  }).catch(function (e) {
    console.warn('No se pudieron leer las imágenes de Firestore, usando valores por defecto.', e);
    return fallback;
  });
}

function pqSaveAssets(assets) {
  return window.PQ_DB.collection('assets').doc('site').set(assets);
}

function pqResetAll() {
  return Promise.all([
    window.PQ_DB.collection('content').doc('site').set(pqDeepClone(window.DEFAULT_CONTENT)),
    window.PQ_DB.collection('assets').doc('site').set(Object.assign({}, window.DEFAULT_ASSETS))
  ]);
}

window.PQStore = { load: pqLoadContent, save: pqSaveContent, loadAssets: pqLoadAssets, saveAssets: pqSaveAssets, reset: pqResetAll, clone: pqDeepClone };
