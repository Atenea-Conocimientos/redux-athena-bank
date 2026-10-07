"""Offline synthesis after model installation. No cloud TTS or credentials."""
import hashlib
import json
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'lab/lessons/pending-transfer.json'
OUT = ROOT / 'lab/public/lessons/pending-transfer'
CACHE = ROOT / '.lesson-tools'
MODELS = CACHE / 'models'
HASHES = {
    'kokoro-v1.0.int8.onnx': 'ae315a79b623f244700e4afb9246c46a26066782e049ba174bf3ba433970ee9c',
    'voices-v1.0.bin': 'bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d',
}


def timestamp(seconds):
    millis = round(seconds * 1000)
    return f'{millis // 3600000:02}:{millis // 60000 % 60:02}:{millis // 1000 % 60:02}.{millis % 1000:03}'


def main():
    for name, expected in HASHES.items():
        actual = hashlib.sha256((MODELS / name).read_bytes()).hexdigest()
        if actual != expected:
            raise ValueError(f'Incorrect model hash: {name}')
    source = json.loads(SOURCE.read_text(encoding='utf-8'))
    kokoro = Kokoro(str(MODELS / 'kokoro-v1.0.int8.onnx'), str(MODELS / 'voices-v1.0.bin'))
    OUT.mkdir(parents=True, exist_ok=True)
    segments = CACHE / 'segments'
    segments.mkdir(parents=True, exist_ok=True)
    pieces, subtitles, scenes = [], [], []
    sample_rate, cursor = 24000, 0
    for scene in source['scenes']:
        start = cursor / sample_rate
        for index, sentence in enumerate(scene['cues']):
            key = hashlib.sha256(json.dumps([sentence, source['voice'], source['speed'], source['language'], HASHES], sort_keys=True).encode()).hexdigest()
            segment_file = segments / f'{key}.wav'
            if segment_file.exists():
                samples, rate = sf.read(segment_file, dtype='float32')
            else:
                samples, rate = kokoro.create(sentence, voice=source['voice'], speed=source['speed'], lang=source['language'])
                sf.write(segment_file, samples, rate, subtype='FLOAT')
            assert rate == sample_rate and np.isfinite(samples).all() and len(samples) > 0
            # Explicit inter-sentence silence remains part of the subtitle timeline.
            part = np.concatenate([samples, np.zeros(round(sample_rate * 0.35), dtype=np.float32)])
            end = cursor + len(part)
            view = 'code' if index >= scene.get('codeFromCue', 999) else 'screen'
            subtitles.append({'start': round(cursor / sample_rate, 3), 'end': round(end / sample_rate, 3), 'text': sentence, 'view': view})
            pieces.append(part)
            cursor = end
        scenes.append({**{key: value for key, value in scene.items() if key != 'cues'}, 'start': round(start, 3), 'end': round(cursor / sample_rate, 3)})
        print(f"Synthesized {scene['id']}: {cursor / sample_rate:.1f}s", flush=True)
    combined = np.concatenate(pieces)
    duration = len(combined) / sample_rate
    if not 120 <= duration <= 180:
        raise ValueError(f'Pilot must be 2–3 minutes, got {duration:.2f}s. Adjust script or speed.')
    peak = float(np.max(np.abs(combined)))
    if peak:
        combined = combined * (0.90 / peak)
    wav = CACHE / 'pending-transfer.wav'
    sf.write(wav, combined, sample_rate, subtype='PCM_16')
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(wav), '-codec:a', 'libmp3lame', '-b:a', '96k', str(OUT / 'narration.mp3')], check=True)
    manifest = {
        'title': source['title'], 'duration': round(duration, 3),
        'voice': source['voice'], 'language': source['language'],
        'sourceSha256': hashlib.sha256(SOURCE.read_text(encoding='utf-8').encode()).hexdigest(),
        'audio': 'narration.mp3', 'scenes': scenes, 'subtitles': subtitles,
    }
    (OUT / 'lesson.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    vtt = ['WEBVTT', '']
    for cue in subtitles:
        vtt.extend([f"{timestamp(cue['start'])} --> {timestamp(cue['end'])}", cue['text'], ''])
    (OUT / 'subtitles.vtt').write_text('\n'.join(vtt), encoding='utf-8')
    print(f'Generated local voice: {duration:.2f}s; normalized peak: -0.92dBFS', flush=True)


if __name__ == '__main__':
    main()
