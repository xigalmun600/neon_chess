import type { Color } from "$lib/state/opponent";

export type QueuedMove = { from: string; to: string; promotion?: string };

export const rhythm = $state({
  running: false,
  currentBeatIndex: 0,
  currentTime: 0,
  beatsTotal: 0,
  whiteQueued: null as QueuedMove | null,
  blackQueued: null as QueuedMove | null,
});

let audio: HTMLAudioElement | null = null;
let beats: number[] = [];
let rafId: number | null = null;
let onBeatCallback: ((index: number, color: Color) => void) | null = null;

export async function loadTrack(jsonUrl: string): Promise<{
  audioUrl: string;
  beats: number[];
}> {
  const res = await fetch(jsonUrl);
  if (!res.ok) throw new Error(`Failed to load ${jsonUrl}: ${res.status}`);
  const data = (await res.json()) as { audio: string; beats: number[] };
  return { audioUrl: data.audio, beats: data.beats };
}

export function start(
  audioEl: HTMLAudioElement,
  beatList: number[],
  onBeat: (index: number, color: Color) => void,
): void {
  audio = audioEl;
  beats = beatList;
  onBeatCallback = onBeat;
  rhythm.running = true;
  rhythm.currentBeatIndex = 0;
  rhythm.beatsTotal = beatList.length;
  rhythm.currentTime = 0;
  rhythm.whiteQueued = null;
  rhythm.blackQueued = null;

  const tick = () => {
    if (!rhythm.running || !audio) return;
    rhythm.currentTime = audio.currentTime;
    while (
      rhythm.currentBeatIndex < beats.length &&
      audio.currentTime >= beats[rhythm.currentBeatIndex]
    ) {
      const i = rhythm.currentBeatIndex;
      const color: Color = i % 2 === 0 ? "white" : "black";
      rhythm.currentBeatIndex = i + 1;
      onBeatCallback?.(i, color);
    }
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
}

export function stop(): void {
  rhythm.running = false;
  if (rafId != null) cancelAnimationFrame(rafId);
  rafId = null;
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
  audio = null;
  beats = [];
  onBeatCallback = null;
  rhythm.currentBeatIndex = 0;
  rhythm.currentTime = 0;
  rhythm.beatsTotal = 0;
  rhythm.whiteQueued = null;
  rhythm.blackQueued = null;
}

export function queueMove(color: Color, move: QueuedMove): void {
  if (color === "white") rhythm.whiteQueued = move;
  else rhythm.blackQueued = move;
}

export function consumeQueued(color: Color): QueuedMove | null {
  const move = color === "white" ? rhythm.whiteQueued : rhythm.blackQueued;
  if (color === "white") rhythm.whiteQueued = null;
  else rhythm.blackQueued = null;
  return move;
}

export function timeUntilNextBeatFor(color: Color): number | null {
  if (!rhythm.running) return null;
  for (let i = rhythm.currentBeatIndex; i < beats.length; i++) {
    const beatColor: Color = i % 2 === 0 ? "white" : "black";
    if (beatColor === color) {
      const dt = beats[i] - rhythm.currentTime;
      return dt > 0 ? dt : 0;
    }
  }
  return null;
}
