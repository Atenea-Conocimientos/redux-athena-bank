"""Assemble approved scene MP3s; align captions locally, never call a TTS API.

Requires ffmpeg and faster-whisper with a pre-downloaded model. Originals and
alignment cache stay in ignored .lesson-tools/elevenlabs, not in the web root.
"""
import argparse
from difflib import SequenceMatcher
import hashlib
import json
from pathlib import Path
import re
import subprocess
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'lab/lessons/pending-transfer.json'
OUT = ROOT / 'lab/public/lessons/pending-transfer'
CACHE = ROOT / '.lesson-tools/elevenlabs'
RATE = 44100
# Whisper often writes "2.399" where the script spells "dos mil trescientos
# noventa y nueve". Use surrounding prose for timing, not numeric spelling.
NUMBER_WORDS = set('un uno una dos tres nueve diez cien ciento doscientos trescientos quinientos mil noventa y por'.split())


def tokens(text):
    plain = ''.join(c for c in unicodedata.normalize('NFD', text.lower())
                    if unicodedata.category(c) != 'Mn')
    return [word for word in re.findall(r'[a-z0-9]+', plain)
            if not word.isdigit() and word not in NUMBER_WORDS]


def timestamp(seconds):
    ms = round(seconds * 1000)
    return f'{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02}.{ms % 1000:03}'


def main():
    global SOURCE, OUT, CACHE
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--model-dir', required=True, type=Path)
    parser.add_argument('--lesson', choices=['pending-transfer', 'first-test', 'create-practice', 'account-deposit',
                                           'invalid-deposit', 'transfer-quote', 'confirm-transfer'], default='pending-transfer')
    args = parser.parse_args()
    if args.lesson != 'pending-transfer':
        SOURCE = ROOT / f'lab/lessons/{args.lesson}.json'
        OUT = ROOT / f'lab/public/lessons/{args.lesson}'
        CACHE = ROOT / f'.lesson-tools/elevenlabs/{args.lesson}'
    OUT.mkdir(parents=True, exist_ok=True)
    if not args.model_dir.is_dir():
        raise ValueError('A pre-downloaded local Whisper model is required.')
    from faster_whisper import WhisperModel
    import numpy as np
    model = None
    source_text = SOURCE.read_text(encoding='utf-8')
    source = json.loads(source_text)
    pieces, scenes, subtitles, evidence = [], [], [], []
    cursor = 0
    for scene in source['scenes']:
        audio = CACHE / f"{scene['id']}.mp3"
        digest = hashlib.sha256(audio.read_bytes()).hexdigest()
        cache = CACHE / f'{digest}.words.json'
        if cache.exists():
            words = json.loads(cache.read_text(encoding='utf-8'))
        else:
            if model is None:
                model = WhisperModel(str(args.model_dir), device='cpu', compute_type='int8', cpu_threads=4, local_files_only=True)
            # Decode through the same local FFmpeg used for assembly. Passing a
            # 16 kHz waveform also avoids version-sensitive PyAV file-open APIs.
            waveform = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(audio),
                                                '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'])
            segments, _ = model.transcribe(np.frombuffer(waveform, dtype='<f4'), language='es',
                                           word_timestamps=True, beam_size=5, vad_filter=False)
            words = [{'text': w.word, 'start': w.start, 'end': w.end} for s in segments for w in (s.words or [])]
            cache.write_text(json.dumps(words, ensure_ascii=False, indent=2), encoding='utf-8')
        pcm = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(audio), '-f', 's16le', '-ac', '1', '-ar', str(RATE), '-'])
        # One small chapter pause. Keep decoded sample lengths as the time source.
        pcm += bytes(round(RATE * 0.25) * 2)
        duration = len(pcm) / 2 / RATE
        script_tokens = [token for cue in scene['cues'] for token in tokens(cue)]
        spoken = [(token, word['start']) for word in words for token in tokens(word['text'])]
        matcher = SequenceMatcher(None, script_tokens, [t[0] for t in spoken], autojunk=False)
        matched = {block.a + offset: block.b + offset for block in matcher.get_matching_blocks() for offset in range(block.size)}
        coverage = len(matched) / len(script_tokens)
        if coverage < 0.85:
            raise ValueError(f"Review {scene['id']}: script alignment only {coverage:.1%}")
        starts, offset = [], 0
        for i, cue in enumerate(scene['cues']):
            candidates = [matched[k] for k in range(offset, min(offset + 4, len(script_tokens))) if k in matched]
            if not candidates:
                raise ValueError(f"No reliable cue boundary: {scene['id']} / {i}")
            starts.append(0 if i == 0 else max(0, spoken[candidates[0]][1] - 0.08))
            offset += len(tokens(cue))
        if not all(a < b for a, b in zip(starts, starts[1:] + [duration])):
            raise ValueError(f"Invalid cue order: {scene['id']}")
        end = cursor + duration
        for i, cue in enumerate(scene['cues']):
            subtitles.append({'start': round(cursor + starts[i], 3),
                              'end': round(cursor + (starts[i + 1] if i + 1 < len(starts) else duration), 3),
                              'text': cue, 'view': 'code' if i >= scene.get('codeFromCue', 999) else 'screen'})
        scenes.append({**{k: v for k, v in scene.items() if k != 'cues'}, 'start': round(cursor, 3), 'end': round(end, 3)})
        evidence.append({'scene': scene['id'], 'audioSha256': digest, 'alignmentCoverage': round(coverage, 4), 'cueStarts': starts})
        pieces.append(pcm)
        cursor = end
        print(f"{scene['id']}: {duration:.2f}s, alignment {coverage:.1%}, boundaries {starts}", flush=True)
    if not 120 <= cursor <= 180:
        raise ValueError(f'Expected 2–3 minutes; got {cursor:.2f}s')
    combined = b''.join(pieces)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(RATE), '-ac', '1', '-i', '-', '-codec:a', 'libmp3lame', '-b:a', '128k', str(OUT / 'narration.mp3')], input=combined, check=True)
    manifest = {'title': source['title'], 'duration': round(cursor, 3), 'voice': 'Juan Torres', 'language': 'es',
                'voiceDisclosure': 'Voz de Juan · clonada con IA y autorizada',
                'voiceProduction': 'Generada con ElevenLabs; audio alojado localmente, sin llamadas a TTS al reproducir.',
                'provider': 'ElevenLabs', 'model': 'Eleven v4', 'alignment': 'Local Whisper word timestamps matched to prose; numeric spellings excluded from timing score (not an audio content audit)',
                'sourceSha256': hashlib.sha256(source_text.encode()).hexdigest(),
                'audioSha256': hashlib.sha256((OUT / 'narration.mp3').read_bytes()).hexdigest(),
                'audio': 'narration.mp3', 'scenes': scenes, 'subtitles': subtitles, 'sceneAudio': evidence}
    if source.get('codeFile'):
        manifest['codeFile'] = source['codeFile']
    (OUT / 'lesson.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    vtt = ['WEBVTT', '']
    for cue in subtitles:
        vtt.extend([f"{timestamp(cue['start'])} --> {timestamp(cue['end'])}", cue['text'], ''])
    (OUT / 'subtitles.vtt').write_text('\n'.join(vtt), encoding='utf-8')
    print(f'Imported {cursor:.2f}s with {len(subtitles)} synchronized captions.', flush=True)


if __name__ == '__main__':
    main()
