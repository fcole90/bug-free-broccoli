export const MUSIC_VOLUME_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

export const STAT_LEVELS = [1, 2, 3] as const;

export type MusicVolume = (typeof MUSIC_VOLUME_VALUES)[number];

export type StatLevel = (typeof STAT_LEVELS)[number];

export type StatDelta = -1 | 0 | 1;

export type StatKey = 'stress' | 'gold' | 'harmony' | 'suspicion';

export type StatPreviewKey = StatKey;

export type StatTone = 'danger' | 'wealth' | 'harmony' | 'intrigue';

export type CouncillorId =
  | 'lauretana'
  | 'giommaria'
  | 'alessandro'
  | 'roberta'
  | 'phabous';

export type GamePhase = 'intro' | 'event' | 'result' | 'ending' | 'defeat';

export type EndingTier =
  | 'dynastic-triumph'
  | 'golden-prosperity'
  | 'courtly-legend'
  | 'noble-chaos'
  | 'last-resort';

export type DefeatReason =
  | 'stress-meltdown'
  | 'suspicion-exposed'
  | 'treasury-empty'
  | 'harmony-broken';

export interface MusicConfig {
  src: string;
  defaultVolume: MusicVolume;
}

export interface HeroAsset {
  src: string;
  alt: string;
}

export interface RevealAssets {
  giftJumbo: HeroAsset;
  giftBundle: HeroAsset;
  trailerEmbedUrl: string;
}

export interface StatPreview {
  key: StatKey;
  label: string;
  value: StatLevel;
  valueLabel: string;
  iconSrc: string;
  tone: StatTone;
}

export interface CouncilSealPreview {
  id: CouncillorId;
  name: string;
  role: string;
  sealSrc: string;
  inactiveSealSrc?: string;
}

export interface GameStats {
  stress: StatLevel;
  gold: StatLevel;
  harmony: StatLevel;
  suspicion: StatLevel;
}

export interface CouncillorProfile {
  id: CouncillorId;
  name: string;
  role: string;
  traits: readonly string[];
  motto: string;
  detail: string;
  approach: string;
  warning: string;
  fullSrc: string;
  fullAlt: string;
  mugshotSrc: string;
  sealSrc: string;
  inactiveSealSrc?: string;
}

export interface CouncilChoiceResult {
  title: string;
  description: string;
}

export interface CouncilChoice {
  id: string;
  label: string;
  preview: string;
  statDeltas: Partial<Record<StatKey, StatDelta>>;
  awardsSigil: boolean;
  result: CouncilChoiceResult;
}

export interface CouncilEvent {
  id: string;
  councillorId: CouncillorId;
  eyebrow: string;
  title: string;
  setup: string;
  choices: readonly CouncilChoice[];
}

export interface ChoiceResolution {
  event: CouncilEvent;
  choice: CouncilChoice;
  previousStats: GameStats;
  nextStats: GameStats;
  earnedSigil?: CouncillorId;
  defeatReason?: DefeatReason;
}

export interface EndingDefinition {
  tier: EndingTier;
  title: string;
  text: string;
  revealLine: string;
}

export interface DefeatDefinition {
  reason: DefeatReason;
  title: string;
  text: string;
  imagePrompt: string;
}

export interface CouncilGameState {
  phase: GamePhase;
  stats: GameStats;
  earnedSigils: readonly CouncillorId[];
  history: readonly ChoiceResolution[];
  currentEventIndex: number;
  latestResolution?: ChoiceResolution;
  endingTier?: EndingTier;
  defeatReason?: DefeatReason;
}
