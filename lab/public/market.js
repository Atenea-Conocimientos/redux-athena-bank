const el = (id) => document.getElementById(id);
let current = null;
let cached = false;
let socket = null;

function validRates(data) {
  return (
    data?.fictional === true &&
    data.base === 'ARS' &&
    Number.isFinite(data.asOf) &&
    Number.isFinite(data.expiresAt) &&
    data.expiresAt > data.asOf &&
    Number.isInteger(data.sequence) &&
    data.sequence >= 0 &&
    ['USD', 'EUR'].every(
      (code) => Number.isFinite(data.rates?.[code]) && data.rates[code] > 0,
    )
  );
}
const format = (value) =>
  new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(value);
function paintRate() {
  if (!current) return;
  const code = el('currency').value;
  el('rate-value').textContent =
    `1 ${code} = ${format(current.rates[code])} ARS`;
  const stale = cached || !navigator.onLine || Date.now() >= current.expiresAt;
  el('rate-status').textContent = stale
    ? 'Datos desactualizados · solo referencia'
    : 'Tasa vigente · ficticia';
  el('rate-time').textContent =
    `Consulta: ${new Date(current.asOf).toISOString()} · validez: 90 segundos`;
  el('copy-rate').disabled = false;
}
async function loadRates() {
  el('refresh-rates').disabled = true;
  el('rate-status').textContent = 'Cargando tasas…';
  try {
    // No bank cookies in HAR recordings or the public cache.
    const response = await fetch('/api/market/rates', { credentials: 'omit' });
    if (!response.ok)
      throw new Error('Proveedor no disponible. Volvé a intentar.');
    const data = await response.json();
    if (!validRates(data)) throw new Error('Respuesta inválida del proveedor.');
    current = data;
    cached = response.headers.get('X-Lab-Cache') === 'stale';
    paintRate();
  } catch (error) {
    // Do not leave an old figure looking valid after a failed refresh.
    current = null;
    el('rate-value').textContent = '—';
    el('rate-time').textContent = '';
    el('copy-rate').disabled = true;
    el('rate-status').textContent =
      error.message || 'No se pudo consultar el proveedor.';
  } finally {
    el('refresh-rates').disabled = false;
  }
}
function networkState() {
  el('network').textContent = navigator.onLine
    ? 'Con conexión · datos de práctica'
    : 'Sin conexión · solo consulta, sin operaciones';
  paintRate();
}
el('refresh-rates').onclick = loadRates;
el('currency').onchange = paintRate;
el('copy-rate').onclick = async () => {
  try {
    await navigator.clipboard.writeText(
      `${el('rate-value').textContent} (ficticia)`,
    );
    el('copy-status').textContent = 'Cotización copiada.';
  } catch {
    el('copy-status').textContent =
      'No se pudo copiar. Podés seleccionar el texto manualmente.';
  }
};
el('connect-stream').onclick = () => {
  if (socket && socket.readyState < WebSocket.CLOSING) return;
  el('connect-stream').disabled = true;
  el('stream-status').textContent = 'Conectando…';
  el('stream-value').textContent = '—';
  el('stream-sequence').textContent = 'Sin eventos recibidos.';
  socket = new WebSocket(
    `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws/market`,
  );
  socket.onopen = () => {
    el('stream-status').textContent = 'Conectado · esperando datos';
    el('next-rate').disabled = el('cut-stream').disabled = false;
  };
  socket.onmessage = (event) => {
    let data;
    try {
      data = JSON.parse(event.data);
    } catch {
      /* rejected below */
    }
    if (data?.type !== 'rates' || !validRates(data)) {
      el('stream-status').textContent =
        'Evento inválido · última tasa sin actualizar';
      return;
    }
    el('stream-value').textContent = `1 USD = ${format(data.rates.USD)} ARS`;
    el('stream-sequence').textContent = `Evento #${data.sequence}`;
    el('stream-status').textContent = 'Conectado · datos ficticios';
  };
  socket.onerror = () => {
    el('stream-status').textContent = 'No se pudo conectar al canal.';
  };
  socket.onclose = () => {
    el('stream-status').textContent =
      'Desconectado · última tasa desactualizada';
    el('connect-stream').textContent = 'Reconectar';
    el('connect-stream').disabled = false;
    el('next-rate').disabled = el('cut-stream').disabled = true;
  };
};
el('next-rate').onclick = () => {
  if (socket?.readyState === WebSocket.OPEN) socket.send('next');
};
el('cut-stream').onclick = () => {
  if (socket?.readyState === WebSocket.OPEN) socket.send('disconnect');
};
addEventListener('pagehide', () => socket?.close());

el('enable-cache').onclick = async () => {
  el('enable-cache').disabled = true;
  try {
    if (!('serviceWorker' in navigator)) throw new Error();
    await navigator.serviceWorker.register('/mercado/sw.js', {
      scope: '/mercado/',
    });
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', resolve, {
          once: true,
        }),
      );
    }
    await loadRates();
    el('cache-status').textContent =
      'Consulta offline preparada · solo información pública.';
  } catch {
    el('cache-status').textContent =
      'No se pudo preparar la consulta offline en este navegador.';
  } finally {
    el('enable-cache').disabled = false;
  }
};
el('clear-cache').onclick = async () => {
  try {
    const registration =
      await navigator.serviceWorker?.getRegistration('/mercado/');
    // Never unregister another application's worker on the same origin.
    if (registration?.scope === new URL('/mercado/', location.origin).href)
      await registration.unregister();
    for (const name of await caches.keys())
      if (name.startsWith('athena-market-')) await caches.delete(name);
    // A controlling worker survives unregister until its clients unload.
    location.reload();
  } catch {
    el('cache-status').textContent =
      'No se pudo borrar la caché. Revisá los permisos del navegador.';
  }
};
if (
  navigator.serviceWorker?.controller?.scriptURL ===
  new URL('/mercado/sw.js', location.origin).href
) {
  el('cache-status').textContent =
    'Consulta offline preparada · solo información pública.';
}
addEventListener('offline', networkState);
addEventListener('online', networkState);
setInterval(paintRate, 1000);
networkState();
void loadRates();
