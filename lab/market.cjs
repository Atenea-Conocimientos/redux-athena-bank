const { WebSocketServer } = require('ws');

// Deliberately synthetic: no external feeds, credentials, or actual trading.
function rates(sequence = 0) {
  const asOf = Date.now();
  return {
    fictional: true,
    base: 'ARS',
    sequence,
    asOf,
    expiresAt: asOf + 90000,
    rates: { USD: 1000 + (sequence % 10), EUR: 1200 + (sequence % 10) },
  };
}

function attachMarket(server) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 1024 });
  server.on('upgrade', (req, socket, head) => {
    socket.on('error', () => {});
    // This feed is PUBLIC synthetic data; it must never carry bank/customer data.
    if (
      req.url !== '/ws/market' ||
      !/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host || '') ||
      req.headers.origin !== `http://${req.headers.host}` ||
      wss.clients.size >= 64
    ) {
      socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      let sequence = 0;
      ws.on('error', () => {});
      const emit = () =>
        ws.send(JSON.stringify({ type: 'rates', ...rates(sequence) }));
      emit();
      ws.on('message', (message, binary) => {
        if (binary) return ws.close(1003, 'Solo texto');
        if (message.toString() === 'next') {
          sequence++;
          emit();
        } else if (message.toString() === 'disconnect') {
          ws.close(1012, 'Corte simulado');
        } else {
          ws.send(
            JSON.stringify({ type: 'error', message: 'Comando desconocido' }),
          );
        }
      });
    });
  });
  // HTTP close does not automatically close upgraded connections.
  const close = server.close.bind(server);
  server.close = (callback) => {
    for (const client of wss.clients) client.terminate();
    wss.close();
    return close(callback);
  };
}

module.exports = { rates, attachMarket };
