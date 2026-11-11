
export interface CaptionCue {
  start: number;
  end: number;
  text: string;
}

export interface IntroData {
  video: string;
  captions?: string | CaptionCue[];
  text?: string;
}

export type VideoSource =
  | { kind: 'none' }
  | { kind: 'youtube'; id: string }
  | { kind: 'vimeo'; id: string }
  | { kind: 'file'; src: string };

export function parseVideoSource(raw: string | undefined): VideoSource {
  const value = (raw ?? '').trim();
  if (!value) return { kind: 'none' };

  const youtube =
    value.match(/youtu\.be\/([\w-]{6,})/) ??
    value.match(/youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)([\w-]{6,})/);
  if (youtube) return { kind: 'youtube', id: youtube[1] };

  const vimeo = value.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { kind: 'vimeo', id: vimeo[1] };

  return { kind: 'file', src: value.replace(/^\//, '') };
}

export function embedUrl(source: VideoSource, autoplay: boolean, lang = 'uk'): string {
  const play = autoplay ? 1 : 0;
  if (source.kind === 'youtube') {
    return `https://www.youtube-nocookie.com/embed/${source.id}?enablejsapi=1&rel=0&cc_load_policy=1&cc_lang_pref=${lang}&hl=${lang}&autoplay=${play}&playsinline=1`;
  }
  if (source.kind === 'vimeo') {
    return `https://player.vimeo.com/video/${source.id}?api=1&texttrack=${lang}&autoplay=${play}&playsinline=1`;
  }
  return '';
}

export function shouldShowIntro(intro: IntroData | undefined, seen: Record<string, boolean>, key: string): boolean {
  return parseVideoSource(intro?.video).kind !== 'none' && !seen[key];
}

export function captionAt(cues: CaptionCue[], time: number): string {
  return cues.find((cue) => time >= cue.start && time < cue.end)?.text ?? '';
}
