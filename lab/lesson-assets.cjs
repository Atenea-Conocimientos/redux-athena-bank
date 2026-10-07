const fs = require('node:fs');
const path = require('node:path');

const prefix = '/lessons/pending-transfer/';
const files = new Set([
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
]);
const types = {
  '.png': 'image/png',
  '.mp3': 'audio/mpeg',
  '.json': 'application/json; charset=utf-8',
  '.vtt': 'text/vtt; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

function serveLessonAsset(req, res, route) {
  if (!route.startsWith(prefix)) return false;
  const name = route.slice(prefix.length);
  const file = path.join(__dirname, 'public/lessons/pending-transfer', name);
  if (!files.has(name) || !fs.existsSync(file)) {
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
  if (name === 'pending-lesson.spec.js')
    headers['Content-Disposition'] =
      'attachment; filename="pending-lesson.spec.js"';
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
