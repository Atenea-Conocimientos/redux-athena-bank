const $ = (selector) => document.querySelector(selector);
const escape = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  );
const money = (cents) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(
    cents / 100,
  );
const state = {
  data: null,
  lab: null,
  filter: '',
  type: '',
  limit: 5,
  quote: null,
  timer: null,
  busy: false,
  fault: false,
  draft: null,
  epoch: 0,
};
const authChannel = new BroadcastChannel('athena-lab-auth');
function loseSession(preserveDraft = false) {
  state.epoch++;
  if (!preserveDraft) state.draft = null;
  state.quote = null;
  closeModal();
  $('#modal').innerHTML = '';
  state.data = null;
  render();
}
authChannel.onmessage = (event) => {
  if (event.data?.labId !== state.lab?.id) return;
  if (['logout', 'login', 'reset'].includes(event.data?.type)) {
    if (event.data.type === 'reset') state.lab = null;
    loseSession();
    notify(
      'La sesión cambió en otra pestaña. Volvé a iniciar sesión para continuar.',
    );
  }
};
function broadcastAuth(type) {
  authChannel.postMessage({ type, labId: state.lab?.id });
}
const statusLabel = {
  pending: 'Pendiente',
  completed: 'Completada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
};
const scenes = [
  [
    '01',
    'Primer recorrido',
    'Registro, login, cuentas y validación de formularios.',
    'Locators · actions · assertions',
    'https://playwright.dev/docs/locators',
  ],
  [
    '02',
    'La cuenta correcta',
    'Dos tarjetas con botones iguales: localizar por región y alias.',
    'filter · strictness · chaining',
    'https://playwright.dev/docs/locators',
  ],
  [
    '03',
    'Transferencia confiable',
    'Cotización, comisión, OTP ficticio y reserva de saldo.',
    'test.step · auto-waiting · expect',
    'https://playwright.dev/docs/actionability',
  ],
  [
    '04',
    'Estados y límites',
    'Procesar, cancelar o rechazar; límites diarios y cuentas congeladas.',
    'APIRequestContext · parameterization',
    'https://playwright.dev/docs/api-testing',
  ],
  [
    '05',
    'Un pedido, una operación',
    'Reintentos, claves repetidas y dos solicitudes simultáneas.',
    'request · Promise.all · invariants',
    'https://playwright.dev/docs/api-testing',
  ],
  [
    '06',
    'Dos clientes',
    'Ana envía, Bruno recibe. Comprobar ambos saldos e historial.',
    'browser contexts · storageState',
    'https://playwright.dev/docs/auth',
  ],
  [
    '07',
    'Cuando falla la red',
    'Abortar una petición, demorar la respuesta o devolver 503.',
    'route · fulfill · abort · waitForResponse',
    'https://playwright.dev/docs/mock',
  ],
  [
    '08',
    'Archivos con reglas',
    'Importar beneficiarios CSV: duplicados, tamaño y atomicidad.',
    'setInputFiles · filechooser',
    'https://playwright.dev/docs/input',
  ],
  [
    '09',
    'Comprobantes',
    'Descargar CSV y abrir un comprobante en otra pestaña.',
    'download · popup · events',
    'https://playwright.dev/docs/downloads',
  ],
  [
    '10',
    'Un proveedor embebido',
    'Validación ficticia en iframe y ayuda dentro de Shadow DOM.',
    'frameLocator · shadow DOM',
    'https://playwright.dev/docs/frames',
  ],
  [
    '11',
    'El tiempo importa',
    'Cotización de 90 segundos; distinguir reloj UI y reloj servidor.',
    'page.clock · API clock',
    'https://playwright.dev/docs/clock',
  ],
  [
    '12',
    'Preferencias y ubicación',
    'Geolocalización simulada, red offline y ancho móvil.',
    'permissions · geolocation · emulation',
    'https://playwright.dev/docs/emulation',
  ],
  [
    '13',
    'Listas interactivas',
    'Ordenar beneficiarios arrastrando o con teclado; filtrar movimientos.',
    'dragTo · keyboard · scoped locators',
    'https://playwright.dev/docs/input',
  ],
  [
    '14',
    'Accesibilidad y regresión',
    'Foco, nombres accesibles, snapshots ARIA y contraste.',
    'axe · toMatchAriaSnapshot · screenshots',
    'https://playwright.dev/docs/accessibility-testing',
  ],
  [
    '15',
    'Una suite mantenible',
    'Fixtures aisladas, proyectos, reportes, trazas y CI.',
    'fixtures · projects · trace · sharding',
    'https://playwright.dev/docs/test-fixtures',
  ],
  [
    '16',
    'Un proveedor reproducible',
    'Grabar y reproducir tasas ficticias sin depender de la red.',
    'HAR · route.fetch · routeFromHAR',
    'https://playwright.dev/docs/mock',
  ],
  [
    '17',
    'Un canal en vivo',
    'Eventos WebSocket, datos inválidos, cortes y reconexión.',
    'routeWebSocket · frames · events',
    'https://playwright.dev/docs/mock',
  ],
  [
    '18',
    'Cuando vuelve la conexión',
    'Consulta pública offline, caché explícita y datos desactualizados.',
    'Service Workers · setOffline · fromServiceWorker',
    'https://playwright.dev/docs/service-workers',
  ],
  [
    '19',
    'La sesión se terminó',
    'Recuperar el borrador sin guardar OTP ni enviar operaciones automáticamente.',
    'API + UI · varias pestañas · aislamiento',
    'https://playwright.dev/docs/auth',
  ],
  [
    '20',
    'El navegador también falla',
    'Portapapeles y geolocalización: éxito, permisos denegados y alternativa manual.',
    'addInitScript · exposeFunction · POM',
    'https://playwright.dev/docs/mock-browser-apis',
  ],
];
function notify(text, error = false) {
  clearTimeout(state.noticeTimer);
  const output = $('#modal').open ? $('#modal-notice') : $('#notice');
  output.textContent = text;
  output.className = error ? 'error visible' : 'visible';
  output.setAttribute('role', error ? 'alert' : 'status');
  if ($('#modal').open) return;
  state.noticeTimer = setTimeout(() => {
    $('#notice').className = '';
  }, 8000);
}
async function api(url, options = {}) {
  const epoch = state.epoch;
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  const result = await response.json();
  if (epoch !== state.epoch)
    throw new Error(
      'La sesión cambió durante la solicitud. Volvé a iniciar sesión.',
    );
  if (!response.ok)
    throw Object.assign(new Error(result.message), {
      status: response.status,
      code: result.code,
    });
  return result;
}
async function run(action) {
  if (state.busy) return;
  state.busy = true;
  $('#notice').textContent = '';
  $('#notice').className = '';
  if ($('#modal-notice')) {
    $('#modal-notice').textContent = '';
    $('#modal-notice').className = '';
  }
  const buttons = [...document.querySelectorAll('button')].filter(
    (b) => !b.disabled,
  );
  buttons.forEach((b) => {
    b.disabled = true;
  });
  try {
    await action();
  } catch (error) {
    if (error.status === 401 && state.data) loseSession(true);
    notify(error.message || 'No se pudo completar la operación.', true);
  } finally {
    state.busy = false;
    buttons.forEach((b) => {
      if (b.isConnected) b.disabled = false;
    });
  }
}
async function refresh() {
  const epoch = state.epoch;
  const data = await api('/api/overview');
  if (epoch !== state.epoch) return;
  state.data = data;
  render();
}
function amount(value) {
  if (!/^\d+(\.\d{1,2})?$/.test(String(value)))
    throw new Error('Ingresá un importe positivo con hasta dos decimales.');
  const [whole, decimal = ''] = String(value).split('.');
  const result = Number(whole) * 100 + Number(decimal.padEnd(2, '0'));
  if (!Number.isSafeInteger(result) || result <= 0)
    throw new Error('Importe inválido.');
  return result;
}
const button = (action, text, data = '', classes = 'secondary') =>
  `<button type="button" class="${classes}" data-action="${action}" ${data}>${text}</button>`;
function closeModal() {
  clearInterval(state.timer);
  $('#modal').close();
}
function modal(title, content) {
  const d = $('#modal');
  d.innerHTML = `<div class="modal-header"><h2 id="modal-title">${title}</h2>${button('close', 'Cerrar', 'aria-label="Cerrar diálogo"', 'ghost')}</div><p id="modal-notice" aria-live="polite"></p>${content}`;
  d.showModal();
}
function field(label, name, attributes = '', value = '') {
  return `<label>${label}<input name="${name}" ${attributes} value="${escape(value)}"></label>`;
}
function accountOptions(selected) {
  return state.data.accounts
    .map(
      (a) =>
        `<option value="${a.id}" ${a.id === selected ? 'selected' : ''}>${escape(a.name)} · ${escape(a.alias)}</option>`,
    )
    .join('');
}
function landing() {
  return `<main id="main" class="welcome"><header class="brand">◈ <span>athena<span class="accent">bank</span></span><span class="pill">QA LAB / 02</span></header>
    <div class="welcome-grid"><section><p class="eyebrow">UN BANCO FICTICIO. PROBLEMAS REALES.</p><h1>Aprendé a probar<br>lo que <em>importa.</em></h1><p class="lead">Explorá, cuestioná y automatizá. Un entorno bancario con estados, límites y errores controlados para ir mucho más allá del clic.</p><div class="feature-line"><span>01 / Diseñá casos</span><span>02 / Investigá riesgos</span><span>03 / Automatizá</span></div><p class="safety">Solo dinero ficticio. No uses contraseñas, documentos ni datos personales reales.</p></section>
    <section class="panel"><p class="eyebrow">TU ESPACIO DE PRÁCTICA</p><h2>Iniciar laboratorio</h2><p>Cada laboratorio tiene datos separados. La versión original sigue intacta en el repositorio.</p><form id="start-form"><label>Perfil del ejercicio<select name="profile"><option value="stable">Estable · comportamiento esperado</option><option value="duplicate-submit">Reto · operación duplicada</option><option value="missing-reservation">Reto · saldo reservado</option></select></label><button class="primary">Crear mi práctica <span aria-hidden="true">↗</span></button></form><div class="hint"><strong>Sin servicios externos</strong><p>Usuarios ficticios, SQLite local y un catálogo de 20 misiones. Podés volver a empezar cuando quieras.</p></div></section></div></main>`;
}
function login() {
  return `<main id="main" class="login-wrap"><a class="brand" href="/">◈ athenabank <span class="pill">LAB</span></a><section class="panel"><p class="eyebrow">LABORATORIO PREPARADO</p><h1>Tu sesión de práctica</h1><p>Perfil: <strong>${escape(state.lab.profile)}</strong></p><form id="login-form">${field('Email ficticio', 'email', 'type="email" autocomplete="username" required', 'ana@demo.test')}${field('Contraseña de práctica', 'password', 'type="password" autocomplete="current-password" required', 'Practica2026!')}<button class="primary">Iniciar sesión</button></form><p class="hint">Ana: ana@demo.test<br>Bruno: bruno@demo.test<br>Clave pública de ambos: <code>Practica2026!</code></p>${button('register', 'Crear otro usuario ficticio')}${button('new-lab', 'Volver al inicio', '', 'ghost')}</section></main>`;
}
const navigation = [
  ['/', '◫', 'Resumen'],
  ['/transferencias', '↗', 'Transferencias'],
  ['/beneficiarios', '◎', 'Beneficiarios'],
  ['/movimientos', '≡', 'Movimientos'],
  ['/documentos', '⇧', 'Documentos'],
  ['/laboratorio', '◇', 'Laboratorio'],
];
function render() {
  if (!state.lab) {
    $('#app').innerHTML = landing();
    return;
  }
  if (!state.data) {
    $('#app').innerHTML = login();
    return;
  }
  const url = location.pathname;
  const titles = {
    '/': [
      'TU BANCO, BAJO CONTROL',
      `Buen día, ${state.data.user.name.split(' ')[0]}.`,
      'Cada operación cuenta. También cuando algo no sale como esperabas.',
    ],
    '/transferencias': [
      'OPERACIONES',
      'Transferencias',
      'Del saldo disponible al comprobante: seguí todo el recorrido.',
    ],
    '/beneficiarios': [
      'TU AGENDA',
      'Beneficiarios',
      'Alias únicos, orden propio y datos preparados para cada prueba.',
    ],
    '/movimientos': [
      'TRAZABILIDAD',
      'Movimientos',
      'No alcanza con un mensaje de éxito. Mirá qué pasó con el dinero.',
    ],
    '/documentos': [
      'ARCHIVOS E INTEGRACIONES',
      'Documentos',
      'Importaciones, descargas y un proveedor ficticio, todo local.',
    ],
    '/laboratorio': [
      'APRENDER HACIENDO',
      'Tu laboratorio de QA',
      'Elegí una misión. Definí el resultado esperado antes de automatizar.',
    ],
  };
  const title = titles[url] || [
    'EVIDENCIA DE OPERACIÓN',
    'Comprobante de práctica',
    'Documento ficticio. Sin validez bancaria.',
  ];
  $('#app').innerHTML =
    `<div class="shell"><aside class="sidebar"><a href="/" data-nav class="brand">◈ <span>athena<span class="accent">bank</span></span></a><span class="eyebrow">WORKSPACE / QA LAB</span><nav aria-label="Principal">${navigation.map(([href, icon, text]) => `<a href="${href}" data-nav ${url === href ? 'aria-current="page"' : ''}><span aria-hidden="true">${icon}</span>${text}</a>`).join('')}</nav><div class="sidebar-bottom"><p><span class="dot"></span> Entorno local aislado</p><small>Sin dinero real.<br>Sin servicios pagos.</small></div></aside><div class="workspace"><header class="topbar"><span class="pill ${state.data.profile !== 'stable' ? 'warning' : ''}">${state.data.profile === 'stable' ? 'VERSIÓN ESTABLE' : 'DEFECTO INTENCIONAL: ' + escape(state.data.profile)}</span><div class="user"><span class="avatar">${escape(state.data.user.name[0])}</span><span>${escape(state.data.user.name)}</span>${button('logout', 'Salir', '', 'ghost')}</div></header><main id="main"><div class="page-title"><p class="eyebrow">${title[0]}</p><h1>${escape(title[1])}</h1><p>${title[2]}</p></div>${url.startsWith('/comprobantes/') ? '<section id="receipt" class="panel" aria-busy="true">Cargando comprobante…</section>' : renderPage(url)}<footer>ATHENA BANK LAB · Datos ficticios · Día bancario UTC <lab-help></lab-help></footer></main></div></div>`;
  if (url.startsWith('/comprobantes/')) void loadReceipt(url.split('/').pop());
  bindDrag();
}
function renderPage(route) {
  if (route === '/transferencias')
    return `<div class="section-bar"><h2>Operaciones recientes</h2>${button('transfer', 'Nueva transferencia ↗', '', 'primary')}</div><div class="hint">El envío reserva el saldo. Procesar mueve el dinero; cancelar libera la reserva. Comisión externa: 1% (mínimo $1). Entre tus cuentas: sin comisión. Límite diario: $1.000 de principal.</div>${transfers()}`;
  if (route === '/beneficiarios') return beneficiaries();
  if (route === '/movimientos') return movements();
  if (route === '/documentos') return documents();
  if (route === '/laboratorio') return laboratory();
  return dashboard();
}
function dashboard() {
  const d = state.data;
  const total = d.accounts.reduce((s, a) => s + a.balance, 0);
  const pending = d.accounts.reduce((s, a) => s + a.reserved, 0);
  return `<div class="overview"><section class="balance-card"><p>Saldo disponible</p><h2 data-testid="available-total">${money(total - pending)}</h2><div class="balance-details"><span>Saldo contable <strong>${money(total)}</strong></span><span>Reservado <strong>${money(pending)}</strong></span></div><div class="actions">${button('transfer', 'Transferir ↗', '', 'light')}${button('deposit', 'Ingresar fondos', '', 'outline-light')}</div><span class="orb" aria-hidden="true"></span></section><section class="panel progress-panel"><p class="eyebrow">LÍMITE DIARIO</p><h2>${money(d.dailyLimit - d.dailyUsed)}</h2><p>disponibles para transferir hoy</p><progress max="${d.dailyLimit}" value="${d.dailyUsed}" aria-label="Límite diario utilizado"></progress><small>${money(d.dailyUsed)} de ${money(d.dailyLimit)} utilizados · día UTC</small><p class="subtle">Las operaciones pendientes también cuentan.</p></section></div><div class="section-bar"><h2>Tus cuentas <span class="count">${d.accounts.length}</span></h2>${button('account', '+ Crear cuenta')}</div><div class="account-grid">${d.accounts.map((a) => `<section class="account panel" aria-label="Cuenta ${escape(a.alias)}"><div class="section-bar"><span class="account-icon" aria-hidden="true">${a.type === 'savings' ? '◇' : '▣'}</span><span class="pill ${a.frozen ? 'warning' : ''}">${a.frozen ? 'Congelada' : 'Activa'}</span></div><h3>${escape(a.name)}</h3><p class="mono">${escape(a.alias)}</p><strong class="account-amount">${money(a.available)}</strong><small>disponibles · ${money(a.reserved)} reservados</small><div class="account-actions">${button('deposit', 'Depositar', `data-id="${a.id}"`, 'ghost')}${button('freeze', a.frozen ? 'Descongelar' : 'Congelar', `data-id="${a.id}"`, 'ghost')}${button('close-account', 'Cerrar cuenta', `data-id="${a.id}"`, 'ghost')}</div></section>`).join('')}</div><div class="section-bar"><h2>Últimas transferencias</h2><a href="/transferencias" data-nav>Ver todas ↗</a></div>${transfers(3)}<section class="lab-banner"><div><p class="eyebrow">NO ES SOLO AUTOMATIZAR</p><h2>¿Qué podría salir mal?</h2><p>Probá límites, permisos, reintentos y fallos parciales.</p></div><a class="primary" href="/laboratorio" data-nav>Explorar misiones ↗</a></section>`;
}
function transfers(limit) {
  const items = state.data.transfers.slice(0, limit);
  if (!items.length)
    return '<div class="empty panel"><span aria-hidden="true">↗</span><h3>Todavía no hay transferencias</h3><p>Creá una operación para explorar sus estados y comprobar el historial.</p></div>';
  return `<div class="transfer-list">${items.map((t) => `<article class="panel transfer" aria-label="Transferencia ${escape(t.toAlias)} ${t.id}"><div><p class="eyebrow">${escape(t.toAlias)}</p><h3>${money(t.amount)} <span class="pill ${t.status}">${statusLabel[t.status]}</span></h3><p>Comisión ${money(t.fee)} · Total ${money(t.amount + t.fee)}</p><small class="mono">${t.id}</small>${t.reason ? `<p>${escape(t.reason)}</p>` : ''}</div><div class="actions">${t.status === 'pending' && t.userId === state.data.user.id ? button('settle', 'Procesar', `data-id="${t.id}"`, 'primary') + button('cancel-transfer', 'Cancelar', `data-id="${t.id}"`) : ''}<a href="/comprobantes/${t.id}" target="_blank" rel="noopener" class="text-link">Comprobante ↗</a></div></article>`).join('')}</div>`;
}
function beneficiaries() {
  return `<div class="two-column"><section class="panel"><h2>Agregar beneficiario</h2><form id="beneficiary-form">${field('Nombre del beneficiario', 'name', 'required maxlength="50"')}${field('Alias del beneficiario', 'alias', 'required', 'bruno.diaria')}<button class="primary">Guardar beneficiario</button></form><p class="subtle">Alias disponibles: ana.diaria, ana.ahorro, bruno.diaria. Usá Documentos para importar varios.</p></section><section class="panel"><h2>Tu orden de favoritos</h2><p>Arrastrá para ordenar o usá los botones de posición.</p><ol class="beneficiaries">${state.data.beneficiaries.map((b, i) => `<li draggable="true" data-beneficiary="${b.id}" aria-label="Beneficiario ${escape(b.name)}"><span aria-hidden="true">⠿</span><div><strong>${escape(b.name)}</strong><p class="mono">${escape(b.alias)}</p></div>${button('move-up', '↑', `data-id="${b.id}" aria-label="Subir ${escape(b.name)}" ${i === 0 ? 'disabled' : ''}`, 'ghost')}${button('move-down', '↓', `data-id="${b.id}" aria-label="Bajar ${escape(b.name)}" ${i === state.data.beneficiaries.length - 1 ? 'disabled' : ''}`, 'ghost')}</li>`).join('')}</ol>${!state.data.beneficiaries.length ? '<p class="empty">Tu agenda está vacía.</p>' : ''}</section></div>`;
}
function movements() {
  const matches = state.data.movements.filter(
    (m) =>
      (!state.type || m.type === state.type) &&
      `${m.alias} ${m.description}`
        .toLowerCase()
        .includes(state.filter.toLowerCase()),
  );
  return `<section class="panel"><div class="section-bar"><h2>Historial de movimientos</h2><a class="primary" href="/api/statement.csv" download>Descargar CSV</a></div><form id="filter-form" class="filters">${field('Buscar movimientos', 'search', 'placeholder="Alias o descripción"', state.filter)}<label>Tipo de movimiento<select name="type">${[
    ['', 'Todos'],
    ['deposit', 'Depósitos'],
    ['transfer', 'Transferencias'],
    ['opening', 'Aperturas'],
    ['closure', 'Cierres'],
  ]
    .map(
      ([id, text]) =>
        `<option value="${id}" ${state.type === id ? 'selected' : ''}>${text}</option>`,
    )
    .join(
      '',
    )}</select></label><button class="secondary">Aplicar filtros</button></form><p role="status">${matches.length} movimientos encontrados</p><div class="table-wrap"><table><caption class="sr-only">Movimientos bancarios ficticios</caption><thead><tr><th scope="col">Descripción</th><th scope="col">Cuenta</th><th scope="col">Fecha UTC</th><th scope="col">Importe</th></tr></thead><tbody>${matches
    .slice(0, state.limit)
    .map(
      (m) =>
        `<tr><td>${escape(m.description)}</td><td class="mono">${escape(m.alias)}</td><td>${new Date(m.createdAt).toISOString().slice(0, 16).replace('T', ' ')}</td><td class="${m.amount >= 0 ? 'positive' : 'negative'}">${money(m.amount)}</td></tr>`,
    )
    .join(
      '',
    )}</tbody></table></div>${!matches.length ? '<p class="empty">No hay movimientos para esos filtros.</p>' : ''}${matches.length > state.limit ? button('more', 'Cargar más movimientos') : ''}</section>`;
}
function documents() {
  return `<div class="two-column"><section class="panel"><h2>Importar beneficiarios</h2><p>CSV simple, máximo 50 KB y 20 filas. Si una fila falla, no se importa ninguna.</p><pre>nombre,alias\nBruno,bruno.diaria\nAhorro,ana.ahorro</pre><form id="import-form"><label>Archivo CSV ficticio<input name="file" type="file" accept=".csv,text/csv" required></label><button class="primary">Importar CSV</button></form><ul>${state.data.documents.map((d) => `<li>${escape(d.filename)} · ${d.rows} filas importadas</li>`).join('')}</ul><a href="/api/statement.csv" download>Descargar extracto de movimientos ↗</a></section><section class="panel"><h2>Proveedor de verificación</h2><p>Integración ficticia en iframe. No habilita permisos bancarios.</p><iframe src="/provider.html" title="Proveedor de verificación ficticio"></iframe><p id="provider-status" role="status">Esperando validación del proveedor.</p></section></div>`;
}
function laboratory() {
  return `<section class="lab-banner"><div><p class="eyebrow">NUEVO / INTEGRACIONES AVANZADAS</p><h2>Un mercado para romper la red</h2><p>HTTP, HAR, WebSockets y consulta offline. Tasas inventadas, pruebas reales.</p></div><a class="primary" href="/mercado/">Abrir mercado ficticio ↗</a></section><section class="panel lab-controls"><div><h2>Controlá las condiciones</h2><p>La hora del servidor se adelanta solo para esta práctica. El reloj del navegador es independiente.</p></div><div class="actions">${button('clock', 'Adelantar 2 minutos', 'data-minutes="2"')}${button('clock', 'Adelantar 1 día', 'data-minutes="1440"')}${button('fault', state.fault ? 'Fallo de procesamiento activado' : 'Simular fallo al procesar')}${button('location', 'Buscar sucursal ficticia')}${button('expire', 'Vencer mi sesión')}${button('reset', 'Reiniciar mi práctica', '', 'danger')}</div><p id="location-status" role="status">No se consultó tu ubicación. En las pruebas usá coordenadas ficticias.</p></section><div class="mission-grid">${scenes.map(([id, title, description, techniques, link]) => `<article class="panel mission"><span class="mission-number">${id}</span><h2>${title}</h2><p>${description}</p><p class="techniques">${techniques}</p><a href="${link}" target="_blank" rel="noopener">Documentación oficial ↗</a></article>`).join('')}</div>`;
}
async function loadReceipt(id) {
  try {
    const t = await api(`/api/transfers/${encodeURIComponent(id)}`);
    const el = $('#receipt');
    if (!el) return;
    el.innerHTML = `<p class="eyebrow">ATHENA BANK / COMPROBANTE FICTICIO</p><h2>${money(t.amount)}</h2><dl><dt>Estado</dt><dd>${statusLabel[t.status]}</dd><dt>Destino</dt><dd>${escape(t.toAlias)}</dd><dt>Comisión</dt><dd>${money(t.fee)}</dd><dt>Referencia</dt><dd class="mono">${t.id}</dd><dt>Concepto</dt><dd>${escape(t.note || 'Sin concepto')}</dd></dl><p>Una operación pendiente no acredita dinero. Sin validez bancaria.</p>`;
    el.removeAttribute('aria-busy');
  } catch (error) {
    notify(error.message, true);
  }
}
function transferForm(draft) {
  if (!state.data.accounts.length)
    return notify('Primero creá una cuenta.', true);
  modal(
    'Nueva transferencia',
    `<form id="transfer-form"><label>Cuenta de origen<select name="from">${accountOptions()}</select></label>${field('Alias de destino', 'toAlias', 'required list="aliases"', 'bruno.diaria')}<datalist id="aliases">${state.data.beneficiaries.map((b) => `<option value="${escape(b.alias)}">${escape(b.name)}</option>`).join('')}</datalist>${field('Importe a transferir', 'amount', 'type="number" step="0.01" min="0.01" required')}${field('Concepto', 'note', 'maxlength="120"')}<p>La cotización dura 90 segundos. El servidor valida saldo, estado y límite al confirmar.</p><button class="primary">Revisar transferencia</button></form>`,
  );
  if (draft) {
    for (const name of ['from', 'toAlias', 'amount', 'note']) {
      $('#transfer-form').elements[name].value = draft[name] || '';
    }
    notify(
      'Borrador recuperado. Revisá los datos y volvé a cotizar. No se envió ninguna operación.',
    );
  }
}
function quoteModal(q) {
  state.quote = q;
  state.quote.key = crypto.randomUUID();
  closeModal();
  modal(
    'Confirmar transferencia',
    `<form id="confirm-form"><p>Destino <strong>${escape(q.toAlias)}</strong></p><dl><dt>Importe</dt><dd>${money(q.amount)}</dd><dt>Comisión</dt><dd>${money(q.fee)}</dd><dt>Total a reservar</dt><dd>${money(q.amount + q.fee)}</dd></dl><p id="quote-time" role="status"></p>${field('Código de confirmación ficticio', 'otp', 'required inputmode="numeric" pattern="[0-9]{6}" aria-describedby="otp-help"')}<p id="otp-help">Para esta práctica usá <code>246810</code>. Nunca se envían SMS.</p><button class="primary" id="confirm-transfer">Confirmar y reservar</button></form>`,
  );
  const seconds = Math.max(0, Math.ceil((q.expiresAt - q.quotedAt) / 1000));
  const deadline = Date.now() + seconds * 1000;
  const tick = () => {
    const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    if ($('#quote-time'))
      $('#quote-time').textContent = remaining
        ? `La cotización vence en ${remaining} segundos`
        : 'Cotización vencida. Cerrá el diálogo y volvé a cotizar.';
    if ($('#confirm-transfer')) $('#confirm-transfer').disabled = !remaining;
  };
  tick();
  state.timer = setInterval(tick, 1000);
}
async function reorder(ids) {
  await api('/api/beneficiaries/order', { method: 'PUT', body: { ids } });
  await refresh();
  notify('Orden de beneficiarios actualizado.');
}
function bindDrag() {
  let source;
  document.querySelectorAll('[data-beneficiary]').forEach((el) => {
    el.addEventListener('dragstart', (event) => {
      source = el.dataset.beneficiary;
      event.dataTransfer.setData('text/plain', source);
    });
    el.addEventListener('dragover', (event) => event.preventDefault());
    el.addEventListener('drop', (event) => {
      event.preventDefault();
      const ids = state.data.beneficiaries.map((b) => b.id);
      const from = ids.indexOf(source);
      const to = ids.indexOf(el.dataset.beneficiary);
      if (from < 0 || to < 0 || from === to) return;
      ids.splice(to, 0, ids.splice(from, 1)[0]);
      void run(() => reorder(ids));
    });
  });
}
document.addEventListener('click', (event) => {
  const link = event.target.closest('[data-nav]');
  if (link && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    history.pushState({}, '', link.getAttribute('href'));
    render();
    $('#main').setAttribute('tabindex', '-1');
    $('#main').focus();
    return;
  }
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  const id = target.dataset.id;
  if (['transfer', 'register', 'account', 'deposit'].includes(action))
    state.returnFocus = target;
  if (action === 'close') {
    state.draft = null;
    return closeModal();
  }
  if (action === 'transfer') return transferForm();
  if (action === 'register')
    return modal(
      'Crear usuario ficticio',
      `<form id="register-form">${field('Nombre ficticio', 'name', 'required maxlength="60"')}${field('Email ficticio nuevo', 'email', 'type="email" required')}${field('Contraseña nueva de práctica', 'password', 'type="password" required minlength="10" maxlength="100"')}<p>No uses credenciales reales.</p><button class="primary">Crear usuario</button></form>`,
    );
  if (action === 'account')
    return modal(
      'Crear cuenta',
      `<form id="account-form">${field('Nombre de la cuenta', 'name', 'required maxlength="40"')}${field('Alias de la cuenta', 'alias', 'required pattern="[a-z0-9.]{5,30}"')}<label>Tipo de cuenta<select name="type"><option value="checking">Corriente</option><option value="savings">Ahorro</option></select></label><p>La cuenta comienza con saldo cero. Máximo cuatro cuentas activas.</p><button class="primary">Crear cuenta</button></form>`,
    );
  if (action === 'deposit')
    return modal(
      'Ingresar fondos ficticios',
      `<form id="deposit-form"><label>Cuenta para depósito<select name="accountId">${accountOptions(id)}</select></label>${field('Importe a depositar', 'amount', 'type="number" min="0.01" step="0.01" required')}<button class="primary">Depositar fondos</button></form>`,
    );
  if (action === 'more') {
    state.limit += 5;
    render();
    return;
  }
  if (action === 'fault') {
    state.fault = !state.fault;
    render();
    notify(
      state.fault
        ? 'El próximo procesamiento se revertirá para practicar recuperación.'
        : 'Fallo simulado desactivado.',
    );
    return;
  }
  if (action === 'location') {
    if (!navigator.geolocation)
      return notify('Este navegador no ofrece geolocalización.', true);
    navigator.geolocation.getCurrentPosition(
      () => {
        $('#location-status').textContent =
          'Ubicación recibida. Sucursal ficticia Centro disponible; no guardamos coordenadas.';
      },
      () => {
        $('#location-status').textContent =
          'Permiso denegado o ubicación no disponible. Podés elegir la sucursal ficticia Centro manualmente.';
      },
    );
    return;
  }
  void run(async () => {
    if (action === 'logout') {
      await api('/api/auth/logout', { method: 'POST' });
      broadcastAuth('logout');
      history.pushState({}, '', '/');
      loseSession();
      return;
    }
    if (action === 'expire') {
      await api('/api/lab/session/expire', { method: 'POST' });
      await refresh();
      return;
    }
    if (action === 'new-lab') {
      state.lab = null;
      render();
      return;
    }
    if (action === 'reset') {
      if (
        !confirm(
          '¿Eliminar los datos ficticios de esta práctica? No afecta a otros laboratorios.',
        )
      )
        return;
      await api('/api/lab', { method: 'DELETE' });
      broadcastAuth('reset');
      state.draft = null;
      state.data = null;
      state.lab = null;
      state.fault = false;
      history.pushState({}, '', '/');
      render();
      notify('Tu práctica fue eliminada. Podés iniciar otra.');
      return;
    }
    if (action === 'freeze') {
      const a = state.data.accounts.find((a) => a.id === id);
      await api(`/api/accounts/${id}/freeze`, {
        method: 'PUT',
        body: { frozen: !a.frozen },
      });
    }
    if (action === 'close-account') {
      if (!confirm('¿Cerrar esta cuenta ficticia? Debe tener saldo cero.'))
        return;
      await api(`/api/accounts/${id}`, { method: 'DELETE' });
    }
    if (action === 'settle') {
      const fault = state.fault;
      state.fault = false;
      await api(`/api/transfers/${id}/settle`, {
        method: 'POST',
        body: { simulateFailure: fault },
      });
    }
    if (action === 'cancel-transfer') {
      if (
        !confirm('¿Cancelar la transferencia pendiente y liberar la reserva?')
      )
        return;
      await api(`/api/transfers/${id}/cancel`, { method: 'POST' });
    }
    if (action === 'clock')
      await api('/api/lab/clock', {
        method: 'POST',
        body: { minutes: Number(target.dataset.minutes) },
      });
    if (action === 'move-up' || action === 'move-down') {
      const ids = state.data.beneficiaries.map((b) => b.id);
      const index = ids.indexOf(id);
      const next = index + (action === 'move-up' ? -1 : 1);
      if (next < 0 || next >= ids.length) return;
      [ids[index], ids[next]] = [ids[next], ids[index]];
      return reorder(ids);
    }
    await refresh();
    notify('Operación realizada. Revisá el estado y los saldos.');
  });
});
document.addEventListener('submit', (event) => {
  const form = event.target;
  event.preventDefault();
  const values = Object.fromEntries(new FormData(form));
  if (form.id === 'filter-form') {
    state.filter = values.search;
    state.type = values.type;
    state.limit = 5;
    render();
    return;
  }
  void run(async () => {
    if (form.id === 'start-form') {
      state.lab = await api('/api/labs', { method: 'POST', body: values });
      state.draft = null;
      state.data = null;
      render();
      return;
    }
    if (form.id === 'login-form' || form.id === 'register-form') {
      await api(
        `/api/auth/${form.id === 'login-form' ? 'login' : 'register'}`,
        { method: 'POST', body: values },
      );
      closeModal();
      history.replaceState({}, '', '/');
      await refresh();
      broadcastAuth('login');
      const draft = state.draft;
      state.draft = null;
      if (
        draft &&
        draft.userId === state.data?.user.id &&
        draft.labId === state.lab.id
      )
        transferForm(draft.values);
      return;
    }
    if (form.id === 'transfer-form') {
      // Memory only: no password, OTP, quote ID or idempotency key is persisted.
      state.draft = { userId: state.data.user.id, labId: state.lab.id, values };
      const q = await api('/api/quotes', {
        method: 'POST',
        body: { ...values, amount: amount(values.amount) },
      });
      quoteModal(q);
      return;
    }
    if (form.id === 'confirm-form') {
      await api('/api/transfers', {
        method: 'POST',
        headers: { 'Idempotency-Key': state.quote.key },
        body: { quoteId: state.quote.id, otp: values.otp },
      });
      state.draft = null;
      closeModal();
      history.pushState({}, '', '/transferencias');
      await refresh();
      notify('Transferencia pendiente: el saldo quedó reservado.');
      return;
    }
    if (form.id === 'deposit-form')
      await api(`/api/accounts/${values.accountId}/deposit`, {
        method: 'POST',
        body: { amount: amount(values.amount) },
      });
    if (form.id === 'account-form')
      await api('/api/accounts', { method: 'POST', body: values });
    if (form.id === 'beneficiary-form')
      await api('/api/beneficiaries', { method: 'POST', body: values });
    if (form.id === 'import-form') {
      const file = values.file;
      if (!file || file.size > 50000)
        throw new Error('Archivo requerido, de hasta 50 KB.');
      await api('/api/documents/import', {
        method: 'POST',
        body: { filename: file.name, content: await file.text() },
      });
    }
    closeModal();
    await refresh();
    notify('Operación completada.');
  });
});
window.addEventListener('popstate', render);
window.addEventListener('offline', () => {
  $('#offline').hidden = false;
});
window.addEventListener('online', () => {
  $('#offline').hidden = true;
});
window.addEventListener('message', (event) => {
  if (
    event.origin === location.origin &&
    event.source === document.querySelector('iframe')?.contentWindow &&
    event.data?.type === 'athena-verification'
  )
    $('#provider-status').textContent =
      'Proveedor validado: integración simulada correcta.';
});
// A close event can arrive after the same dialog has reopened for the next step.
$('#modal').addEventListener('cancel', () => {
  state.draft = null;
});
$('#modal').addEventListener('close', () => {
  if (!$('#modal').open) {
    clearInterval(state.timer);
    if (state.returnFocus?.isConnected)
      state.returnFocus.focus({ preventScroll: true });
  }
});
customElements.define(
  'lab-help',
  class extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) return;
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML =
        '<link rel="stylesheet" href="/style.css"><button class="ghost" aria-expanded="false">Ayuda de práctica</button><span hidden>Localizá este botón por su rol: Playwright atraviesa Shadow DOM abierto.</span>';
      root.querySelector('button').onclick = () => {
        const span = root.querySelector('span');
        span.hidden = !span.hidden;
        root
          .querySelector('button')
          .setAttribute('aria-expanded', String(!span.hidden));
      };
    }
  },
);
async function boot() {
  try {
    state.lab = await api('/api/lab');
    try {
      state.data = await api('/api/overview');
    } catch (error) {
      if (error.status !== 401) throw error;
    }
  } catch (error) {
    if (error.code !== 'LAB_REQUIRED') notify(error.message, true);
  }
  render();
}
void boot();
