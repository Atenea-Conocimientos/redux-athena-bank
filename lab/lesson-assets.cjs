const fs = require('node:fs');
const path = require('node:path');

const lessonFiles = {
  'pending-transfer': new Set([
  'before.png',
  'quote.png',
  'pending.png',
  'ana.png',
  'bruno.png',
  'narration.mp3',
  'lesson.json',
  'code.json',
  'evidence.json',
  'subtitles.vtt',
  'pending-lesson.spec.js',
  'athena-automation-inicio.zip',
  'athena-automation-solucion.zip',
  ]),
  'first-test': new Set(['welcome.png', 'narration.mp3', 'lesson.json', 'code.json',
    'evidence.json', 'subtitles.vtt', 'failure.txt', 'first-test.spec.js',
    'first-test-challenge.spec.js', 'clase-01-inicio.zip', 'clase-01-solucion.zip']),
  'create-practice': new Set(['welcome.png', 'login.png', 'dashboard.png', 'denied.png',
    'narration.mp3', 'lesson.json', 'code.json', 'evidence.json', 'subtitles.vtt',
    'create-practice.spec.js', 'create-practice-challenge.spec.js',
    'clase-02-inicio.zip', 'clase-02-solucion.zip']),
  'account-deposit': new Set(['before.png', 'form.png', 'after.png', 'challenge.png',
    'narration.mp3', 'lesson.json', 'code.json', 'evidence.json', 'subtitles.vtt',
    'account-deposit.spec.js', 'account-deposit-challenge.spec.js',
    'clase-03-inicio.zip', 'clase-03-solucion.zip']),
  'invalid-deposit': new Set(['before.png', 'empty.png', 'error.png', 'challenge.png',
    'narration.mp3', 'lesson.json', 'code.json', 'evidence.json', 'subtitles.vtt',
    'invalid-deposit.spec.js', 'invalid-deposit-challenge.spec.js',
    'clase-04-inicio.zip', 'clase-04-solucion.zip']),
  'transfer-quote': new Set(['before.png', 'form.png', 'quote.png', 'after.png', 'challenge.png',
    'narration.mp3', 'lesson.json', 'code.json', 'evidence.json', 'subtitles.vtt',
    'transfer-quote.spec.js', 'transfer-quote-challenge.spec.js',
    'clase-05-inicio.zip', 'clase-05-solucion.zip']),
  'confirm-transfer': new Set(['quote.png', 'pending.png', 'balances.png', 'rejected.png',
    'narration.mp3', 'lesson.json', 'code.json', 'evidence.json', 'subtitles.vtt',
    'confirm-transfer.spec.js', 'confirm-transfer-challenge.spec.js',
    'clase-06-inicio.zip', 'clase-06-solucion.zip']),
};
const types = {
  '.png': 'image/png',
  '.mp3': 'audio/mpeg',
  '.json': 'application/json; charset=utf-8',
  '.vtt': 'text/vtt; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.zip': 'application/zip',
  '.txt': 'text/plain; charset=utf-8',
};

function serveLessonAsset(req, res, route) {
  if (!route.startsWith('/lessons/')) return false;
  const match = /^\/lessons\/([^/]+)\/([^/]+)$/.exec(route);
  const [, lesson, name] = match || [];
  const allowed = Object.hasOwn(lessonFiles, lesson) && lessonFiles[lesson].has(name);
  const file = allowed ? path.join(__dirname, 'public/lessons', lesson, name) : null;
  if (!allowed || !fs.existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Recurso de la lección no encontrado.');
    return true;
  }
  const content = fs.readFileSync(file);
  const headers = {
    'Content-Type': types[path.extname(name)],
    'Cache-Control': 'no-cache',
    'Content-Length': content.length,
  };
  if (name.endsWith('.spec.js') || name.endsWith('.zip'))
    headers['Content-Disposition'] =
      `attachment; filename="${name}"`;
  // Byte ranges allow seeking without re-downloading or relying on browser heuristics.
  if (name.endsWith('.mp3')) {
    headers['Accept-Ranges'] = 'bytes';
    if (req.method === 'GET' && req.headers.range) {
      const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      let start = 0;
      let end = content.length - 1;
      if (range) {
        if (range[1]) {
          start = Number(range[1]);
          if (range[2]) end = Math.min(Number(range[2]), end);
        } else if (range[2])
          start = Math.max(0, content.length - Number(range[2]));
      }
      if (
        !range ||
        (!range[1] && !range[2]) ||
        !Number.isSafeInteger(start) ||
        !Number.isSafeInteger(end) ||
        start > end ||
        start >= content.length
      ) {
        res.writeHead(416, { 'Content-Range': `bytes */${content.length}` });
        res.end();
        return true;
      }
      res.writeHead(206, {
        ...headers,
        'Content-Range': `bytes ${start}-${end}/${content.length}`,
        'Content-Length': end - start + 1,
      });
      res.end(content.subarray(start, end + 1));
      return true;
    }
  }
  res.writeHead(200, headers);
  res.end(req.method === 'HEAD' ? undefined : content);
  return true;
}

module.exports = { serveLessonAsset };
