const $ = (selector) => document.querySelector(selector);
const base = '/lessons/pending-transfer/';
const audio = $('#narration');
const time = (seconds) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
let lesson;
let snippets;
let active = -1;
let silentPosition = 0;
let audioFailed = false;
let captions = true;
let activeCue = null;

function updateTransport() {
  // A seek from the end can briefly retain `ended` in WebKit's play event.
  $('#play').textContent = !audio.paused
    ? 'Ⅱ Pausar'
    : audio.ended
      ? '↻ Repetir'
      : '▶ Reproducir';
}

function setView(view) {
  $('#screen-view').hidden = view !== 'screen';
  $('#code-view').hidden = view !== 'code';
  $('#view-screen').setAttribute('aria-pressed', String(view === 'screen'));
  $('#view-code').setAttribute('aria-pressed', String(view === 'code'));
  $('#frame-label').textContent =
    view === 'code'
      ? 'playwright / fragmento verificado'
      : 'athena bank / práctica aislada';
}

function draw(position = audioFailed ? silentPosition : audio.currentTime) {
  if (!lesson) return;
  updateTransport();
  const current = Math.max(0, Math.min(position, lesson.duration));
  // Media engines round seek positions differently. Allow 10ms at cue boundaries.
  const cueTime = current + 0.01;
  const index = lesson.scenes.findLastIndex((scene) => scene.start <= cueTime);
  const scene = lesson.scenes[index];
  if (index !== active) {
    active = index;
    $('#scene-counter').textContent =
      `${String(index + 1).padStart(2, '0')} / ${String(lesson.scenes.length).padStart(2, '0')}`;
    $('#scene-title').textContent = scene.title;
    $('#scene-image').src = base + scene.image;
    $('#scene-image').alt = scene.alt;
    $('#takeaway').textContent = scene.takeaway;
    for (const [i, button] of [
      ...$('#chapters').querySelectorAll('button'),
    ].entries()) {
      if (i === index) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    }
    $('#code').replaceChildren(
      ...snippets[scene.code].split('\n').map((line, lineIndex) => {
        const row = document.createElement('span');
        row.className = `code-line${scene.focus.includes(lineIndex + 1) ? ' active' : ''}`;
        const number = document.createElement('span');
        number.className = 'line-number';
        number.setAttribute('aria-hidden', 'true');
        number.textContent = String(lineIndex + 1).padStart(2, '0');
        row.append(number, document.createTextNode(line));
        return row;
      }),
    );
  }
  const subtitle = lesson.subtitles.find(
    (cue) => cueTime >= cue.start && cueTime < cue.end,
  );
  if (subtitle && subtitle !== activeCue) {
    activeCue = subtitle;
    setView(subtitle.view || 'screen');
  }
  $('#caption').textContent =
    subtitle?.text ||
    'Lección terminada. Respondé la pregunta y llevá la prueba al laboratorio.';
  $('#seek').value = String(current);
  $('#seek').setAttribute(
    'aria-valuetext',
    `${time(current)} de ${time(lesson.duration)}`,
  );
  $('#time').textContent = `${time(current)} / ${time(lesson.duration)}`;
}

function seek(position) {
  const target = Math.max(0, Math.min(position, lesson.duration));
  silentPosition = target;
  if (!audioFailed) audio.currentTime = target;
  draw(target);
}

function unavailable() {
  silentPosition = audio.currentTime || silentPosition;
  audioFailed = true;
  audio.pause();
  $('#play').disabled = true;
  $('#mute').disabled = true;
  $('#speed').disabled = true;
  $('#load-status').hidden = false;
  $('#load-status').textContent =
    'No se pudo cargar la voz. Podés recorrer los capítulos, leer los subtítulos y consultar la transcripción. Recargá para volver a intentar.';
}

async function load() {
  try {
    const responses = await Promise.all(
      ['lesson.json', 'code.json'].map((file) => fetch(base + file)),
    );
    if (responses.some((response) => !response.ok))
      throw new Error('Missing lesson assets');
    [lesson, snippets] = await Promise.all(
      responses.map((response) => response.json()),
    );
    $('#duration').textContent = `${time(lesson.duration)} min`;
    $('#seek').max = String(lesson.duration);
    for (const [index, scene] of lesson.scenes.entries()) {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.className = 'chapter';
      button.type = 'button';
      for (const [className, text] of [
        ['chapter-number', String(index + 1).padStart(2, '0')],
        ['chapter-title', scene.title],
        ['chapter-time', time(scene.start)],
      ]) {
        const span = document.createElement('span');
        span.className = className;
        span.textContent = text;
        button.append(span);
      }
      button.setAttribute(
        'aria-label',
        `Capítulo ${index + 1}: ${scene.title}, ${time(scene.start)}`,
      );
      button.addEventListener('click', () => seek(scene.start));
      item.append(button);
      $('#chapters').append(item);
      const heading = document.createElement('h3');
      heading.textContent = `${time(scene.start)} · ${scene.title}`;
      $('#transcript').append(heading);
      for (const cue of lesson.subtitles.filter(
        (cue) => cue.start >= scene.start && cue.start < scene.end,
      )) {
        const paragraph = document.createElement('p');
        paragraph.textContent = cue.text;
        $('#transcript').append(paragraph);
      }
    }
    audio.addEventListener('error', unavailable);
    audio.src = base + lesson.audio;
    $('#experience').hidden = false;
    $('#load-status').hidden = true;
    draw();
    $('#view-screen').addEventListener('click', () => setView('screen'));
    $('#view-code').addEventListener('click', () => setView('code'));
    $('#play').addEventListener('click', async () => {
      if (!audio.paused) return audio.pause();
      try {
        if (audio.ended || audio.currentTime >= lesson.duration) {
          // WebKit can pause a new play() while an end-of-track seek is pending.
          // Finish the rewind first; keep a bounded fallback for missing seek events.
          await new Promise((resolve) => {
            const done = () => {
              clearTimeout(timer);
              audio.removeEventListener('seeked', done);
              resolve();
            };
            const timer = setTimeout(done, 1500);
            audio.addEventListener('seeked', done, { once: true });
            seek(0);
          });
        }
        await audio.play();
        $('#load-status').hidden = true;
      } catch {
        if (audio.error) unavailable();
        else {
          $('#load-status').hidden = false;
          $('#load-status').textContent =
            'El navegador no pudo iniciar el audio. Volvé a pulsar Reproducir.';
        }
      }
    });
    for (const event of ['play', 'pause', 'ended'])
      audio.addEventListener(event, () => {
        updateTransport();
        if (audio.ended) draw(lesson.duration);
      });
    for (const event of ['timeupdate', 'seeked', 'loadedmetadata'])
      audio.addEventListener(event, () => draw());
    $('#seek').addEventListener('input', (event) =>
      seek(Number(event.target.value)),
    );
    $('#back-ten').addEventListener('click', () =>
      seek((audioFailed ? silentPosition : audio.currentTime) - 10),
    );
    $('#speed').addEventListener('change', (event) => {
      audio.playbackRate = Number(event.target.value);
    });
    $('#mute').addEventListener('click', () => {
      audio.muted = !audio.muted;
      $('#mute').setAttribute('aria-pressed', String(audio.muted));
      $('#mute').setAttribute(
        'aria-label',
        audio.muted ? 'Activar narración' : 'Silenciar narración',
      );
      $('#mute').textContent = audio.muted ? 'Sin voz' : 'Voz';
    });
    $('#captions').addEventListener('click', () => {
      captions = !captions;
      $('#captions').setAttribute('aria-pressed', String(captions));
      $('#caption').classList.toggle('off', !captions);
    });
    $('#quiz').addEventListener('submit', (event) => {
      event.preventDefault();
      const answer = new FormData(event.target).get('answer');
      $('#feedback').textContent =
        answer === 'receiver'
          ? '¡Exacto! Comprobar al receptor detecta una acreditación anticipada, incluso si el estado y la reserva de Ana parecen correctos.'
          : 'Todavía falta evidencia. Un mensaje o una espera no prueban el saldo del receptor. Buscá la opción que comprueba el dinero de Bruno.';
    });
  } catch {
    $('#load-status').textContent =
      'No se pudo preparar la lección. Recargá la página o consultá lab/lessons/pending-transfer.json en el repositorio.';
  }
}

load();
