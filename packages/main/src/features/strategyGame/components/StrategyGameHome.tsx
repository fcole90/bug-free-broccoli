'use client';

import MusicNoteIcon from '@mui/icons-material/MusicNote';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { memo, useState } from 'react';
import Box from '@swiftpost/elysium/ui/base/Box';
import Button from '@swiftpost/elysium/ui/base/Button';
import Stack from '@swiftpost/elysium/ui/base/Stack';
import Text from '@swiftpost/elysium/ui/base/Text';
import {
  councilEvents,
  councilSealPreviews,
  councillorProfiles,
  createStatPreviews,
  gameSubtitle,
  gameTitle,
  heroAssets,
  musicConfig,
  openingLines,
  statDefinitions,
} from '../constants';
import type {
  ChoiceResolution,
  CouncilChoice,
  CouncilEvent,
  CouncilGameState,
  CouncilSealPreview,
  CouncillorId,
  CouncillorProfile,
  StatPreview,
  StatTone,
} from '../types';
import { useBackgroundMusic, useCouncilGame } from '../hooks';

const statToneStyles: Record<
  StatTone,
  { border: string; background: string; color: string }
> = {
  danger: {
    border: 'rgb(229 100 75 / 46%)',
    background:
      'linear-gradient(135deg, rgb(99 35 30 / 78%), rgb(33 21 20 / 72%))',
    color: '#ffb49d',
  },
  wealth: {
    border: 'rgb(238 199 99 / 52%)',
    background:
      'linear-gradient(135deg, rgb(116 84 22 / 78%), rgb(38 29 13 / 72%))',
    color: '#f6d681',
  },
  harmony: {
    border: 'rgb(135 196 143 / 46%)',
    background:
      'linear-gradient(135deg, rgb(38 88 61 / 78%), rgb(21 38 31 / 72%))',
    color: '#b9e6b9',
  },
  intrigue: {
    border: 'rgb(169 137 218 / 48%)',
    background:
      'linear-gradient(135deg, rgb(68 47 92 / 80%), rgb(29 24 39 / 72%))',
    color: '#d8c5ff',
  },
};

const panelSx = {
  border: '1px solid rgb(236 199 117 / 24%)',
  borderRadius: 2,
  background:
    'linear-gradient(180deg, rgb(30 24 22 / 88%), rgb(18 15 16 / 90%))',
  boxShadow: '0 24px 80px rgb(0 0 0 / 34%)',
};

interface MusicControlsProps {
  musicEnabled: boolean;
  musicVolume: number;
  onToggleMusic: () => void;
  onVolumeChange: (nextVolume: number) => void;
}

const MusicControls: React.FC<MusicControlsProps> = ({
  musicEnabled,
  musicVolume,
  onToggleMusic,
  onVolumeChange,
}) => {
  const handleVolumeInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    onVolumeChange(Number(event.target.value));
  };

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      gap={1.25}
      sx={{
        ...panelSx,
        p: 1,
      }}
    >
      <Button
        variant="contained"
        color="secondary"
        startIcon={musicEnabled ? <VolumeOffIcon /> : <MusicNoteIcon />}
        onClick={onToggleMusic}
        sx={{
          minHeight: 42,
          borderRadius: 1.5,
          fontFamily: 'inherit',
          fontWeight: 700,
          whiteSpace: 'nowrap',
        }}
      >
        {musicEnabled ? 'Disattiva musica' : 'Attiva musica'}
      </Button>
      <Stack
        direction="row"
        alignItems="center"
        gap={1}
        sx={{ minWidth: { xs: '100%', sm: 220 } }}
      >
        <VolumeOffIcon fontSize="small" />
        <Box
          component="input"
          type="range"
          min={0}
          max={8}
          step={1}
          value={musicVolume}
          aria-label="Volume musica"
          onChange={handleVolumeInputChange}
          sx={{
            width: '100%',
            accentColor: '#e8c56f',
            cursor: 'pointer',
          }}
        />
        <VolumeUpIcon fontSize="small" />
        <Text
          variant="body2"
          fontWeight={700}
          color="#f7e4b1"
          sx={{ width: 18, textAlign: 'right' }}
        >
          {musicVolume}
        </Text>
      </Stack>
    </Stack>
  );
};

interface StatCardProps {
  stat: StatPreview;
}

const StatCard: React.FC<StatCardProps> = ({ stat }) => {
  const toneStyle = statToneStyles[stat.tone];

  return (
    <Stack
      gap={0.75}
      sx={{
        minWidth: 0,
        border: `1px solid ${toneStyle.border}`,
        borderRadius: 1.5,
        background: toneStyle.background,
        p: 1.25,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
      >
        <Stack direction="row" alignItems="center" gap={0.75} minWidth={0}>
          <Box
            component="img"
            src={stat.iconSrc}
            alt=""
            sx={{ width: 26, height: 26, flex: '0 0 auto' }}
          />
          <Text variant="body2" fontWeight={800} color="#fff7df" noWrap>
            {stat.label}
          </Text>
        </Stack>
        <Text variant="caption" fontWeight={800} color={toneStyle.color} noWrap>
          {stat.valueLabel}
        </Text>
      </Stack>
      <Stack
        direction="row"
        gap={0.75}
        aria-label={`${stat.label}: livello ${stat.valueLabel}`}
      >
        {[1, 2, 3].map((pipValue) => {
          const isActive = pipValue <= stat.value;

          return (
            <Box
              key={pipValue}
              sx={{
                width: 22,
                height: 8,
                borderRadius: 99,
                background:
                  isActive ? toneStyle.color : 'rgb(255 255 255 / 18%)',
                boxShadow: isActive ? `0 0 16px ${toneStyle.color}` : 'none',
              }}
            />
          );
        })}
      </Stack>
    </Stack>
  );
};

interface CouncilSealProps {
  seal: CouncilSealPreview;
  earned: boolean;
  selected: boolean;
  onSelect: (councillorId: CouncillorId) => void;
}

const CouncilSeal: React.FC<CouncilSealProps> = ({
  seal,
  earned,
  selected,
  onSelect,
}) => {
  const sealSrc =
    earned ? seal.sealSrc : (seal.inactiveSealSrc ?? seal.sealSrc);

  return (
    <Button
      variant="text"
      aria-pressed={selected}
      onClick={() => {
        onSelect(seal.id);
      }}
      sx={{
        width: '100%',
        minWidth: 0,
        minHeight: 138,
        border: `1px solid ${selected ? '#e8c56f' : 'rgb(232 197 111 / 20%)'}`,
        borderRadius: 1.5,
        background: selected ? 'rgb(232 197 111 / 12%)' : 'rgb(0 0 0 / 16%)',
        color: '#fff2cf',
        fontFamily: 'inherit',
        p: 1,
        textTransform: 'none',
        '&:hover': {
          borderColor: '#e8c56f',
          background: 'rgb(232 197 111 / 12%)',
        },
      }}
    >
      <Stack alignItems="center" gap={0.75} sx={{ width: '100%', minWidth: 0 }}>
        <Box
          component="img"
          src={sealSrc}
          alt={`Sigillo di ${seal.name}`}
          sx={{
            width: 58,
            height: 58,
            objectFit: 'contain',
            filter:
              earned || seal.inactiveSealSrc != null ?
                'none'
              : 'grayscale(1) opacity(0.58)',
          }}
        />
        <Text
          variant="caption"
          fontWeight={800}
          color="inherit"
          textAlign="center"
          noWrap
        >
          {seal.name}
        </Text>
        <Text
          variant="caption"
          color="rgb(255 242 207 / 66%)"
          textAlign="center"
          noWrap
        >
          {earned ? 'Sigillato' : seal.role}
        </Text>
        <Stack direction="row" alignItems="center" gap={0.35}>
          <InfoOutlinedIcon sx={{ fontSize: 15 }} />
          <Text variant="caption" fontWeight={900} color="#f7e4b1" noWrap>
            Scheda
          </Text>
        </Stack>
      </Stack>
    </Button>
  );
};

interface CouncillorInfoPanelProps {
  councillor: CouncillorProfile;
  inAudience: boolean;
}

const CouncillorInfoPanel: React.FC<CouncillorInfoPanelProps> = ({
  councillor,
  inAudience,
}) => {
  return (
    <Stack
      gap={1.25}
      sx={{
        border: '1px solid rgb(232 197 111 / 28%)',
        borderRadius: 1.5,
        background: 'rgb(0 0 0 / 24%)',
        p: 1.5,
      }}
    >
      <Stack direction="row" alignItems="center" gap={1.25} minWidth={0}>
        <Box
          component="img"
          src={councillor.mugshotSrc}
          alt=""
          sx={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            border: '1px solid rgb(232 197 111 / 44%)',
            flex: '0 0 auto',
          }}
        />
        <Stack gap={0.25} minWidth={0}>
          <Text
            variant="overline"
            color="#e8c56f"
            letterSpacing={0}
            fontWeight={900}
          >
            Scheda consigliere
          </Text>
          <Text variant="body1" fontWeight={900} color="#fff7df" noWrap>
            {councillor.name}
          </Text>
          <Text variant="body2" color="rgb(255 242 207 / 72%)" noWrap>
            {councillor.role}
          </Text>
        </Stack>
      </Stack>
      <TraitChips traits={councillor.traits} />
      <Text
        variant="body2"
        color="#f7e4b1"
        sx={{ fontStyle: 'italic', lineHeight: 1.5 }}
      >
        {`"${councillor.motto}"`}
      </Text>
      <Text
        variant="body2"
        color="rgb(255 245 218 / 76%)"
        sx={{ lineHeight: 1.55 }}
      >
        {councillor.detail}
      </Text>
      {inAudience ?
        <Text variant="caption" fontWeight={900} color="#b9e6b9">
          In udienza adesso
        </Text>
      : null}
    </Stack>
  );
};
interface TraitChipsProps {
  traits: readonly string[];
}

const TraitChips: React.FC<TraitChipsProps> = ({ traits }) => {
  return (
    <Stack direction="row" flexWrap="wrap" gap={0.75}>
      {traits.map((trait) => (
        <Text
          key={trait}
          variant="caption"
          fontWeight={900}
          color="#f7e4b1"
          sx={{
            border: '1px solid rgb(232 197 111 / 34%)',
            borderRadius: 99,
            background: 'rgb(232 197 111 / 10%)',
            px: 1,
            py: 0.35,
          }}
        >
          {trait}
        </Text>
      ))}
    </Stack>
  );
};

interface StatDeltaListProps {
  choice: CouncilChoice;
}

const StatDeltaList: React.FC<StatDeltaListProps> = ({ choice }) => {
  return (
    <Stack direction="row" flexWrap="wrap" gap={0.75}>
      {statDefinitions.map((stat) => {
        const delta = choice.statDeltas[stat.key];

        if (delta == null || delta === 0) {
          return null;
        }

        const toneStyle = statToneStyles[stat.tone];

        return (
          <Text
            key={stat.key}
            variant="caption"
            fontWeight={900}
            color={toneStyle.color}
            sx={{
              border: `1px solid ${toneStyle.border}`,
              borderRadius: 99,
              background: 'rgb(0 0 0 / 22%)',
              px: 0.9,
              py: 0.3,
            }}
          >
            {delta > 0 ? '+' : ''}
            {delta} {stat.label}
          </Text>
        );
      })}
    </Stack>
  );
};

interface ChoiceButtonProps {
  choice: CouncilChoice;
  onSelect: (choice: CouncilChoice) => void;
}

const ChoiceButton: React.FC<ChoiceButtonProps> = ({ choice, onSelect }) => {
  return (
    <Button
      variant="outlined"
      fullWidth
      onClick={() => {
        onSelect(choice);
      }}
      sx={{
        justifyContent: 'flex-start',
        borderColor: 'rgb(232 197 111 / 36%)',
        borderRadius: 1.5,
        color: '#fff7df',
        fontFamily: 'inherit',
        minHeight: 92,
        p: 1.4,
        textAlign: 'left',
        textTransform: 'none',
        '&:hover': {
          borderColor: '#e8c56f',
          background: 'rgb(232 197 111 / 10%)',
        },
      }}
    >
      <Stack alignItems="flex-start" gap={0.75} sx={{ width: '100%' }}>
        <Text variant="body1" fontWeight={900} color="inherit">
          {choice.label}
        </Text>
        <Text variant="body2" color="rgb(255 245 218 / 72%)">
          {choice.preview}
        </Text>
        <StatDeltaList choice={choice} />
      </Stack>
    </Button>
  );
};

interface IntroContentProps {
  onStart: () => void;
}

const IntroContent: React.FC<IntroContentProps> = ({ onStart }) => {
  return (
    <Stack gap={2} justifyContent="space-between" sx={{ flex: 1, minWidth: 0 }}>
      <Stack gap={1.5}>
        <Stack direction="row" alignItems="center" gap={1}>
          <Box
            component="img"
            src={heroAssets.liegeCrown.src}
            alt={heroAssets.liegeCrown.alt}
            sx={{ width: 48, height: 48, objectFit: 'contain' }}
          />
          <Text
            variant="overline"
            color="#e8c56f"
            letterSpacing={0}
            fontWeight={900}
          >
            Regina Georgia dei Drumso
          </Text>
        </Stack>
        <Text
          component="h1"
          sx={{
            maxWidth: 680,
            fontSize: { xs: 42, md: 52 },
            lineHeight: 0.98,
            fontWeight: 900,
            color: '#fff3cf',
            textShadow: '0 4px 28px rgb(0 0 0 / 42%)',
          }}
        >
          {gameTitle}
        </Text>
        <Text
          variant="h6"
          component="p"
          color="rgb(255 245 218 / 80%)"
          sx={{ maxWidth: 640, lineHeight: 1.45 }}
        >
          {gameSubtitle}
        </Text>
      </Stack>

      <Stack gap={1.25} sx={{ maxWidth: 680 }}>
        {openingLines.map((line) => (
          <Text
            key={line}
            variant="body1"
            color="rgb(255 245 218 / 82%)"
            sx={{ lineHeight: 1.55 }}
          >
            {line}
          </Text>
        ))}
      </Stack>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        gap={1.25}
        alignItems={{ xs: 'stretch', sm: 'center' }}
      >
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<PlayArrowIcon />}
          onClick={onStart}
          sx={{
            minHeight: 54,
            borderRadius: 1.5,
            fontFamily: 'inherit',
            fontWeight: 900,
            px: 3,
          }}
        >
          Convoca il Consiglio
        </Button>
        <Text variant="body2" color="rgb(255 242 207 / 68%)">
          Le scelte mostreranno subito quali valori cambiano.
        </Text>
      </Stack>
    </Stack>
  );
};

interface EventContentProps {
  event: CouncilEvent;
  councillor: CouncillorProfile;
  detailsVisible: boolean;
  onToggleDetails: () => void;
  onSelectChoice: (choice: CouncilChoice) => void;
}

const EventContent: React.FC<EventContentProps> = ({
  event,
  councillor,
  detailsVisible,
  onToggleDetails,
  onSelectChoice,
}) => {
  return (
    <Stack gap={2} sx={{ flex: 1, minWidth: 0 }}>
      <Stack gap={1.25}>
        <Text
          variant="overline"
          color="#e8c56f"
          letterSpacing={0}
          fontWeight={900}
        >
          {event.eyebrow}
        </Text>
        <Text
          component="h1"
          sx={{
            maxWidth: 720,
            fontSize: { xs: 38, md: 48 },
            lineHeight: 1,
            fontWeight: 900,
            color: '#fff3cf',
            textShadow: '0 4px 28px rgb(0 0 0 / 42%)',
          }}
        >
          {event.title}
        </Text>
        <Stack direction="row" alignItems="center" gap={1.25} flexWrap="wrap">
          <Box
            component="img"
            src={councillor.mugshotSrc}
            alt=""
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: '1px solid rgb(232 197 111 / 44%)',
            }}
          />
          <Stack minWidth={0}>
            <Text variant="body1" fontWeight={900} color="#fff7df">
              {councillor.name}
            </Text>
            <Text variant="body2" color="rgb(255 242 207 / 72%)">
              {councillor.role}
            </Text>
          </Stack>
        </Stack>
        <TraitChips traits={councillor.traits} />
      </Stack>

      <Stack gap={1.25} sx={{ maxWidth: 720 }}>
        <Text
          variant="body1"
          color="rgb(255 245 218 / 84%)"
          sx={{ lineHeight: 1.55 }}
        >
          {event.setup}
        </Text>
        <Text
          variant="body2"
          color="#f7e4b1"
          sx={{ fontStyle: 'italic', lineHeight: 1.5 }}
        >
          {`"${councillor.motto}"`}
        </Text>
        <Button
          variant="text"
          aria-pressed={detailsVisible}
          onClick={onToggleDetails}
          sx={{
            alignSelf: 'flex-start',
            color: '#e8c56f',
            fontFamily: 'inherit',
            fontWeight: 900,
            px: 0,
            textTransform: 'none',
          }}
        >
          {detailsVisible ? 'Nascondi dettagli' : 'Mostra dettagli'}
        </Button>
        {detailsVisible ?
          <Text
            variant="body2"
            color="rgb(255 245 218 / 76%)"
            sx={{
              borderLeft: '3px solid rgb(232 197 111 / 50%)',
              pl: 1.5,
              lineHeight: 1.55,
            }}
          >
            {councillor.detail}
          </Text>
        : null}
      </Stack>

      <Stack gap={1} sx={{ maxWidth: 760 }}>
        {event.choices.map((choice) => (
          <ChoiceButton
            key={choice.id}
            choice={choice}
            onSelect={onSelectChoice}
          />
        ))}
      </Stack>
    </Stack>
  );
};

interface ResultContentProps {
  resolution: ChoiceResolution;
  councillor: CouncillorProfile;
  onReset: () => void;
}

const ResultContent: React.FC<ResultContentProps> = ({
  resolution,
  councillor,
  onReset,
}) => {
  const earnedSigil = resolution.earnedSigil != null;

  return (
    <Stack gap={2} sx={{ flex: 1, minWidth: 0 }}>
      <Stack gap={1.25}>
        <Text
          variant="overline"
          color="#e8c56f"
          letterSpacing={0}
          fontWeight={900}
        >
          Decreto registrato
        </Text>
        <Text
          component="h1"
          sx={{
            maxWidth: 720,
            fontSize: { xs: 38, md: 48 },
            lineHeight: 1,
            fontWeight: 900,
            color: '#fff3cf',
            textShadow: '0 4px 28px rgb(0 0 0 / 42%)',
          }}
        >
          {resolution.choice.result.title}
        </Text>
        <Text
          variant="body1"
          color="rgb(255 245 218 / 84%)"
          sx={{ maxWidth: 720, lineHeight: 1.55 }}
        >
          {resolution.choice.result.description}
        </Text>
      </Stack>

      <Stack
        gap={1}
        sx={{
          maxWidth: 720,
          border: '1px solid rgb(232 197 111 / 28%)',
          borderRadius: 1.5,
          background: 'rgb(0 0 0 / 22%)',
          p: 1.5,
        }}
      >
        <Text variant="body1" fontWeight={900} color="#f7e4b1">
          {earnedSigil ?
            `Sigillo di ${councillor.name} ottenuto.`
          : `Il sigillo di ${councillor.name} resta sul tavolo.`}
        </Text>
        <Text variant="body2" color="rgb(255 245 218 / 72%)">
          {earnedSigil ?
            'Il Consiglio riconosce che il decreto rispetta la sua arte.'
          : 'La corte sopravvive al decreto, ma Lauretana prende nota con troppa precisione.'
          }
        </Text>
        <StatDeltaList choice={resolution.choice} />
      </Stack>

      <Stack gap={1.25} sx={{ maxWidth: 720 }}>
        <Text variant="body2" color="rgb(255 245 218 / 72%)">
          Fuori dalla sala, altri quattro consiglieri fingono di non ascoltare.
        </Text>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<RestartAltIcon />}
          onClick={onReset}
          sx={{
            alignSelf: 'flex-start',
            minHeight: 50,
            borderRadius: 1.5,
            fontFamily: 'inherit',
            fontWeight: 900,
            px: 2.5,
          }}
        >
          Torna alla sala del trono
        </Button>
      </Stack>
    </Stack>
  );
};

interface MainSceneContentProps {
  gameState: CouncilGameState;
  currentEvent: CouncilEvent;
  currentCouncillor: CouncillorProfile;
  detailsVisible: boolean;
  onStart: () => void;
  onReset: () => void;
  onToggleDetails: () => void;
  onSelectChoice: (choice: CouncilChoice) => void;
}

const MainSceneContent: React.FC<MainSceneContentProps> = ({
  gameState,
  currentEvent,
  currentCouncillor,
  detailsVisible,
  onStart,
  onReset,
  onToggleDetails,
  onSelectChoice,
}) => {
  if (gameState.phase === 'intro') {
    return <IntroContent onStart={onStart} />;
  }

  if (gameState.phase === 'event') {
    return (
      <EventContent
        event={currentEvent}
        councillor={currentCouncillor}
        detailsVisible={detailsVisible}
        onToggleDetails={onToggleDetails}
        onSelectChoice={onSelectChoice}
      />
    );
  }

  if (gameState.latestResolution == null) {
    return <IntroContent onStart={onStart} />;
  }

  return (
    <ResultContent
      resolution={gameState.latestResolution}
      councillor={currentCouncillor}
      onReset={onReset}
    />
  );
};

const StrategyGameHome: React.FC = () => {
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedCouncillorId, setSelectedCouncillorId] =
    useState<CouncillorId>('lauretana');
  const { musicEnabled, musicVolume, setMusicVolume, toggleMusic } =
    useBackgroundMusic(musicConfig);
  const {
    gameState,
    currentEvent,
    currentCouncillor,
    earnedSigilSet,
    startCouncil,
    resetCouncil,
    selectChoice,
  } = useCouncilGame();
  const statCards = createStatPreviews(gameState.stats);
  const selectedCouncillor = councillorProfiles[selectedCouncillorId];
  const activeFigure =
    gameState.phase === 'intro' ?
      { src: heroAssets.georgia.src, alt: heroAssets.georgia.alt }
    : { src: currentCouncillor.fullSrc, alt: currentCouncillor.fullAlt };

  const handleStartCouncil = () => {
    setDetailsVisible(false);
    setSelectedCouncillorId(currentEvent.councillorId);
    startCouncil();
  };

  const handleResetCouncil = () => {
    setDetailsVisible(false);
    resetCouncil();
  };

  const toggleDetails = () => {
    setDetailsVisible((currentValue) => !currentValue);
  };

  return (
    <Stack
      component="main"
      sx={{
        minHeight: '100dvh',
        width: '100%',
        overflow: 'hidden',
        color: '#fff7df',
        fontFamily: 'inherit',
        background:
          'radial-gradient(circle at 18% 18%, rgb(117 50 36 / 28%), transparent 32%), linear-gradient(135deg, #171111 0%, #272016 48%, #111516 100%)',
      }}
    >
      <Stack
        gap={{ xs: 2, md: 3 }}
        sx={{
          width: '100%',
          maxWidth: 1240,
          mx: 'auto',
          px: { xs: 2, md: 3 },
          py: { xs: 2, md: 3 },
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          gap={2}
        >
          <Stack direction="row" alignItems="center" gap={1.25} minWidth={0}>
            <Box
              component="img"
              src={heroAssets.calendar.src}
              alt={heroAssets.calendar.alt}
              sx={{ width: 32, height: 32 }}
            />
            <Stack minWidth={0}>
              <Text
                variant="overline"
                letterSpacing={0}
                color="#e8c56f"
                fontWeight={800}
              >
                Udienza di compleanno
              </Text>
              <Text variant="body2" color="rgb(255 242 207 / 72%)">
                Scania, sala del trono
              </Text>
            </Stack>
          </Stack>
          <MusicControls
            musicEnabled={musicEnabled}
            musicVolume={musicVolume}
            onToggleMusic={toggleMusic}
            onVolumeChange={setMusicVolume}
          />
        </Stack>

        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          gap={{ xs: 2, md: 3 }}
          sx={{ alignItems: 'stretch', minHeight: { lg: 640 } }}
        >
          <Stack
            gap={2}
            sx={{
              ...panelSx,
              flex: { lg: '1 1 58%' },
              position: 'relative',
              overflow: 'hidden',
              p: { xs: 2, md: 3 },
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(90deg, rgb(0 0 0 / 42%) 0%, transparent 46%), linear-gradient(180deg, transparent 0%, rgb(0 0 0 / 50%) 100%)',
                pointerEvents: 'none',
              }}
            />
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              gap={2}
              sx={{ position: 'relative', zIndex: 1, height: '100%' }}
            >
              <MainSceneContent
                gameState={gameState}
                currentEvent={currentEvent}
                currentCouncillor={currentCouncillor}
                detailsVisible={detailsVisible}
                onStart={handleStartCouncil}
                onReset={handleResetCouncil}
                onToggleDetails={toggleDetails}
                onSelectChoice={selectChoice}
              />

              <Stack
                alignItems="center"
                justifyContent="flex-end"
                sx={{
                  minHeight: { xs: 360, md: 540 },
                  flex: { md: '0 0 260px' },
                  position: 'relative',
                }}
              >
                <Box
                  component="img"
                  src={activeFigure.src}
                  alt={activeFigure.alt}
                  sx={{
                    width: { xs: 180, md: 220 },
                    maxHeight: { xs: 420, md: 560 },
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 28px 46px rgb(0 0 0 / 55%))',
                  }}
                />
              </Stack>
            </Stack>
          </Stack>

          <Stack gap={2} sx={{ flex: { lg: '1 1 42%' }, minWidth: 0 }}>
            <Stack
              gap={1.5}
              sx={{
                ...panelSx,
                p: { xs: 2, md: 2.5 },
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                gap={1.5}
              >
                <Text
                  variant="overline"
                  color="#e8c56f"
                  letterSpacing={0}
                  fontWeight={900}
                >
                  Stato del reame
                </Text>
                <Text variant="body2" color="rgb(255 242 207 / 70%)">
                  {gameState.phase === 'intro' ?
                    'Valori iniziali'
                  : `Udienza ${gameState.currentEventIndex + 1} / ${councilEvents.length}`
                  }
                </Text>
              </Stack>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, minmax(0, 1fr))',
                  },
                  gap: 1.25,
                }}
              >
                {statCards.map((stat) => (
                  <StatCard key={stat.key} stat={stat} />
                ))}
              </Box>
            </Stack>

            <Stack
              gap={1.5}
              sx={{
                ...panelSx,
                p: { xs: 2, md: 2.5 },
              }}
            >
              <Text
                variant="overline"
                color="#e8c56f"
                letterSpacing={0}
                fontWeight={900}
              >
                Sigilli del Consiglio
              </Text>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'repeat(2, minmax(0, 1fr))',
                    sm: 'repeat(5, minmax(0, 1fr))',
                    lg: 'repeat(3, minmax(0, 1fr))',
                  },
                  gap: 1.25,
                  justifyItems: 'center',
                }}
              >
                {councilSealPreviews.map((seal) => (
                  <CouncilSeal
                    key={seal.id}
                    seal={seal}
                    earned={earnedSigilSet.has(seal.id)}
                    selected={selectedCouncillorId === seal.id}
                    onSelect={setSelectedCouncillorId}
                  />
                ))}
              </Box>
              <CouncillorInfoPanel
                councillor={selectedCouncillor}
                inAudience={selectedCouncillorId === currentEvent.councillorId}
              />
            </Stack>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              gap={1.5}
              sx={{
                ...panelSx,
                p: { xs: 2, md: 2.5 },
              }}
            >
              <Box
                component="img"
                src={heroAssets.sealedScrolls.src}
                alt={heroAssets.sealedScrolls.alt}
                sx={{
                  width: { xs: '100%', sm: 190 },
                  height: 112,
                  objectFit: 'contain',
                  borderRadius: 1,
                  background: 'rgb(0 0 0 / 24%)',
                }}
              />
              <Stack gap={0.75} justifyContent="center" minWidth={0}>
                <Text
                  variant="overline"
                  color="#e8c56f"
                  letterSpacing={0}
                  fontWeight={900}
                >
                  Decreto sigillato
                </Text>
                <Text
                  variant="body1"
                  color="rgb(255 245 218 / 84%)"
                  sx={{ lineHeight: 1.5 }}
                >
                  La vera natura della concessione resta chiusa dietro
                  pergamene, sigilli e una quantità sospetta di cerimoniale.
                </Text>
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default memo(StrategyGameHome);
