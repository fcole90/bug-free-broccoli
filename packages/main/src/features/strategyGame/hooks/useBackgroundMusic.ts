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
  enableMusic: () => void;
  pauseMusic: () => void;
  setMusicVolume: (nextVolume: number) => void;
  toggleMusic: () => void;
}

const musicVolumeStorageKey = 'genetliaco:music-volume:v2';

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

const readStoredMusicVolume = (): MusicVolume | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const storedValue = window.localStorage.getItem(musicVolumeStorageKey);

  if (storedValue == null) {
    return undefined;
  }

  const storedVolume = Number(storedValue);

  if (!Number.isFinite(storedVolume)) {
    return undefined;
  }

  return normalizeMusicVolume(storedVolume);
};

const writeStoredMusicVolume = (musicVolume: MusicVolume) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(musicVolumeStorageKey, String(musicVolume));
  } catch {
    // Ignore storage failures so music controls still work in private browsing.
  }
};

export const useBackgroundMusic = ({
  src,
  defaultVolume,
}: UseBackgroundMusicOptions): UseBackgroundMusicResult => {
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [musicVolume, setMusicVolumeState] =
    useState<MusicVolume>(defaultVolume);

  useEffect(() => {
    const storedVolume = readStoredMusicVolume();

    if (storedVolume != null) {
      setMusicVolumeState(storedVolume);
    }

    setStorageReady(true);
  }, []);

  useEffect(() => {
    const audioElement = new Audio(src);
    const handleEnded = () => {
      audioElement.currentTime = 0;
      void audioElement.play().catch(() => {
        setMusicEnabled(false);
      });
    };

    audioElement.loop = true;
    audioElement.preload = 'auto';
    audioElement.volume = defaultVolume / 8;
    audioElement.addEventListener('ended', handleEnded);
    audioElementRef.current = audioElement;

    return () => {
      audioElement.removeEventListener('ended', handleEnded);
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

  useEffect(() => {
    const audioElement = audioElementRef.current;

    if (audioElement == null || !musicEnabled) {
      return;
    }

    audioElement.volume = musicVolume / 8;
    void audioElement.play().catch(() => {
      setMusicEnabled(false);
    });
  }, [musicEnabled, musicVolume, src]);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    writeStoredMusicVolume(musicVolume);
  }, [musicVolume, storageReady]);

  const setMusicVolume = useCallback((nextVolume: number) => {
    setMusicVolumeState(normalizeMusicVolume(nextVolume));
  }, []);

  const enableMusic = useCallback(() => {
    const audioElement = audioElementRef.current;

    if (audioElement == null || musicEnabled) {
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

  const pauseMusic = useCallback(() => {
    const audioElement = audioElementRef.current;

    if (audioElement == null) {
      return;
    }

    audioElement.pause();
    setMusicEnabled(false);
  }, []);

  const toggleMusic = useCallback(() => {
    if (musicEnabled) {
      pauseMusic();
      return;
    }

    enableMusic();
  }, [enableMusic, musicEnabled, pauseMusic]);

  return {
    musicEnabled,
    musicVolume,
    enableMusic,
    pauseMusic,
    setMusicVolume,
    toggleMusic,
  };
};
