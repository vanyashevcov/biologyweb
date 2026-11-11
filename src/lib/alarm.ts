
const SOUND_SRC = 'music/sound.mp3';

let audio: HTMLAudioElement | null = null;

function sound(): HTMLAudioElement | null {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return null;
  if (!audio) {
    audio = new Audio(SOUND_SRC);
    audio.preload = 'auto';
  }
  return audio;
}

export function unlockAudioOnGesture() {
  if (typeof window === 'undefined') return;
  const unlock = () => {
    sound()?.load();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
}

export function playSiren() {
  const node = sound();
  if (!node) return;
  node.currentTime = 0;
  node.play().catch(() => undefined);
}

export function stopAlarm() {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}
