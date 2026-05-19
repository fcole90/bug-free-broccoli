'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MUSIC_VOLUME_VALUES, type MusicVolume } from '../types';

interface UseBackgroundMusicOptions {
  src: string;
  defaultVolume: MusicVolume;
}

interface UseBackgroundMusicResult {
  musicEnabled: boolean;
  musicVolume: MusicVolume;
  setMusicVolume: (nextVolume: number) => void;
  toggleMusic: () => void;
}

const isMusicVolume = (value: number): value is MusicVolume => {
  return MUSIC_VOLUME_VALUES.includes(value as MusicVolume);
};

const normalizeMusicVolume = (value: number): MusicVolume => {
  const roundedValue = Math.round(value);

  if (isMusicVolume(roundedValue)) {
    return roundedValue;
  }

  if (roundedValue < MUSIC_VOLUME_VALUES[0]) {
    return 0;
  }

  return 8;
};

export const useBackgroundMusic = ({
  src,
  defaultVolume,
}: UseBackgroundMusicOptions): UseBackgroundMusicResult => {
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [musicVolume, setMusicVolumeState] =
    useState<MusicVolume>(defaultVolume);

  useEffect(() => {
    const audioElement = new Audio(src);
    audioElement.loop = true;
    audioElement.preload = 'auto';
    audioElement.volume = defaultVolume / 8;
    audioElementRef.current = audioElement;

    return () => {
      audioElement.pause();
      audioElementRef.current = null;
    };
  }, [defaultVolume, src]);

  useEffect(() => {
    const audioElement = audioElementRef.current;

    if (audioElement == null) {
      return;
    }

    audioElement.volume = musicVolume / 8;
  }, [musicVolume]);

  const setMusicVolume = useCallback((nextVolume: number) => {
    setMusicVolumeState(normalizeMusicVolume(nextVolume));
  }, []);

  const toggleMusic = useCallback(() => {
    const audioElement = audioElementRef.current;

    if (audioElement == null) {
      return;
    }

    if (musicEnabled) {
      audioElement.pause();
      setMusicEnabled(false);
      return;
    }

    audioElement.volume = musicVolume / 8;
    void audioElement
      .play()
      .then(() => {
        setMusicEnabled(true);
      })
      .catch(() => {
        setMusicEnabled(false);
      });
  }, [musicEnabled, musicVolume]);

  return {
    musicEnabled,
    musicVolume,
    setMusicVolume,
    toggleMusic,
  };
};
