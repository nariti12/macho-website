import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const sampleRate = 44_100;

const makeWav = ({ duration, notes }) => {
  const frameCount = Math.floor(sampleRate * duration);
  const pcm = Buffer.alloc(frameCount * 2);

  for (let frame = 0; frame < frameCount; frame += 1) {
    const time = frame / sampleRate;
    let sample = 0;

    for (const note of notes) {
      if (time < note.start || time > note.end) continue;
      const localTime = time - note.start;
      const noteDuration = note.end - note.start;
      const attack = Math.min(1, localTime / 0.012);
      const release = Math.min(1, Math.max(0, (note.end - time) / Math.min(0.12, noteDuration * 0.45)));
      const envelope = attack * release;
      sample += Math.sin(2 * Math.PI * note.frequency * localTime) * envelope * note.gain;
      sample += Math.sin(2 * Math.PI * note.frequency * 2 * localTime) * envelope * note.gain * 0.16;
    }

    const softened = Math.tanh(sample * 1.15) * 0.56;
    pcm.writeInt16LE(Math.round(softened * 32_767), frame * 2);
  }

  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
};

const sounds = {
  "achievement.wav": {
    duration: 0.54,
    notes: [
      { frequency: 523.25, start: 0, end: 0.2, gain: 0.34 },
      { frequency: 659.25, start: 0.11, end: 0.34, gain: 0.32 },
      { frequency: 783.99, start: 0.23, end: 0.52, gain: 0.36 },
    ],
  },
  "golden-spawn.wav": {
    duration: 0.68,
    notes: [
      { frequency: 880, start: 0, end: 0.46, gain: 0.2 },
      { frequency: 1_108.73, start: 0.08, end: 0.58, gain: 0.22 },
      { frequency: 1_318.51, start: 0.18, end: 0.66, gain: 0.18 },
    ],
  },
  "golden-collect.wav": {
    duration: 0.46,
    notes: [
      { frequency: 659.25, start: 0, end: 0.43, gain: 0.24 },
      { frequency: 830.61, start: 0, end: 0.43, gain: 0.23 },
      { frequency: 987.77, start: 0.03, end: 0.45, gain: 0.25 },
    ],
  },
};

for (const [fileName, definition] of Object.entries(sounds)) {
  const filePath = resolve("public/sounds/macho-clicker", fileName);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, makeWav(definition));
}

console.log(`Generated ${Object.keys(sounds).length} Macho Clicker sound effects.`);
