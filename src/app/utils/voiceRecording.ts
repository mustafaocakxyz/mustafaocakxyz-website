const TARGET_SAMPLE_RATE = 16000;

type BrowserVoiceRecording = {
  stream: MediaStream;
  context: AudioContext;
  chunks: Float32Array[];
};

let active: BrowserVoiceRecording | null = null;

function getAudioContextConstructor(): typeof AudioContext {
  const fromWindow = window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!fromWindow) throw new Error('AudioContext unavailable');
  return fromWindow;
}

function concatFloat32(chunks: Float32Array[]): Float32Array {
  let total = 0;
  for (const chunk of chunks) total += chunk.length;
  const out = new Float32Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

function downsample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const newLength = Math.max(1, Math.round(input.length / ratio));
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(input.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    const count = Math.max(1, end - start);
    for (let j = start; j < end; j++) sum += input[j] ?? 0;
    result[i] = sum / count;
  }
  return result;
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i] ?? 0));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function stopTracks(stream: MediaStream | null | undefined) {
  stream?.getTracks().forEach((track) => track.stop());
}

export async function startBrowserVoiceRecording(): Promise<void> {
  await cancelBrowserVoiceRecording();

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
  });
  const Context = getAudioContextConstructor();
  const context = new Context();
  await context.resume();

  const source = context.createMediaStreamSource(stream);
  const processor = context.createScriptProcessor(4096, 1, 1);
  const mute = context.createGain();
  mute.gain.value = 0;

  const chunks: Float32Array[] = [];
  processor.onaudioprocess = (event) => {
    chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
  };

  source.connect(processor);
  processor.connect(mute);
  mute.connect(context.destination);

  active = { stream, context, chunks };
}

export async function stopBrowserVoiceRecording(): Promise<{
  blob: Blob;
  fileName: string;
  contentType: string;
}> {
  if (!active) throw new Error('No active recording');

  const { stream, context, chunks } = active;
  active = null;

  stopTracks(stream);
  const sampleRate = context.sampleRate || 44100;
  try {
    await context.close();
  } catch {
    // ignore
  }

  const raw = concatFloat32(chunks);
  if (raw.length === 0) throw new Error('Empty recording');
  const samples = downsample(raw, sampleRate, TARGET_SAMPLE_RATE);
  const blob = encodeWav(samples, TARGET_SAMPLE_RATE);
  return {
    blob,
    fileName: `voice-${Date.now()}.wav`,
    contentType: 'audio/wav',
  };
}

export async function cancelBrowserVoiceRecording(): Promise<void> {
  if (!active) return;
  const { stream, context } = active;
  active = null;
  stopTracks(stream);
  try {
    await context.close();
  } catch {
    // ignore
  }
}
