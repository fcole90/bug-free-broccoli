import type {
  CouncilSealPreview,
  HeroAsset,
  MusicConfig,
  StatPreview,
} from './types';

const publicBasePath =
  process.env.NODE_ENV === 'development' ? '' : '/bug-free-broccoli';

const publicAsset = (assetPath: `/${string}`) =>
  `${publicBasePath}${assetPath}`;

export const gameTitle = 'Il Consiglio del Genetliaco';

export const gameSubtitle =
  'Cinque consiglieri, tre decreti per volta, una sorpresa reale da proteggere fino al sigillo finale.';

export const musicConfig: MusicConfig = {
  src: publicAsset('/genetliaco-resurrection-theme.mp3'),
  defaultVolume: 4,
};

export const heroAssets: Record<
  'georgia' | 'sealedScrolls' | 'liegeCrown' | 'calendar' | 'minimap',
  HeroAsset
> = {
  georgia: {
    src: publicAsset('/character-full-georgia-200-560.png'),
    alt: 'Regina Georgia in abiti di corte',
  },
  sealedScrolls: {
    src: publicAsset('/extras/icon-map-scrolls-165-150.png'),
    alt: 'Pergamene sigillate del Consiglio',
  },
  liegeCrown: {
    src: publicAsset('/extras/council-seal-liege-gold-crown-112-110.png'),
    alt: 'Corona dorata della Regina Georgia',
  },
  calendar: {
    src: publicAsset('/icon-calendar-outlined-32.png'),
    alt: 'Icona calendario del genetliaco',
  },
  minimap: {
    src: publicAsset('/minimap-scania.png'),
    alt: 'Mappa stilizzata di Scania',
  },
};

export const statPreviews: StatPreview[] = [
  {
    key: 'stress',
    label: 'Stress',
    valueLabel: 'Medio',
    iconSrc: publicAsset('/stats-soul-tearing-32.png'),
    tone: 'danger',
  },
  {
    key: 'gold',
    label: 'Oro',
    valueLabel: 'Medio',
    iconSrc: publicAsset('/stats-gold-coins-32.png'),
    tone: 'wealth',
  },
  {
    key: 'harmony',
    label: 'Armonia',
    valueLabel: 'Medio',
    iconSrc: publicAsset('/stats-golden-crown-32.png'),
    tone: 'harmony',
  },
  {
    key: 'suspicion',
    label: 'Sospetto',
    valueLabel: 'Medio',
    iconSrc: publicAsset('/stats-rusty-crown-32.png'),
    tone: 'intrigue',
  },
];

export const councilSealPreviews: CouncilSealPreview[] = [
  {
    id: 'lauretana',
    name: 'Lauretana',
    role: 'Amministratrice',
    sealSrc: publicAsset(
      '/extras/council-seal-steward-keys-active-140-129.png',
    ),
  },
  {
    id: 'giommaria',
    name: 'Giommaria',
    role: 'Maestro di Spie',
    sealSrc: publicAsset('/extras/council-seal-spymaster-network-124-139.png'),
  },
  {
    id: 'alessandro',
    name: 'Alessandro',
    role: 'Maresciallo',
    sealSrc: publicAsset('/extras/council-seal-marshal-mace-124-139.png'),
  },
  {
    id: 'roberta',
    name: 'Roberta',
    role: 'Cancelliera',
    sealSrc: publicAsset('/extras/council-seal-chancellor-scroll-119-130.png'),
  },
  {
    id: 'phabous',
    name: 'Phabous',
    role: 'Sacerdote / Eretico',
    sealSrc: publicAsset(
      '/extras/council-seal-priest-astral-artifact-117-138.png',
    ),
  },
];

export const openingLines = [
  'Mia Signora, il Vostro Genetliaco si avvicina.',
  'Il Consiglio richiede udienza per manufatto antico e segreto da scoprire.',
  'Le scelte arriveranno nel prossimo passo; per ora la sala, la musica e i sigilli sono pronti.',
] as const;
