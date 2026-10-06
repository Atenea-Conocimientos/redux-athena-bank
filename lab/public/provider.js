document.querySelector('#verification').addEventListener('submit', (event) => {
  event.preventDefault();
  if (new FormData(event.target).get('code') !== '135790') return;
  document.querySelector('#result').textContent =
    'Verificación simulada completada';
  window.parent.postMessage(
    { type: 'athena-verification', verified: true },
    window.location.origin,
  );
});
