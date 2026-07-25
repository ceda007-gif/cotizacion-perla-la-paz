(function () {
  var SITE_BASE = 'https://ceda007-gif.github.io/cotizacion-perla-la-paz/';

  var loginWrap = document.getElementById('admin-login-wrap');
  var dashWrap = document.getElementById('admin-dash-wrap');
  var loginForm = document.getElementById('admin-login-form');
  var loginPw = document.getElementById('admin-login-pw');
  var loginError = document.getElementById('admin-login-error');
  var toastEl = document.getElementById('admin-toast');
  var dirtyEl = document.getElementById('admin-dirty');
  var mainEl = document.getElementById('admin-main');

  var dirty = false;

  function toast(msg, isError) {
    toastEl.textContent = msg;
    toastEl.className = 'admin-toast show' + (isError ? ' error' : '');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toastEl.classList.remove('show'); }, 2800);
  }

  function markDirty() {
    dirty = true;
    dirtyEl.textContent = 'Cambios sin guardar (sin publicar)';
  }
  function markClean() {
    dirty = false;
    dirtyEl.textContent = '';
  }

  // ---------- auth (real Firebase Authentication) ----------
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var submitBtn = loginForm.querySelector('button[type=submit]');
    submitBtn.disabled = true;
    window.PQ_AUTH.signInWithEmailAndPassword(window.PQ_ADMIN_EMAIL, loginPw.value)
      .then(function () {
        loginPw.value = '';
        loginError.textContent = '';
      })
      .catch(function () {
        loginError.textContent = 'Contraseña incorrecta.';
      })
      .finally(function () { submitBtn.disabled = false; });
  });

  document.getElementById('admin-logout').addEventListener('click', function () {
    window.PQ_AUTH.signOut();
  });

  window.PQ_AUTH.onAuthStateChanged(function (user) {
    if (user) {
      showDashboard();
    } else {
      state = null;
      loginWrap.style.display = '';
      dashWrap.style.display = 'none';
    }
  });

  // ---------- state ----------
  var state = null;
  var activeTab = 'es';

  function showDashboard() {
    loginWrap.style.display = 'none';
    dashWrap.style.display = '';
    mainEl.innerHTML = '<p style="padding:24px 4px;color:#8C7C68;">Cargando contenido…</p>';
    Promise.all([window.PQStore.load(), window.PQStore.loadAssets()]).then(function (results) {
      state = { content: results[0], assets: results[1] };
      renderTab();
      updateCopyBtn();
    }).catch(function (e) {
      console.error(e);
      mainEl.innerHTML = '<p style="padding:24px 4px;color:#B23A2E;">No se pudo cargar el contenido. Revisa la consola.</p>';
    });
  }

  document.querySelectorAll('.admin-tab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      activeTab = btn.dataset.tab;
      document.querySelectorAll('.admin-tab').forEach(function (b) { b.classList.toggle('active', b === btn); });
      renderTab();
      updateCopyBtn();
    });
  });

  function renderTab() {
    if (!state) return;
    mainEl.innerHTML = '';
    if (activeTab === 'images') renderImagesTab();
    else renderLocaleTab(activeTab);
  }

  // ---------- Copy ES <-> EN ----------
  var LOCALE_NAMES = { es: 'Español', en: 'English' };
  var copyBtn = document.getElementById('admin-copy-locale');

  function updateCopyBtn() {
    if (activeTab === 'images') {
      copyBtn.style.display = 'none';
      return;
    }
    copyBtn.style.display = '';
    var target = activeTab === 'es' ? 'en' : 'es';
    copyBtn.textContent = 'Copiar a ' + LOCALE_NAMES[target];
  }

  copyBtn.addEventListener('click', function () {
    if (activeTab === 'images') return;
    var source = activeTab;
    var target = source === 'es' ? 'en' : 'es';
    if (!confirm('¿Copiar todo el contenido de ' + LOCALE_NAMES[source] + ' a ' + LOCALE_NAMES[target] + '? Se reemplaza todo lo que hay ahora en ' + LOCALE_NAMES[target] + ' (precios, fechas, textos). No se publica hasta que le des "Guardar cambios".')) return;
    state.content[target] = window.PQStore.clone(state.content[source]);
    markDirty();
    toast('Copiado de ' + LOCALE_NAMES[source] + ' a ' + LOCALE_NAMES[target] + '. Revisa los textos que necesiten traducirse y luego guarda.');
  });

  // ---------- DOM helpers ----------
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /**
   * Collapsible section, matching the public site's accordion look.
   * opts: { startOpen, enabled: {value, onChange} }
   * Returns the body container — append fields into it as before.
   */
  function section(title, opts) {
    opts = opts || {};
    var s = el('section', 'admin-section');
    var header = el('div', 'admin-section-header');

    if (opts.enabled) {
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'admin-section-visible-toggle';
      cb.title = 'Mostrar esta sección en el sitio';
      cb.checked = opts.enabled.value !== false;
      cb.addEventListener('click', function (e) { e.stopPropagation(); });
      cb.addEventListener('change', function () { opts.enabled.onChange(cb.checked); markDirty(); });
      header.appendChild(cb);
    }

    var titleEl = el('span', 'admin-section-title', title);
    header.appendChild(titleEl);
    var icon = el('span', 'admin-section-icon', '+');
    header.appendChild(icon);
    s.appendChild(header);

    var body = el('div', 'admin-section-body');
    s.appendChild(body);

    var open = !!opts.startOpen;
    function sync() {
      body.style.display = open ? '' : 'none';
      icon.classList.toggle('open', open);
    }
    sync();
    header.addEventListener('click', function () {
      open = !open;
      sync();
    });

    mainEl.appendChild(s);
    return body;
  }

  function inputRow(container, label, value, onChange, opts) {
    opts = opts || {};
    var wrap = el('div', 'admin-field');
    wrap.appendChild(el('label', null, label));
    var input;
    if (opts.textarea) { input = document.createElement('textarea'); input.rows = opts.rows || 3; }
    else { input = document.createElement('input'); input.type = 'text'; }
    input.value = value || '';
    input.addEventListener('input', function () { onChange(input.value); markDirty(); });
    wrap.appendChild(input);
    container.appendChild(wrap);
    return wrap;
  }

  function linesRow(container, label, arr, onChange) {
    return inputRow(container, label + ' (una por línea)', arr.join('\n'), function (val) {
      onChange(val.split('\n').filter(function (s) { return s.trim().length > 0; }));
    }, { textarea: true, rows: Math.min(Math.max(arr.length, 3), 12) });
  }

  /**
   * Generic editable list of objects with add/remove/reorder.
   * fieldsSpec: [{key, label, type:'text'|'textarea'|'lines'|'select', options?}]
   */
  function objectListField(container, arr, fieldsSpec, newItemFactory) {
    var listWrap = el('div', 'admin-list');
    container.appendChild(listWrap);

    function renderItems() {
      listWrap.innerHTML = '';
      arr.forEach(function (item, idx) {
        var card = el('div', 'admin-list-item');
        fieldsSpec.forEach(function (f) {
          if (f.type === 'lines') {
            linesRow(card, f.label, item[f.key] || [], function (newArr) { item[f.key] = newArr; });
          } else if (f.type === 'select') {
            var wrap = el('div', 'admin-field');
            wrap.appendChild(el('label', null, f.label));
            var select = document.createElement('select');
            f.options().forEach(function (opt) {
              var o = document.createElement('option');
              o.value = opt.value; o.textContent = opt.label;
              if (opt.value === item[f.key]) o.selected = true;
              select.appendChild(o);
            });
            select.addEventListener('change', function () { item[f.key] = select.value; markDirty(); });
            wrap.appendChild(select);
            card.appendChild(wrap);
          } else {
            inputRow(card, f.label, item[f.key], function (val) { item[f.key] = val; }, { textarea: f.type === 'textarea' });
          }
        });
        var actions = el('div', 'admin-list-actions');
        var upBtn = el('button', 'btn-small', '↑'); upBtn.type = 'button'; upBtn.disabled = idx === 0;
        upBtn.addEventListener('click', function () { var t = arr[idx - 1]; arr[idx - 1] = arr[idx]; arr[idx] = t; markDirty(); renderItems(); });
        var downBtn = el('button', 'btn-small', '↓'); downBtn.type = 'button'; downBtn.disabled = idx === arr.length - 1;
        downBtn.addEventListener('click', function () { var t = arr[idx + 1]; arr[idx + 1] = arr[idx]; arr[idx] = t; markDirty(); renderItems(); });
        var delBtn = el('button', 'btn-small btn-danger', 'Eliminar'); delBtn.type = 'button';
        delBtn.addEventListener('click', function () { arr.splice(idx, 1); markDirty(); renderItems(); });
        actions.appendChild(upBtn); actions.appendChild(downBtn); actions.appendChild(delBtn);
        card.appendChild(actions);
        listWrap.appendChild(card);
      });
    }
    renderItems();
    var addBtn = el('button', 'btn-small btn-add', '+ Agregar'); addBtn.type = 'button';
    addBtn.addEventListener('click', function () { arr.push(newItemFactory()); markDirty(); renderItems(); });
    container.appendChild(addBtn);
  }

  /**
   * Spreadsheet-style editable table: paste a range of cells copied from
   * Excel/Sheets starting at any cell and it fills rows/columns from there,
   * creating new rows as needed.
   * columns: [{key, label, type:'text'|'textarea'|'select'|'checkbox', options?}]
   */
  function editableTable(container, arr, columns, newRowFactory) {
    var wrap = el('div', 'admin-table-wrap');
    container.appendChild(wrap);

    function handlePaste(e, startRow, startCol) {
      var text = (e.clipboardData || window.clipboardData).getData('text');
      if (!text || (text.indexOf('\t') === -1 && text.indexOf('\n') === -1)) return; // plain single value: let default paste happen
      e.preventDefault();
      var rows = text.replace(/\r/g, '').split('\n');
      if (rows.length && rows[rows.length - 1] === '') rows.pop();
      rows.forEach(function (rowText, rOffset) {
        var cells = rowText.split('\t');
        var targetRow = startRow + rOffset;
        while (arr.length <= targetRow) arr.push(newRowFactory());
        cells.forEach(function (val, cOffset) {
          var targetCol = startCol + cOffset;
          if (targetCol < columns.length && columns[targetCol].type !== 'select' && columns[targetCol].type !== 'checkbox') {
            arr[targetRow][columns[targetCol].key] = val;
          }
        });
      });
      markDirty();
      render();
    }

    function render() {
      wrap.innerHTML = '';
      var table = document.createElement('table');
      table.className = 'admin-table';
      var thead = document.createElement('thead');
      var headRow = document.createElement('tr');
      columns.forEach(function (col) {
        var th = document.createElement('th');
        th.textContent = col.label;
        headRow.appendChild(th);
      });
      headRow.appendChild(document.createElement('th'));
      thead.appendChild(headRow);
      table.appendChild(thead);

      var tbody = document.createElement('tbody');
      arr.forEach(function (row, rowIdx) {
        var tr = document.createElement('tr');
        columns.forEach(function (col, colIdx) {
          var td = document.createElement('td');
          var input;
          if (col.type === 'checkbox') {
            td.className = 'admin-table-checkbox-cell';
            input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = row[col.key] !== false;
            input.addEventListener('change', function () { row[col.key] = input.checked; markDirty(); });
          } else if (col.type === 'select') {
            input = document.createElement('select');
            col.options().forEach(function (opt) {
              var o = document.createElement('option');
              o.value = opt.value; o.textContent = opt.label;
              if (opt.value === row[col.key]) o.selected = true;
              input.appendChild(o);
            });
            input.addEventListener('change', function () { row[col.key] = input.value; markDirty(); });
          } else if (col.type === 'textarea') {
            input = document.createElement('textarea');
            input.rows = 2;
            input.value = row[col.key] || '';
            input.addEventListener('input', function () { row[col.key] = input.value; markDirty(); });
            input.addEventListener('paste', function (e) { handlePaste(e, rowIdx, colIdx); });
          } else {
            input = document.createElement('input');
            input.type = 'text';
            input.value = row[col.key] || '';
            input.addEventListener('input', function () { row[col.key] = input.value; markDirty(); });
            input.addEventListener('paste', function (e) { handlePaste(e, rowIdx, colIdx); });
          }
          td.appendChild(input);
          tr.appendChild(td);
        });
        var tdAction = document.createElement('td');
        tdAction.className = 'admin-table-actions';
        var delBtn = document.createElement('button');
        delBtn.type = 'button'; delBtn.className = 'btn-small btn-danger'; delBtn.textContent = '✕';
        delBtn.title = 'Eliminar fila';
        delBtn.addEventListener('click', function () { arr.splice(rowIdx, 1); markDirty(); render(); });
        tdAction.appendChild(delBtn);
        tr.appendChild(tdAction);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      wrap.appendChild(table);
    }

    render();

    var hint = el('p', null, 'Puedes copiar un rango de celdas desde Excel o Google Sheets y pegarlo en cualquier celda: se llenan filas y columnas automáticamente, agregando filas si hacen falta.');
    hint.style.cssText = 'font-size:12px;color:#8C7C68;margin:2px 0 10px;';
    container.appendChild(hint);

    var addBtn = el('button', 'btn-small btn-add', '+ Agregar fila');
    addBtn.type = 'button';
    addBtn.addEventListener('click', function () { arr.push(newRowFactory()); markDirty(); render(); });
    container.appendChild(addBtn);
  }

  // ---------- Images tab ----------
  var ASSET_LABELS = {
    hero: 'Foto principal (hero)', logo: 'Logo del hotel',
    roomDouble: 'Habitación doble', roomKing: 'Habitación king con terraza',
    courtyard: 'Patio interior', lobby: 'Lobby', pool: 'Alberca',
    beach1: 'Tour 1 (malecón)', beach2: 'Tour 2 (dunas)', beach3: 'Tour 3 (isla)',
    exteriorBuilding: 'Fachada (sección de contacto)'
  };

  /** Resizes to a max dimension, re-encodes as webp, uploads to Firebase Storage. */
  function uploadImage(key, file, done) {
    var MAX_DIM = 1920;
    var img = new Image();
    var reader = new FileReader();
    reader.onload = function () {
      img.onload = function () {
        var scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
        var w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob(function (blob) {
          if (!blob) { done(new Error('No se pudo procesar la imagen.')); return; }
          var ref = window.PQ_STORAGE.ref().child('assets/' + key + '-' + Date.now() + '.webp');
          ref.put(blob, { contentType: 'image/webp' })
            .then(function () { return ref.getDownloadURL(); })
            .then(function (url) { done(null, url); })
            .catch(done);
        }, 'image/webp', 0.85);
      };
      img.onerror = function () { done(new Error('Ese archivo no parece ser una imagen válida.')); };
      img.src = reader.result;
    };
    reader.onerror = function () { done(new Error('No se pudo leer el archivo.')); };
    reader.readAsDataURL(file);
  }

  function renderImagesTab() {
    var s = section('Imágenes del sitio', { startOpen: true });
    var hint = el('p', null, 'Las fotos se suben a Firebase Storage. El cambio queda listo aquí, pero solo se publica cuando le des "Guardar cambios".');
    hint.style.cssText = 'font-size:12px;color:#8C7C68;margin-top:-8px;margin-bottom:16px;';
    s.appendChild(hint);
    Object.keys(ASSET_LABELS).forEach(function (key) {
      var row = el('div', 'admin-image-field');
      var img = document.createElement('img');
      img.src = state.assets[key];
      row.appendChild(img);
      var meta = el('div', 'meta');
      meta.appendChild(el('div', 'name', ASSET_LABELS[key]));
      var fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      var status = el('span', null, '');
      status.style.cssText = 'font-size:12px;color:#8C7C68;margin-left:8px;';
      fileInput.addEventListener('change', function () {
        var file = fileInput.files[0];
        if (!file) return;
        fileInput.disabled = true;
        status.textContent = 'Subiendo…';
        uploadImage(key, file, function (err, url) {
          fileInput.disabled = false;
          fileInput.value = '';
          if (err) {
            console.error(err);
            status.textContent = '';
            toast('No se pudo subir la imagen: ' + err.message, true);
            return;
          }
          state.assets[key] = url;
          img.src = url;
          status.textContent = '';
          markDirty();
          toast('Imagen subida. No olvides "Guardar cambios" para publicarla.');
        });
      });
      meta.appendChild(fileInput);
      meta.appendChild(status);
      row.appendChild(meta);
      s.appendChild(row);
    });

    // ---- Additional images (not tied to a fixed slot) ----
    if (!state.assets.customImages) state.assets.customImages = [];
    var customWrap = el('div', null);
    customWrap.style.cssText = 'margin-top:24px;padding-top:20px;border-top:1px solid #ECDFCF;';
    var customTitle = el('h3', null, 'Imágenes adicionales');
    customTitle.style.cssText = "font-family:'Cormorant',serif;font-size:18px;color:#B0703F;font-weight:500;margin:0 0 6px;";
    customWrap.appendChild(customTitle);
    var customHint = el('p', null, 'Súbelas aquí con el nombre que quieras y luego elígelas como foto al agregar un tipo de habitación nuevo.');
    customHint.style.cssText = 'font-size:12px;color:#8C7C68;margin:0 0 14px;';
    customWrap.appendChild(customHint);

    function renderCustomList() {
      var existingList = customWrap.querySelector('.admin-custom-image-list');
      if (existingList) existingList.remove();
      var list = el('div', 'admin-custom-image-list');
      state.assets.customImages.forEach(function (entry) {
        var row = el('div', 'admin-image-field');
        var img = document.createElement('img');
        if (state.assets[entry.id]) {
          img.src = state.assets[entry.id];
        } else {
          img.classList.add('admin-image-empty');
        }
        row.appendChild(img);
        var meta = el('div', 'meta');
        var labelInput = document.createElement('input');
        labelInput.type = 'text';
        labelInput.value = entry.label || '';
        labelInput.placeholder = 'Nombre de esta foto';
        labelInput.style.cssText = 'font-size:13px;font-weight:600;margin-bottom:6px;padding:5px 7px;border:1px solid #E7DCCB;border-radius:3px;width:100%;box-sizing:border-box;';
        labelInput.addEventListener('input', function () { entry.label = labelInput.value; markDirty(); });
        meta.appendChild(labelInput);

        var fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        var status = el('span', null, '');
        status.style.cssText = 'font-size:12px;color:#8C7C68;margin-left:8px;';
        fileInput.addEventListener('change', function () {
          var file = fileInput.files[0];
          if (!file) return;
          fileInput.disabled = true;
          status.textContent = 'Subiendo…';
          uploadImage(entry.id, file, function (err, url) {
            fileInput.disabled = false;
            fileInput.value = '';
            if (err) {
              console.error(err);
              status.textContent = '';
              toast('No se pudo subir la imagen: ' + err.message, true);
              return;
            }
            state.assets[entry.id] = url;
            img.src = url;
            img.classList.remove('admin-image-empty');
            status.textContent = '';
            markDirty();
            toast('Imagen subida. No olvides "Guardar cambios" para publicarla.');
          });
        });
        meta.appendChild(fileInput);
        meta.appendChild(status);

        var delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'btn-small btn-danger';
        delBtn.textContent = 'Eliminar';
        delBtn.style.cssText = 'display:block;margin-top:8px;';
        delBtn.addEventListener('click', function () {
          var idx = state.assets.customImages.indexOf(entry);
          if (idx !== -1) state.assets.customImages.splice(idx, 1);
          delete state.assets[entry.id];
          markDirty();
          renderCustomList();
        });
        meta.appendChild(delBtn);

        row.appendChild(meta);
        list.appendChild(row);
      });
      customWrap.insertBefore(list, addCustomBtn);
    }

    var addCustomBtn = el('button', 'btn-small btn-add', '+ Agregar imagen');
    addCustomBtn.type = 'button';
    addCustomBtn.addEventListener('click', function () {
      state.assets.customImages.push({ id: 'custom-' + Date.now(), label: '' });
      markDirty();
      renderCustomList();
    });
    customWrap.appendChild(addCustomBtn);
    renderCustomList();

    s.appendChild(customWrap);
  }

  // ---------- Locale tab ----------
  function assetOptions() {
    var fixed = Object.keys(ASSET_LABELS).map(function (k) { return { value: k, label: ASSET_LABELS[k] }; });
    var custom = (state.assets.customImages || []).map(function (c) {
      return { value: c.id, label: c.label ? c.label : 'Imagen adicional sin nombre' };
    });
    return fixed.concat(custom);
  }

  function renderLocaleTab(locale) {
    var c = state.content[locale];

    var s2 = section('Tarjeta de datos del grupo');
    inputRow(s2, 'Contacto', c.meta.contact, function (v) { c.meta.contact = v; });
    inputRow(s2, 'Empresa / Grupo', c.meta.company, function (v) { c.meta.company = v; });
    inputRow(s2, 'Fechas del grupo', c.meta.dates, function (v) { c.meta.dates = v; });
    inputRow(s2, 'Fecha', c.meta.date, function (v) { c.meta.date = v; });

    var s4 = section('Tarifas y Condiciones', { enabled: { value: c.rates.enabled, onChange: function (v) { c.rates.enabled = v; } } });
    inputRow(s4, 'Título de la sección', c.rates.title, function (v) { c.rates.title = v; });
    inputRow(s4, 'Check-in', c.rates.checkIn, function (v) { c.rates.checkIn = v; });
    inputRow(s4, 'Check-out', c.rates.checkOut, function (v) { c.rates.checkOut = v; });
    s4.appendChild(el('label', null, 'Filas de la tabla de tarifas'));
    editableTable(s4, c.rates.rows, [
      { key: 'category', label: 'Categoría' },
      { key: 'day1', label: 'Columna 1 (ej. 1 dic)' },
      { key: 'day2', label: 'Columna 2 (ej. 2 dic)' },
      { key: 'totalRooms', label: 'Total hab.' },
      { key: 'rate', label: 'Tarifa' },
      { key: 'subtotal', label: 'Subtotal' }
    ], function () { return { category: '', day1: '', day2: '', totalRooms: '', rate: '', subtotal: '' }; });
    inputRow(s4, 'Nota al pie (impuestos, etc.)', c.rates.footnote, function (v) { c.rates.footnote = v; }, { textarea: true, rows: 3 });
    inputRow(s4, 'Etiqueta gran total', c.rates.grandTotalLabel, function (v) { c.rates.grandTotalLabel = v; });
    inputRow(s4, 'Subtexto gran total', c.rates.grandTotalSub, function (v) { c.rates.grandTotalSub = v; });
    inputRow(s4, 'Monto gran total', c.rates.grandTotalAmount, function (v) { c.rates.grandTotalAmount = v; });
    inputRow(s4, 'Moneda', c.rates.grandTotalCurrency, function (v) { c.rates.grandTotalCurrency = v; });
    inputRow(s4, 'Etiqueta de concesiones', c.rates.concessionsLabel, function (v) { c.rates.concessionsLabel = v; });
    linesRow(s4, 'Concesiones para el grupo', c.rates.concessions, function (v) { c.rates.concessions = v; });

    var s5 = section('Agenda Estimada', { enabled: { value: c.agenda.enabled, onChange: function (v) { c.agenda.enabled = v; } } });
    inputRow(s5, 'Título de la sección', c.agenda.title, function (v) { c.agenda.title = v; });
    inputRow(s5, 'Párrafo introductorio', c.agenda.intro, function (v) { c.agenda.intro = v; }, { textarea: true, rows: 3 });
    s5.appendChild(el('label', null, 'Partidas de la agenda'));
    editableTable(s5, c.agenda.items, [
      { key: 'visible', label: 'Mostrar', type: 'checkbox' },
      { key: 'event', label: 'Evento' },
      { key: 'day', label: 'Día' },
      { key: 'time', label: 'Hora' },
      { key: 'place', label: 'Lugar' },
      { key: 'pax', label: 'Pax' },
      { key: 'total', label: 'Total' },
      { key: 'description', label: 'Descripción', type: 'textarea' }
    ], function () { return { visible: true, event: '', day: '', time: '', place: '', pax: '', total: '', description: '' }; });
    inputRow(s5, 'Etiqueta total agenda', c.agenda.totalLabel, function (v) { c.agenda.totalLabel = v; });
    inputRow(s5, 'Monto total agenda', c.agenda.totalAmount, function (v) { c.agenda.totalAmount = v; });
    inputRow(s5, 'Moneda', c.agenda.totalCurrency, function (v) { c.agenda.totalCurrency = v; });

    var s6 = section('Habitaciones', { enabled: { value: c.rooms.enabled, onChange: function (v) { c.rooms.enabled = v; } } });
    inputRow(s6, 'Título de la sección', c.rooms.title, function (v) { c.rooms.title = v; });
    inputRow(s6, 'Párrafo introductorio', c.rooms.intro, function (v) { c.rooms.intro = v; }, { textarea: true, rows: 3 });
    s6.appendChild(el('label', null, 'Tipos de habitación'));
    editableTable(s6, c.rooms.types, [
      { key: 'visible', label: 'Mostrar', type: 'checkbox' },
      { key: 'imageKey', label: 'Foto', type: 'select', options: assetOptions },
      { key: 'alt', label: 'Texto alternativo (accesibilidad)' },
      { key: 'title', label: 'Título' },
      { key: 'size', label: 'Tamaño' }
    ], function () { return { visible: true, imageKey: 'roomDouble', alt: '', title: '', size: '' }; });
    inputRow(s6, 'Etiqueta de amenidades', c.rooms.amenitiesLabel, function (v) { c.rooms.amenitiesLabel = v; });
    linesRow(s6, 'En todas las habitaciones', c.rooms.amenities, function (v) { c.rooms.amenities = v; });

    var s7 = section('Amenidades y Experiencias', { enabled: { value: c.amenities.enabled, onChange: function (v) { c.amenities.enabled = v; } } });
    inputRow(s7, 'Título de la sección', c.amenities.title, function (v) { c.amenities.title = v; });
    inputRow(s7, 'Etiqueta amenidades del hotel', c.amenities.hotelAmenitiesLabel, function (v) { c.amenities.hotelAmenitiesLabel = v; });
    linesRow(s7, 'Amenidades del hotel', c.amenities.hotelAmenities, function (v) { c.amenities.hotelAmenities = v; });
    inputRow(s7, 'Etiqueta actividades', c.amenities.activitiesLabel, function (v) { c.amenities.activitiesLabel = v; });
    s7.appendChild(el('label', null, 'Grupos de actividades'));
    objectListField(s7, c.amenities.activityGroups, [
      { key: 'title', label: 'Título del grupo' },
      { key: 'items', label: 'Actividades', type: 'lines' }
    ], function () { return { title: '', items: [] }; });
    inputRow(s7, 'Leyenda de fotos de tours', c.amenities.tourCaption, function (v) { c.amenities.tourCaption = v; });
    var hint7 = el('p', null, 'Las fotos (patio, lobby, alberca, tours) se editan en la pestaña "Imágenes".');
    hint7.style.cssText = 'font-size:12px;color:#8C7C68;margin-top:-6px;';
    s7.appendChild(hint7);

    var s9 = section('Políticas del Hotel', { enabled: { value: c.policies.enabled, onChange: function (v) { c.policies.enabled = v; } } });
    inputRow(s9, 'Título de la sección', c.policies.title, function (v) { c.policies.title = v; });
    s9.appendChild(el('label', null, 'Datos rápidos (check-in, check-out, etc.)'));
    editableTable(s9, c.policies.quickFacts, [
      { key: 'label', label: 'Etiqueta' },
      { key: 'value', label: 'Valor' }
    ], function () { return { label: '', value: '' }; });
    s9.appendChild(el('label', null, 'Bloques de política'));
    objectListField(s9, c.policies.blocks, [
      { key: 'title', label: 'Título' },
      { key: 'text', label: 'Texto', type: 'textarea' }
    ], function () { return { title: '', text: '' }; });

    var s10 = section('Contacto', { enabled: { value: c.contact.enabled, onChange: function (v) { c.contact.enabled = v; } } });
    inputRow(s10, 'Título de la sección', c.contact.title, function (v) { c.contact.title = v; });
    inputRow(s10, 'Nombre del hotel', c.contact.hotelName, function (v) { c.contact.hotelName = v; });
    inputRow(s10, 'Dirección línea 1', c.contact.addressLine1, function (v) { c.contact.addressLine1 = v; });
    inputRow(s10, 'Dirección línea 2', c.contact.addressLine2, function (v) { c.contact.addressLine2 = v; });
    inputRow(s10, 'Nombre del contacto de ventas', c.contact.contactName, function (v) { c.contact.contactName = v; });
    inputRow(s10, 'Puesto', c.contact.contactTitle, function (v) { c.contact.contactTitle = v; });
    inputRow(s10, 'Correo', c.contact.contactEmail, function (v) { c.contact.contactEmail = v; });

    var s11 = section('Pie de página');
    inputRow(s11, 'Aviso legal', c.footer, function (v) { c.footer = v; }, { textarea: true, rows: 2 });
  }

  // ---------- Save / publish ----------
  document.getElementById('admin-save').addEventListener('click', function () {
    var btn = this;
    btn.disabled = true;
    Promise.all([window.PQStore.save(state.content), window.PQStore.saveAssets(state.assets)])
      .then(function () {
        markClean();
        toast('Cambios guardados y publicados en el sitio.');
      })
      .catch(function (e) {
        console.error(e);
        toast('No se pudo guardar: ' + e.message, true);
      })
      .finally(function () { btn.disabled = false; });
  });

  document.getElementById('admin-reset').addEventListener('click', function () {
    if (!confirm('¿Restablecer todo el contenido a los valores originales del diseño? Esto se publica de inmediato en el sitio y no se puede deshacer.')) return;
    window.PQStore.reset().then(function () {
      return Promise.all([window.PQStore.load(), window.PQStore.loadAssets()]);
    }).then(function (results) {
      state = { content: results[0], assets: results[1] };
      renderTab();
      markClean();
      toast('Contenido restablecido a los valores originales.');
    }).catch(function (e) {
      console.error(e);
      toast('No se pudo restablecer: ' + e.message, true);
    });
  });

  document.getElementById('admin-preview').addEventListener('click', function () {
    // Opens what's currently PUBLISHED (last "Guardar cambios"), not
    // whatever unsaved edits are sitting in this form.
    window.open('index.html', '_blank');
  });

  // ---------- Export standalone HTML (snapshot of the CURRENT edits,
  // saved or not — this is the "build one quote, download it" workflow) ----------
  function toAbsolute(url) {
    if (/^https?:\/\//.test(url) || url.indexOf('data:') === 0) return url;
    return SITE_BASE + url.replace(/^\/+/, '');
  }

  function safeJSON(obj) {
    return JSON.stringify(obj).replace(/</g, '\\u003c');
  }

  /** mode: 'both' | 'es' | 'en' — which language(s) to bake into the export. */
  function buildStandaloneHTML(content, assets, mode) {
    mode = mode || 'both';
    var absAssets = {};
    Object.keys(assets).forEach(function (k) { absAssets[k] = toAbsolute(assets[k]); });

    var exportContent = mode === 'both' ? content : (mode === 'en' ? { en: content.en } : { es: content.es });
    var initialLocale = mode === 'en' ? 'en' : 'es';
    var showToggle = mode === 'both';
    var titleSuffix = mode === 'both' ? '' : (mode === 'en' ? ' (EN)' : ' (ES)');

    var toggleHtml = showToggle
      ? '<div class="pq-locale-toggle">\n  <button type="button" class="pq-locale-btn" data-locale="es">ES</button>\n  <button type="button" class="pq-locale-btn" data-locale="en">EN</button>\n</div>\n'
      : '';

    var bootstrap = [
      '(function(){',
      '  var state = { locale: "' + initialLocale + '", open: new Set(), content: window.__PQ_CONTENT__, assets: window.__PQ_ASSETS__ };',
      '  var root = document.getElementById("pq-root");',
      '  function render(){',
      '    var c = state.content[state.locale];',
      '    root.innerHTML = window.PQRender.renderQuotePage(c, state.assets, state.open);',
      '    document.documentElement.lang = state.locale;',
      '    document.querySelectorAll(".pq-locale-btn").forEach(function(btn){ btn.classList.toggle("active", btn.dataset.locale===state.locale); });',
      '  }',
      '  root.addEventListener("click", function(e){',
      '    var btn = e.target.closest("[data-toggle]"); if(!btn) return;',
      '    var key = btn.dataset.toggle;',
      '    if(state.open.has(key)) state.open.delete(key); else state.open.add(key);',
      '    render();',
      '  });',
      '  document.querySelectorAll(".pq-locale-btn").forEach(function(btn){',
      '    btn.addEventListener("click", function(){ state.locale = btn.dataset.locale; render(); });',
      '  });',
      '  render();',
      '})();'
    ].join('\n');

    return '<!DOCTYPE html>\n' +
      '<html lang="' + initialLocale + '">\n<head>\n<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<title>Hotel Perla La Paz &middot; Propuesta de Grupo' + titleSuffix + '</title>\n' +
      '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
      '<link href="https://fonts.googleapis.com/css2?family=Cormorant:wght@400;500;600&family=Work+Sans:wght@400;500;600&display=swap" rel="stylesheet">\n' +
      '<link rel="stylesheet" href="' + SITE_BASE + 'css/styles.css">\n' +
      '</head>\n<body>\n' +
      toggleHtml +
      '<div id="pq-root"></div>\n' +
      '<script src="' + SITE_BASE + 'js/render.js"><' + '/script>\n' +
      '<script>\n' +
      'window.__PQ_CONTENT__ = ' + safeJSON(exportContent) + ';\n' +
      'window.__PQ_ASSETS__ = ' + safeJSON(absAssets) + ';\n' +
      bootstrap + '\n' +
      '<' + '/script>\n' +
      '</body>\n</html>\n';
  }

  document.getElementById('admin-download').addEventListener('click', function () {
    try {
      var mode = document.getElementById('admin-download-mode').value;
      var html = buildStandaloneHTML(state.content, state.assets, mode);
      var blob = new Blob([html], { type: 'text/html' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      var suffix = mode === 'both' ? '' : ('-' + mode);
      a.download = 'cotizacion-perla' + suffix + '-' + Date.now() + '.html';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast('HTML descargado (usa las fotos e imágenes publicadas en línea).');
    } catch (err) {
      console.error(err);
      toast('No se pudo generar el HTML: ' + err.message, true);
    }
  });

  // ---------- PDF (browser print, all sections expanded) ----------
  function buildPrintableHTML(content, assets, locale) {
    var c = content[locale];
    var absAssets = {};
    Object.keys(assets).forEach(function (k) { absAssets[k] = toAbsolute(assets[k]); });
    var allOpen = new Set(['rates', 'agenda', 'rooms', 'amenities', 'venues', 'policies', 'contact']);
    var bodyHtml = window.PQRender.renderQuotePage(c, absAssets, allOpen);

    return '<!DOCTYPE html>\n' +
      '<html lang="' + locale + '">\n<head>\n<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<title>Hotel Perla La Paz &middot; Propuesta de Grupo (' + (locale === 'en' ? 'EN' : 'ES') + ')</title>\n' +
      '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
      '<link href="https://fonts.googleapis.com/css2?family=Cormorant:wght@400;500;600&family=Work+Sans:wght@400;500;600&display=swap" rel="stylesheet">\n' +
      '<link rel="stylesheet" href="' + SITE_BASE + 'css/styles.css">\n' +
      '<style>\n' +
      '  .pq-tap-hint{display:none;}\n' +
      '  .pq-section-icon{display:none;}\n' +
      '  .pq-section-btn{cursor:default;}\n' +
      '  .pq-locale-toggle,.pq-admin-link{display:none;}\n' +
      '  @media print{ .pq-section{break-inside:avoid;} body{-webkit-print-color-adjust:exact;print-color-adjust:exact;} }\n' +
      '</style>\n' +
      '</head>\n<body>\n<div id="pq-root">' + bodyHtml + '</div>\n</body>\n</html>\n';
  }

  function downloadPDF(locale) {
    try {
      var html = buildPrintableHTML(state.content, state.assets, locale);
      var win = window.open('', '_blank');
      if (!win) {
        toast('Tu navegador bloqueó la ventana — permite pop-ups para este sitio e inténtalo de nuevo.', true);
        return;
      }
      win.document.open();
      win.document.write(html);
      win.document.close();
      win.addEventListener('load', function () {
        setTimeout(function () { win.print(); }, 350);
      });
    } catch (err) {
      console.error(err);
      toast('No se pudo generar el PDF: ' + err.message, true);
    }
  }

  document.getElementById('admin-pdf-es').addEventListener('click', function () { downloadPDF('es'); });
  document.getElementById('admin-pdf-en').addEventListener('click', function () { downloadPDF('en'); });
})();
