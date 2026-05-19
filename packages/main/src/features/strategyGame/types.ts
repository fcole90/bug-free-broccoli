export const MUSIC_VOLUME_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

export type MusicVolume = (typeof MUSIC_VOLUME_VALUES)[number];

export type StatPreviewKey = 'stress' | 'gold' | 'harmony' | 'suspicion';

export type StatTone = 'danger' | 'wealth' | 'harmony' | 'intrigue';

export interface MusicConfig {
  src: string;
  defaultVolume: MusicVolume;
}

export interface HeroAsset {
  src: string;
  alt: string;
}

export interface StatPreview {
  key: StatPreviewKey;
  label: string;
  valueLabel: string;
  iconSrc: string;
  tone: StatTone;
}

export interface CouncilSealPreview {
  id: string;
  name: string;
  role: string;
  sealSrc: string;
}
