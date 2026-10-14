const fs = require('node:fs');
const path = require('node:path');
const { crc32 } = require('node:zlib');
const root = path.join(__dirname, '..');
const template = path.join(root, 'course/automation');
const output = path.join(root, 'lab/public/lessons/pending-transfer');
// Explicit list: never package credentials, git history, reports or node_modules.
const names = ['package.json', 'package-lock.json', 'playwright.config.js', '.gitignore',
  'README.md', 'tests/smoke.spec.js', 'tests/pending-lesson.spec.js'];

// Deterministic, uncompressed ZIP32. Only these small UTF-8 course files are accepted.
function zip(entries) {
  const local = [], central = [];
  let offset = 0;
  for (const [name, bytes] of entries) {
    const filename = Buffer.from(name);
    const crc = crc32(bytes);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x800, 6);
    header.writeUInt16LE(0x21, 12); // 1980-01-01, fixed for reproducible archives.
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(bytes.length, 18);
    header.writeUInt32LE(bytes.length, 22);
    header.writeUInt16LE(filename.length, 26);
    const directory = Buffer.alloc(46);
    directory.writeUInt32LE(0x02014b50);
    directory.writeUInt16LE(20, 4);
    header.copy(directory, 6, 4, 28);
    directory.writeUInt32LE(offset, 42);
    local.push(header, filename, bytes);
    central.push(directory, filename);
    offset += header.length + filename.length + bytes.length;
  }
  const listing = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(listing.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, listing, end]);
}

function buildMaterials() {
  fs.mkdirSync(output, { recursive: true });
  for (const checkpoint of ['inicio', 'solucion']) {
    const entries = names.map(name => [name, Buffer.from(fs.readFileSync(
      checkpoint === 'solucion' && name === 'tests/pending-lesson.spec.js'
        ? path.join(root, 'lab/e2e/pending-lesson.spec.js') : path.join(template, name), 'utf8').replaceAll('\r\n', '\n'))]);
    fs.writeFileSync(path.join(output, `athena-automation-${checkpoint}.zip`), zip(entries));
  }
  const firstOutput = path.join(root, 'lab/public/lessons/first-test');
  fs.mkdirSync(firstOutput, { recursive: true });
  const normalized = file => Buffer.from(fs.readFileSync(file, 'utf8').replaceAll('\r\n', '\n'));
  for (const checkpoint of ['inicio', 'solucion']) {
    const entries = names.filter(name => !['README.md', 'tests/pending-lesson.spec.js'].includes(name))
      .map(name => [name, normalized(path.join(template, name))]);
    entries.push(['README.md', normalized(path.join(root, 'course/first-test/README.md'))]);
    entries.push(['tests/first-test.spec.js', normalized(path.join(root, checkpoint === 'inicio'
      ? 'course/first-test/first-test.spec.js' : 'lab/e2e/first-test.spec.js'))]);
    if (checkpoint === 'solucion') entries.push(['tests/first-test-challenge.spec.js', normalized(path.join(root, 'lab/e2e/first-test-challenge.spec.js'))]);
    fs.writeFileSync(path.join(firstOutput, `clase-01-${checkpoint}.zip`), zip(entries));
  }
  const practiceOutput = path.join(root, 'lab/public/lessons/create-practice');
  fs.mkdirSync(practiceOutput, { recursive: true });
  for (const checkpoint of ['inicio', 'solucion']) {
    const entries = names.filter(name => !['README.md', 'tests/pending-lesson.spec.js'].includes(name))
      .map(name => [name, normalized(path.join(template, name))]);
    entries.push(['README.md', normalized(path.join(root, 'course/create-practice/README.md'))]);
    // Cumulative checkpoints retain the previous class and its challenge, both solved.
    for (const name of ['first-test.spec.js', 'first-test-challenge.spec.js']) {
      entries.push([`tests/${name}`, normalized(path.join(root, 'lab/e2e', name))]);
    }
    entries.push(['tests/create-practice.spec.js', normalized(path.join(root, checkpoint === 'inicio'
      ? 'course/create-practice/create-practice.spec.js' : 'lab/e2e/create-practice.spec.js'))]);
    if (checkpoint === 'solucion') entries.push(['tests/create-practice-challenge.spec.js', normalized(path.join(root, 'lab/e2e/create-practice-challenge.spec.js'))]);
    fs.writeFileSync(path.join(practiceOutput, `clase-02-${checkpoint}.zip`), zip(entries));
  }
  const depositOutput = path.join(root, 'lab/public/lessons/account-deposit');
  fs.mkdirSync(depositOutput, { recursive: true });
  for (const checkpoint of ['inicio', 'solucion']) {
    const entries = names.filter(name => !['README.md', 'tests/pending-lesson.spec.js'].includes(name))
      .map(name => [name, normalized(path.join(template, name))]);
    entries.push(['README.md', normalized(path.join(root, 'course/account-deposit/README.md'))]);
    for (const name of ['first-test.spec.js', 'first-test-challenge.spec.js',
      'create-practice.spec.js', 'create-practice-challenge.spec.js']) {
      entries.push([`tests/${name}`, normalized(path.join(root, 'lab/e2e', name))]);
    }
    entries.push(['tests/account-deposit.spec.js', normalized(path.join(root, checkpoint === 'inicio'
      ? 'course/account-deposit/account-deposit.spec.js' : 'lab/e2e/account-deposit.spec.js'))]);
    if (checkpoint === 'solucion') entries.push(['tests/account-deposit-challenge.spec.js', normalized(path.join(root, 'lab/e2e/account-deposit-challenge.spec.js'))]);
    fs.writeFileSync(path.join(depositOutput, `clase-03-${checkpoint}.zip`), zip(entries));
  }
  const previous = ['first-test', 'create-practice', 'account-deposit'];
  for (const [number, lesson] of [['04', 'invalid-deposit'], ['05', 'transfer-quote'], ['06', 'confirm-transfer']]) {
    const lessonOutput = path.join(root, 'lab/public/lessons', lesson);
    fs.mkdirSync(lessonOutput, { recursive: true });
    for (const checkpoint of ['inicio', 'solucion']) {
      const entries = names.filter(name => !['README.md', 'tests/pending-lesson.spec.js'].includes(name))
        .map(name => [name, normalized(path.join(template, name))]);
      entries.push(['README.md', normalized(path.join(root, 'course', lesson, 'README.md'))]);
      for (const earlier of previous) {
        for (const suffix of ['.spec.js', '-challenge.spec.js']) {
          const name = earlier + suffix;
          entries.push([`tests/${name}`, normalized(path.join(root, 'lab/e2e', name))]);
        }
      }
      entries.push([`tests/${lesson}.spec.js`, normalized(path.join(root, checkpoint === 'inicio'
        ? `course/${lesson}/${lesson}.spec.js` : `lab/e2e/${lesson}.spec.js`))]);
      if (checkpoint === 'solucion') entries.push([`tests/${lesson}-challenge.spec.js`,
        normalized(path.join(root, 'lab/e2e', `${lesson}-challenge.spec.js`))]);
      fs.writeFileSync(path.join(lessonOutput, `clase-${number}-${checkpoint}.zip`), zip(entries));
    }
    previous.push(lesson);
  }
}

if (require.main === module) {
  buildMaterials();
  console.log('Built inicio and solucion from the template and the tested reference.');
}
module.exports = { buildMaterials, zip, names };
