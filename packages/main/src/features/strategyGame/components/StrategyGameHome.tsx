'use client';

import MusicNoteIcon from '@mui/icons-material/MusicNote';
import CloseIcon from '@mui/icons-material/Close';
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
  defeatDefinitions,
  endingDefinitions,
  gameSubtitle,
  gameTitle,
  heroAssets,
  musicConfig,
  openingLines,
  revealAssets,
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
  DefeatDefinition,
  EndingDefinition,
  StatKey,
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

const actionButtonSx = {
  minHeight: 54,
  border: '1px solid rgb(247 228 177 / 36%)',
  borderRadius: 1.5,
  background:
    'linear-gradient(180deg, rgb(112 72 37 / 96%), rgb(78 43 24 / 96%))',
  boxShadow: '0 12px 32px rgb(0 0 0 / 24%)',
  color: '#fff3cf',
  fontFamily: 'inherit',
  fontWeight: 900,
  textTransform: 'none',
  '&:hover': {
    borderColor: '#f7d77f',
    background:
      'linear-gradient(180deg, rgb(132 84 42 / 98%), rgb(89 49 26 / 98%))',
  },
};

const outlineButtonSx = {
  borderColor: 'rgb(232 197 111 / 40%)',
  borderRadius: 1.5,
  color: '#fff7df',
  fontFamily: 'inherit',
  fontWeight: 900,
  textTransform: 'none',
};

const criticalStatWarnings: Record<StatKey, string> = {
  stress:
    'Siete sul ciglio del crollo mentale: un altro +Stress fa perdere la partita.',
  gold: 'Il Tesoro è quasi vuoto: un altro -Oro porta alla bancarotta.',
  harmony:
    'La corte è sul punto di spezzarsi: un altro -Armonia rovina la festa.',
  suspicion: 'Il Sospetto è al massimo: un altro +Sospetto scopre il segreto.',
};

const getCriticalStatWarning = (stat: StatPreview) => {
  if (stat.key === 'stress' || stat.key === 'suspicion') {
    return stat.value === 3 ? criticalStatWarnings[stat.key] : undefined;
  }

  return stat.value === 1 ? criticalStatWarnings[stat.key] : undefined;
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
      direction="row"
      alignItems="center"
      gap={1}
      sx={{
        minWidth: 0,
        border: '1px solid rgb(236 199 117 / 18%)',
        borderRadius: 1.5,
        background: 'rgb(0 0 0 / 18%)',
        p: 0.75,
      }}
    >
      <Button
        variant="contained"
        color="secondary"
        startIcon={musicEnabled ? <VolumeOffIcon /> : <MusicNoteIcon />}
        onClick={onToggleMusic}
        sx={{
          minHeight: 36,
          borderRadius: 1.5,
          fontFamily: 'inherit',
          fontSize: 13,
          fontWeight: 800,
          px: 1.25,
          whiteSpace: 'nowrap',
        }}
      >
        {musicEnabled ? 'Spegni' : 'Musica'}
      </Button>
      <Stack
        direction="row"
        alignItems="center"
        gap={0.75}
        sx={{ flex: '1 1 104px', minWidth: 92 }}
      >
        <VolumeOffIcon sx={{ fontSize: 17 }} />
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
        <VolumeUpIcon sx={{ fontSize: 17 }} />
        <Text
          variant="caption"
          fontWeight={900}
          color="#f7e4b1"
          sx={{ width: 14, textAlign: 'right' }}
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
  const criticalWarning = getCriticalStatWarning(stat);

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={0.65}
      sx={{
        minWidth: 0,
        border: `1px solid ${toneStyle.border}`,
        borderRadius: 1.5,
        background: toneStyle.background,
        px: 0.75,
        py: 0.55,
      }}
    >
      <Box
        component="img"
        src={stat.iconSrc}
        alt=""
        sx={{ width: 21, height: 21, flex: '0 0 auto' }}
      />
      <Stack gap={0.2} sx={{ flex: '1 1 auto', minWidth: 0 }}>
        <Stack direction="row" alignItems="center" gap={0.45} minWidth={0}>
          <Text variant="caption" fontWeight={900} color="#fff7df" noWrap>
            {stat.label}
          </Text>
          {criticalWarning != null ?
            <Text
              variant="caption"
              fontWeight={900}
              color="#fff3cf"
              title={criticalWarning}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 17,
                height: 17,
                borderRadius: '50%',
                background: '#9d3426',
                flex: '0 0 auto',
                lineHeight: 1,
              }}
            >
              !
            </Text>
          : null}
        </Stack>
        <Stack
          direction="row"
          gap={0.4}
          aria-label={`${stat.label}: livello ${stat.valueLabel}`}
        >
          {[1, 2, 3].map((pipValue) => {
            const isActive = pipValue <= stat.value;

            return (
              <Box
                key={pipValue}
                sx={{
                  width: 14,
                  height: 5,
                  borderRadius: 99,
                  background:
                    isActive ? toneStyle.color : 'rgb(255 255 255 / 18%)',
                  boxShadow: isActive ? `0 0 12px ${toneStyle.color}` : 'none',
                }}
              />
            );
          })}
        </Stack>
      </Stack>
      <Text variant="caption" fontWeight={900} color={toneStyle.color} noWrap>
        {stat.valueLabel}
      </Text>
    </Stack>
  );
};

interface StatSummaryStripProps {
  stats: readonly StatPreview[];
}

const StatSummaryStrip: React.FC<StatSummaryStripProps> = ({ stats }) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, minmax(0, 1fr))',
          md: 'repeat(4, minmax(0, 1fr))',
        },
        gap: 0.65,
        minWidth: 0,
      }}
    >
      {stats.map((stat) => (
        <StatCard key={stat.key} stat={stat} />
      ))}
    </Box>
  );
};

const TopDecreeStatus: React.FC = () => {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      gap={0.85}
      sx={{
        minWidth: 0,
        border: '1px solid rgb(236 199 117 / 18%)',
        borderRadius: 1.5,
        background: 'rgb(0 0 0 / 18%)',
        px: 1,
        py: 0.75,
      }}
    >
      <Box
        component="img"
        src={heroAssets.sealedScrolls.src}
        alt=""
        sx={{
          width: 42,
          height: 30,
          objectFit: 'contain',
          borderRadius: 1,
          background: 'rgb(0 0 0 / 22%)',
          flex: '0 0 auto',
        }}
      />
      <Stack
        gap={0.1}
        minWidth={0}
        sx={{ textAlign: { xs: 'left', md: 'center' } }}
      >
        <Text
          variant="caption"
          color="#e8c56f"
          fontWeight={900}
          noWrap
          sx={{ textTransform: 'uppercase' }}
        >
          Decreto sigillato
        </Text>
        <Text variant="caption" color="rgb(255 245 218 / 70%)" noWrap>
          Manufatto antico sotto chiave
        </Text>
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
        minHeight: 94,
        border: `1px solid ${selected ? '#e8c56f' : 'rgb(232 197 111 / 20%)'}`,
        borderRadius: 1.5,
        background: selected ? 'rgb(232 197 111 / 12%)' : 'rgb(0 0 0 / 16%)',
        color: '#fff2cf',
        fontFamily: 'inherit',
        p: 0.65,
        textTransform: 'none',
        '&:hover': {
          borderColor: '#e8c56f',
          background: 'rgb(232 197 111 / 12%)',
        },
      }}
    >
      <Stack alignItems="center" gap={0.35} sx={{ width: '100%', minWidth: 0 }}>
        <Box
          component="img"
          src={sealSrc}
          alt={`Sigillo di ${seal.name}`}
          sx={{
            width: 42,
            height: 42,
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
        <Stack direction="row" alignItems="center" gap={0.25}>
          <InfoOutlinedIcon sx={{ fontSize: 13 }} />
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
  onOpenDetails: (councillorId: CouncillorId) => void;
}

const CouncillorInfoPanel: React.FC<CouncillorInfoPanelProps> = ({
  councillor,
  inAudience,
  onOpenDetails,
}) => {
  return (
    <Stack
      gap={0.85}
      sx={{
        border: '1px solid rgb(232 197 111 / 28%)',
        borderRadius: 1.5,
        background: 'rgb(0 0 0 / 24%)',
        p: 1.1,
      }}
    >
      <Stack direction="row" alignItems="center" gap={1} minWidth={0}>
        <Box
          component="img"
          src={councillor.mugshotSrc}
          alt=""
          sx={{
            width: 46,
            height: 46,
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
        noWrap
        sx={{ fontStyle: 'italic', lineHeight: 1.35 }}
      >
        {`"${councillor.motto}"`}
      </Text>
      <Text
        variant="body2"
        color="rgb(255 245 218 / 76%)"
        sx={{
          display: '-webkit-box',
          lineHeight: 1.35,
          overflow: 'hidden',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 2,
        }}
      >
        {councillor.detail}
      </Text>
      <Text
        variant="body2"
        color="rgb(255 245 218 / 72%)"
        sx={{
          display: '-webkit-box',
          lineHeight: 1.35,
          overflow: 'hidden',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 2,
        }}
      >
        {councillor.approach}
      </Text>
      {inAudience ?
        <Text variant="caption" fontWeight={900} color="#b9e6b9">
          In udienza adesso
        </Text>
      : null}
      <Button
        variant="outlined"
        startIcon={<InfoOutlinedIcon />}
        onClick={() => {
          onOpenDetails(councillor.id);
        }}
        sx={{ ...outlineButtonSx, alignSelf: 'flex-start', minHeight: 36 }}
      >
        Apri scheda completa
      </Button>
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

interface CouncillorProfileModalProps {
  councillor?: CouncillorProfile;
  onClose: () => void;
}

const CouncillorProfileModal: React.FC<CouncillorProfileModalProps> = ({
  councillor,
  onClose,
}) => {
  if (councillor == null) {
    return null;
  }

  return (
    <Stack
      role="dialog"
      aria-modal="true"
      aria-label={`Scheda completa di ${councillor.name}`}
      alignItems="center"
      justifyContent="center"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 20,
        background: 'rgb(0 0 0 / 78%)',
        p: { xs: 2, md: 4 },
      }}
    >
      <Stack
        gap={2}
        sx={{
          ...panelSx,
          width: 'min(720px, 100%)',
          maxHeight: 'min(760px, 92dvh)',
          overflow: 'auto',
          p: { xs: 2, md: 3 },
        }}
      >
        <Stack direction="row" justifyContent="space-between" gap={1.5}>
          <Stack direction="row" alignItems="center" gap={1.25} minWidth={0}>
            <Box
              component="img"
              src={councillor.mugshotSrc}
              alt=""
              sx={{
                width: 58,
                height: 58,
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
                Scheda completa
              </Text>
              <Text variant="h5" fontWeight={900} color="#fff7df">
                {councillor.name}
              </Text>
              <Text variant="body2" color="rgb(255 242 207 / 72%)">
                {councillor.role}
              </Text>
            </Stack>
          </Stack>
          <Button
            variant="text"
            startIcon={<CloseIcon />}
            onClick={onClose}
            sx={{
              color: '#f7e4b1',
              fontFamily: 'inherit',
              fontWeight: 900,
              textTransform: 'none',
            }}
          >
            Chiudi
          </Button>
        </Stack>

        <TraitChips traits={councillor.traits} />
        <Text
          variant="body1"
          color="#f7e4b1"
          sx={{ fontStyle: 'italic', lineHeight: 1.55 }}
        >
          {`"${councillor.motto}"`}
        </Text>
        <Text
          variant="body1"
          color="rgb(255 245 218 / 82%)"
          sx={{ lineHeight: 1.6 }}
        >
          {councillor.detail}
        </Text>
        <Stack gap={1.25}>
          <Stack
            gap={0.5}
            sx={{
              border: '1px solid rgb(232 197 111 / 24%)',
              borderRadius: 1.5,
              background: 'rgb(0 0 0 / 18%)',
              p: 1.5,
            }}
          >
            <Text
              variant="overline"
              color="#e8c56f"
              letterSpacing={0}
              fontWeight={900}
            >
              Come leggerlo
            </Text>
            <Text
              variant="body2"
              color="rgb(255 245 218 / 78%)"
              sx={{ lineHeight: 1.55 }}
            >
              {councillor.approach}
            </Text>
          </Stack>
          <Stack
            gap={0.5}
            sx={{
              border: '1px solid rgb(229 100 75 / 28%)',
              borderRadius: 1.5,
              background: 'rgb(74 28 24 / 22%)',
              p: 1.5,
            }}
          >
            <Text
              variant="overline"
              color="#ffb49d"
              letterSpacing={0}
              fontWeight={900}
            >
              Rischio
            </Text>
            <Text
              variant="body2"
              color="rgb(255 245 218 / 78%)"
              sx={{ lineHeight: 1.55 }}
            >
              {councillor.warning}
            </Text>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};

interface DecisionConfirmationModalProps {
  choice?: CouncilChoice;
  councillor: CouncillorProfile;
  onCancel: () => void;
  onConfirm: (choice: CouncilChoice) => void;
}

const DecisionConfirmationModal: React.FC<DecisionConfirmationModalProps> = ({
  choice,
  councillor,
  onCancel,
  onConfirm,
}) => {
  if (choice == null) {
    return null;
  }

  return (
    <Stack
      role="dialog"
      aria-modal="true"
      aria-label="Conferma decreto"
      alignItems="center"
      justifyContent="center"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 20,
        background: 'rgb(0 0 0 / 76%)',
        p: { xs: 2, md: 4 },
      }}
    >
      <Stack
        gap={2}
        sx={{
          ...panelSx,
          width: 'min(680px, 100%)',
          maxHeight: 'min(720px, 92dvh)',
          overflow: 'auto',
          p: { xs: 2, md: 3 },
        }}
      >
        <Stack direction="row" justifyContent="space-between" gap={1.5}>
          <Stack gap={0.25} minWidth={0}>
            <Text
              variant="overline"
              color="#e8c56f"
              letterSpacing={0}
              fontWeight={900}
            >
              Decreto in sospeso
            </Text>
            <Text variant="h5" fontWeight={900} color="#fff7df">
              Confermare la decisione?
            </Text>
          </Stack>
          <Button
            variant="text"
            startIcon={<CloseIcon />}
            onClick={onCancel}
            sx={{
              color: '#f7e4b1',
              fontFamily: 'inherit',
              fontWeight: 900,
              textTransform: 'none',
            }}
          >
            Chiudi
          </Button>
        </Stack>

        <Stack
          gap={1}
          sx={{
            border: '1px solid rgb(232 197 111 / 24%)',
            borderRadius: 1.5,
            background: 'rgb(0 0 0 / 22%)',
            p: 1.5,
          }}
        >
          <Text
            variant="overline"
            color="#e8c56f"
            letterSpacing={0}
            fontWeight={900}
          >
            Azione della Regina
          </Text>
          <Text variant="body1" fontWeight={900} color="#fff7df">
            {choice.label}
          </Text>
          <StatDeltaList choice={choice} />
        </Stack>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          gap={1.25}
          sx={{
            border: '1px solid rgb(232 197 111 / 24%)',
            borderRadius: 1.5,
            background: 'rgb(0 0 0 / 18%)',
            p: 1.5,
          }}
        >
          <Box
            component="img"
            src={councillor.mugshotSrc}
            alt=""
            sx={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              border: '1px solid rgb(232 197 111 / 44%)',
              flex: '0 0 auto',
            }}
          />
          <Stack gap={0.5} minWidth={0}>
            <Text
              variant="overline"
              color="#e8c56f"
              letterSpacing={0}
              fontWeight={900}
            >
              Mossa di {councillor.name}
            </Text>
            <Text variant="body1" fontWeight={900} color="#f7e4b1">
              {choice.result.title}
            </Text>
            <Text
              variant="body2"
              color="rgb(255 245 218 / 78%)"
              sx={{ lineHeight: 1.55 }}
            >
              {choice.result.description}
            </Text>
          </Stack>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.25}>
          <Button
            variant="contained"
            size="large"
            startIcon={<PlayArrowIcon />}
            onClick={() => {
              onConfirm(choice);
            }}
            sx={{ ...actionButtonSx, px: 2.5 }}
          >
            Conferma decreto
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={onCancel}
            sx={{ ...outlineButtonSx, minHeight: 54, px: 2.5 }}
          >
            Ripensa la scelta
          </Button>
        </Stack>
      </Stack>
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
        const sign = delta > 0 ? '+' : '-';

        return (
          <Stack
            key={stat.key}
            component="span"
            direction="row"
            alignItems="center"
            gap={0.35}
            aria-label={`${sign}${Math.abs(delta)} ${stat.label}`}
            sx={{
              border: `1px solid ${toneStyle.border}`,
              borderRadius: 99,
              background: 'rgb(0 0 0 / 22%)',
              color: toneStyle.color,
              px: 0.85,
              py: 0.18,
            }}
          >
            <Box
              component="span"
              aria-hidden="true"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                minWidth: 13,
                fontSize: 19,
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              {sign}
            </Box>
            <Text
              component="span"
              variant="caption"
              fontWeight={900}
              color="inherit"
              sx={{ lineHeight: 1.25 }}
            >
              {Math.abs(delta)} {stat.label}
            </Text>
          </Stack>
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
        alignItems: 'stretch',
        justifyContent: 'flex-start',
        borderColor: 'rgb(232 197 111 / 36%)',
        borderRadius: 1.5,
        color: '#fff7df',
        fontFamily: 'inherit',
        height: '100%',
        minHeight: { xs: 86, lg: 116, xl: 104 },
        p: 1.05,
        textAlign: 'left',
        textTransform: 'none',
        '&:hover': {
          borderColor: '#e8c56f',
          background: 'rgb(232 197 111 / 10%)',
        },
      }}
    >
      <Stack alignItems="flex-start" gap={0.55} sx={{ width: '100%' }}>
        <Text
          variant="body1"
          fontWeight={900}
          color="inherit"
          sx={{
            display: '-webkit-box',
            lineHeight: 1.2,
            overflow: 'hidden',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 3,
          }}
        >
          {choice.label}
        </Text>
        <Text
          variant="body2"
          color="rgb(255 245 218 / 72%)"
          sx={{
            display: '-webkit-box',
            lineHeight: 1.3,
            overflow: 'hidden',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
          }}
        >
          {choice.preview}
        </Text>
        <StatDeltaList choice={choice} />
      </Stack>
    </Button>
  );
};

const getSavedGameLabel = (
  savedGameState: CouncilGameState | undefined,
  storageReady: boolean,
) => {
  if (!storageReady) {
    return 'Controllo degli archivi in corso.';
  }

  if (savedGameState == null) {
    return 'Nessun decreto sospeso negli archivi.';
  }

  if (savedGameState.phase === 'ending') {
    return 'Decreto finale pronto per essere riaperto.';
  }

  if (savedGameState.phase === 'result') {
    return `Archivio fermo dopo l'udienza ${savedGameState.currentEventIndex + 1}.`;
  }

  return `Archivio fermo all'udienza ${savedGameState.currentEventIndex + 1}.`;
};

interface MainMenuContentProps {
  hasSavedGame: boolean;
  savedGameState?: CouncilGameState;
  storageReady: boolean;
  onNewGame: () => void;
  onLoadGame: () => void;
}

const MainMenuContent: React.FC<MainMenuContentProps> = ({
  hasSavedGame,
  savedGameState,
  storageReady,
  onNewGame,
  onLoadGame,
}) => {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      sx={{
        minHeight: '100dvh',
        width: '100%',
        px: { xs: 2, md: 3 },
        py: { xs: 3, md: 5 },
      }}
    >
      <Stack
        gap={2.25}
        alignItems="center"
        textAlign="center"
        sx={{
          ...panelSx,
          width: 'min(720px, 100%)',
          p: { xs: 2.5, md: 4 },
        }}
      >
        <Box
          component="img"
          src={heroAssets.liegeCrown.src}
          alt={heroAssets.liegeCrown.alt}
          sx={{ width: 76, height: 76, objectFit: 'contain' }}
        />
        <Stack gap={1} alignItems="center">
          <Text
            variant="overline"
            color="#e8c56f"
            letterSpacing={0}
            fontWeight={900}
          >
            Archivio del Genetliaco
          </Text>
          <Text
            component="h1"
            sx={{
              maxWidth: 620,
              fontSize: { xs: 42, md: 58 },
              lineHeight: 0.96,
              fontWeight: 900,
              color: '#fff3cf',
              textShadow: '0 4px 28px rgb(0 0 0 / 42%)',
            }}
          >
            {gameTitle}
          </Text>
          <Text
            variant="body1"
            color="rgb(255 245 218 / 80%)"
            sx={{ maxWidth: 560, lineHeight: 1.55 }}
          >
            Aprite una nuova udienza o riprendete un decreto sospeso. La musica
            di corte partirà quando varcherete la soglia della sala.
          </Text>
        </Stack>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          gap={1.25}
          sx={{ width: 'min(480px, 100%)' }}
        >
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<PlayArrowIcon />}
            onClick={onNewGame}
            sx={{
              flex: 1,
              minHeight: 54,
              borderRadius: 1.5,
              fontFamily: 'inherit',
              fontWeight: 900,
            }}
          >
            Nuova partita
          </Button>
          <Button
            variant="outlined"
            size="large"
            disabled={!storageReady || !hasSavedGame}
            onClick={onLoadGame}
            sx={{
              flex: 1,
              minHeight: 54,
              borderColor: 'rgb(232 197 111 / 40%)',
              borderRadius: 1.5,
              color: '#fff7df',
              fontFamily: 'inherit',
              fontWeight: 900,
              textTransform: 'none',
              '&.Mui-disabled': {
                borderColor: 'rgb(255 255 255 / 14%)',
                color: 'rgb(255 245 218 / 36%)',
              },
            }}
          >
            Carica partita
          </Button>
        </Stack>

        <Text variant="body2" color="rgb(255 242 207 / 66%)">
          {getSavedGameLabel(savedGameState, storageReady)}
        </Text>
      </Stack>
    </Stack>
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

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
          gap: 1,
          maxWidth: 760,
        }}
      >
        {[
          {
            title: 'Obiettivo',
            text: 'Portate il manufatto al sigillo finale senza far saltare il piano.',
          },
          {
            title: 'Regole',
            text: 'Ogni stat ha tre livelli. Spingere un valore già critico oltre il limite fa perdere la partita.',
          },
          {
            title: 'Consiglio',
            text: 'Leggete le schede: ogni consigliere suggerisce cosa sa fare e quale rischio nasconde.',
          },
        ].map((item) => (
          <Stack
            key={item.title}
            gap={0.5}
            sx={{
              border: '1px solid rgb(232 197 111 / 24%)',
              borderRadius: 1.5,
              background: 'rgb(0 0 0 / 18%)',
              p: 1.25,
            }}
          >
            <Text variant="caption" fontWeight={900} color="#e8c56f">
              {item.title}
            </Text>
            <Text
              variant="body2"
              color="rgb(255 245 218 / 76%)"
              sx={{ lineHeight: 1.45 }}
            >
              {item.text}
            </Text>
          </Stack>
        ))}
      </Box>

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
            ...actionButtonSx,
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
  onOpenCouncillorDetail: (councillorId: CouncillorId) => void;
  onSelectChoice: (choice: CouncilChoice) => void;
}

const EventContent: React.FC<EventContentProps> = ({
  event,
  councillor,
  onOpenCouncillorDetail,
  onSelectChoice,
}) => {
  return (
    <Stack gap={1.3} sx={{ flex: 1, minWidth: 0 }}>
      <Stack gap={0.9}>
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
            maxWidth: 820,
            fontSize: { xs: 34, md: 42, xl: 46 },
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
              width: 42,
              height: 42,
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

      <Stack gap={0.85} sx={{ maxWidth: 860 }}>
        <Text
          variant="body1"
          color="rgb(255 245 218 / 84%)"
          sx={{ lineHeight: 1.42 }}
        >
          {event.setup}
        </Text>
        <Text
          variant="body2"
          color="#f7e4b1"
          sx={{ fontStyle: 'italic', lineHeight: 1.35 }}
        >
          {`"${councillor.motto}"`}
        </Text>
        <Button
          variant="outlined"
          startIcon={<InfoOutlinedIcon />}
          onClick={() => {
            onOpenCouncillorDetail(councillor.id);
          }}
          sx={{
            alignSelf: 'flex-start',
            ...outlineButtonSx,
            minHeight: 36,
          }}
        >
          Apri scheda consigliere
        </Button>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, minmax(0, 1fr))',
            xl: 'repeat(3, minmax(0, 1fr))',
          },
          gap: 0.8,
          maxWidth: 980,
        }}
      >
        {event.choices.map((choice) => (
          <ChoiceButton
            key={choice.id}
            choice={choice}
            onSelect={onSelectChoice}
          />
        ))}
      </Box>
    </Stack>
  );
};

interface ResultContentProps {
  resolution: ChoiceResolution;
  councillor: CouncillorProfile;
  hasNextEvent: boolean;
  onContinue: () => void;
  onReset: () => void;
}

const ResultContent: React.FC<ResultContentProps> = ({
  resolution,
  councillor,
  hasNextEvent,
  onContinue,
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
          {hasNextEvent ?
            'Fuori dalla sala, il prossimo consigliere finge di non ascoltare.'
          : 'Tutti i sigilli sono sul tavolo. Ora resta solo il decreto finale.'
          }
        </Text>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.25}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<PlayArrowIcon />}
            onClick={onContinue}
            sx={{
              ...actionButtonSx,
              minHeight: 50,
              px: 2.5,
            }}
          >
            {hasNextEvent ? 'Prossima udienza' : 'Rivela il decreto finale'}
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<RestartAltIcon />}
            onClick={onReset}
            sx={{
              minHeight: 50,
              ...outlineButtonSx,
              px: 2.5,
            }}
          >
            Ricomincia
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
};

interface EndingContentProps {
  gameState: CouncilGameState;
  ending: EndingDefinition;
  onOpenArtifact: () => void;
}

interface DefeatContentProps {
  gameState: CouncilGameState;
  defeat: DefeatDefinition;
  onReset: () => void;
}

const DefeatContent: React.FC<DefeatContentProps> = ({
  gameState,
  defeat,
  onReset,
}) => {
  return (
    <Stack gap={2.25} sx={{ flex: 1, minWidth: 0 }}>
      <Stack gap={1.25}>
        <Text
          variant="overline"
          color="#ffb49d"
          letterSpacing={0}
          fontWeight={900}
        >
          Decreto fallito
        </Text>
        <Text
          component="h1"
          sx={{
            maxWidth: 760,
            fontSize: { xs: 40, md: 54 },
            lineHeight: 0.98,
            fontWeight: 900,
            color: '#fff3cf',
            textShadow: '0 4px 28px rgb(0 0 0 / 42%)',
          }}
        >
          {defeat.title}
        </Text>
        <Text
          variant="h6"
          component="p"
          color="rgb(255 245 218 / 84%)"
          sx={{ maxWidth: 760, lineHeight: 1.45 }}
        >
          {defeat.text}
        </Text>
      </Stack>

      <Stack
        gap={1}
        sx={{
          maxWidth: 760,
          border: '1px solid rgb(229 100 75 / 32%)',
          borderRadius: 1.5,
          background: 'rgb(74 28 24 / 22%)',
          p: 1.5,
        }}
      >
        <Text
          variant="overline"
          color="#ffb49d"
          letterSpacing={0}
          fontWeight={900}
        >
          Segnaposto illustrazione
        </Text>
        <Text
          variant="body2"
          color="rgb(255 245 218 / 78%)"
          sx={{ lineHeight: 1.55 }}
        >
          {defeat.imagePrompt}
        </Text>
      </Stack>

      {gameState.latestResolution != null ?
        <Stack
          gap={1}
          sx={{
            maxWidth: 760,
            border: '1px solid rgb(232 197 111 / 24%)',
            borderRadius: 1.5,
            background: 'rgb(0 0 0 / 20%)',
            p: 1.5,
          }}
        >
          <Text variant="body1" fontWeight={900} color="#f7e4b1">
            Ultimo decreto: {gameState.latestResolution.choice.result.title}
          </Text>
          <Text
            variant="body2"
            color="rgb(255 245 218 / 74%)"
            sx={{ lineHeight: 1.5 }}
          >
            {gameState.latestResolution.choice.result.description}
          </Text>
          <StatDeltaList choice={gameState.latestResolution.choice} />
        </Stack>
      : null}

      <Button
        variant="contained"
        size="large"
        startIcon={<RestartAltIcon />}
        onClick={onReset}
        sx={{ ...actionButtonSx, alignSelf: 'flex-start', px: 2.5 }}
      >
        Nuova partita
      </Button>
    </Stack>
  );
};

const EndingContent: React.FC<EndingContentProps> = ({
  gameState,
  ending,
  onOpenArtifact,
}) => {
  return (
    <Stack gap={2.25} sx={{ flex: 1, minWidth: 0 }}>
      <Stack gap={1.25}>
        <Text
          variant="overline"
          color="#e8c56f"
          letterSpacing={0}
          fontWeight={900}
        >
          Decreto finale
        </Text>
        <Text
          component="h1"
          sx={{
            maxWidth: 760,
            fontSize: { xs: 40, md: 54 },
            lineHeight: 0.98,
            fontWeight: 900,
            color: '#fff3cf',
            textShadow: '0 4px 28px rgb(0 0 0 / 42%)',
          }}
        >
          {ending.title}
        </Text>
        <Text
          variant="h6"
          component="p"
          color="rgb(255 245 218 / 84%)"
          sx={{ maxWidth: 760, lineHeight: 1.45 }}
        >
          {ending.text}
        </Text>
        <Text
          variant="h5"
          component="p"
          color="#f7d77f"
          fontWeight={900}
          sx={{ maxWidth: 760, lineHeight: 1.25 }}
        >
          {ending.revealLine}
        </Text>
      </Stack>

      <Stack
        gap={1.25}
        sx={{
          maxWidth: 780,
          border: '1px solid rgb(232 197 111 / 28%)',
          borderRadius: 1.5,
          background: 'rgb(0 0 0 / 24%)',
          p: 1.5,
        }}
      >
        <Text
          variant="overline"
          color="#e8c56f"
          letterSpacing={0}
          fontWeight={900}
        >
          Manufatto sigillato
        </Text>
        <Text
          variant="body1"
          color="rgb(255 245 218 / 80%)"
          sx={{ lineHeight: 1.55 }}
        >
          Il Consiglio arretra di un passo. Nessuno osa rompere il sigillo al
          posto vostro.
        </Text>
        <Button
          variant="contained"
          size="large"
          startIcon={<PlayArrowIcon />}
          onClick={onOpenArtifact}
          sx={{ ...actionButtonSx, alignSelf: 'flex-start', px: 2.5 }}
        >
          Apri il manufatto
        </Button>
      </Stack>

      <Stack gap={1.25} sx={{ maxWidth: 780 }}>
        <Text
          variant="overline"
          color="#e8c56f"
          letterSpacing={0}
          fontWeight={900}
        >
          Cronaca dei decreti
        </Text>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
            gap: 1,
          }}
        >
          {gameState.history.map((resolution) => {
            const councillor =
              councillorProfiles[resolution.event.councillorId];

            return (
              <Stack
                key={resolution.event.id}
                direction="row"
                gap={1}
                sx={{
                  border: '1px solid rgb(232 197 111 / 22%)',
                  borderRadius: 1.5,
                  background: 'rgb(0 0 0 / 20%)',
                  p: 1,
                }}
              >
                <Box
                  component="img"
                  src={councillor.mugshotSrc}
                  alt=""
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    border: '1px solid rgb(232 197 111 / 34%)',
                    flex: '0 0 auto',
                  }}
                />
                <Stack gap={0.25} minWidth={0}>
                  <Text variant="caption" fontWeight={900} color="#f7e4b1">
                    {resolution.event.title}
                  </Text>
                  <Text variant="body2" color="rgb(255 245 218 / 74%)">
                    {resolution.choice.result.title}
                  </Text>
                  {resolution.earnedSigil != null ?
                    <Text variant="caption" fontWeight={900} color="#b9e6b9">
                      Sigillo conquistato
                    </Text>
                  : null}
                </Stack>
              </Stack>
            );
          })}
        </Box>
      </Stack>
    </Stack>
  );
};

interface ArtifactRevealModalProps {
  open: boolean;
  onClose: () => void;
}

const ArtifactRevealModal: React.FC<ArtifactRevealModalProps> = ({
  open,
  onClose,
}) => {
  if (!open) {
    return null;
  }

  const trailerSrc = `${revealAssets.trailerEmbedUrl}?autoplay=1&rel=0`;

  return (
    <Stack
      role="dialog"
      aria-modal="true"
      aria-label="Il manufatto si apre"
      alignItems="center"
      justifyContent="center"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 20,
        background: '#000',
        p: { xs: 1.5, md: 4 },
      }}
    >
      <Button
        variant="text"
        startIcon={<CloseIcon />}
        onClick={onClose}
        sx={{
          position: 'absolute',
          top: { xs: 12, md: 20 },
          right: { xs: 12, md: 20 },
          zIndex: 1,
          color: '#f7e4b1',
          fontFamily: 'inherit',
          fontWeight: 900,
          textTransform: 'none',
        }}
      >
        Chiudi
      </Button>
      <Box
        sx={{
          position: 'relative',
          width: 'min(1180px, 100%)',
          aspectRatio: '16 / 9',
          background: '#000',
        }}
      >
        <Box
          component="iframe"
          src={trailerSrc}
          title="Crusader Kings III trailer"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 0,
          }}
        />
      </Box>
    </Stack>
  );
};

interface MainSceneContentProps {
  gameState: CouncilGameState;
  currentEvent: CouncilEvent;
  currentCouncillor: CouncillorProfile;
  ending: EndingDefinition;
  defeat: DefeatDefinition;
  onStart: () => void;
  onContinue: () => void;
  onOpenArtifact: () => void;
  onOpenCouncillorDetail: (councillorId: CouncillorId) => void;
  onReset: () => void;
  onSelectChoice: (choice: CouncilChoice) => void;
}

const MainSceneContent: React.FC<MainSceneContentProps> = ({
  gameState,
  currentEvent,
  currentCouncillor,
  ending,
  defeat,
  onStart,
  onContinue,
  onOpenArtifact,
  onOpenCouncillorDetail,
  onReset,
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
        onOpenCouncillorDetail={onOpenCouncillorDetail}
        onSelectChoice={onSelectChoice}
      />
    );
  }

  if (gameState.phase === 'ending') {
    return (
      <EndingContent
        gameState={gameState}
        ending={ending}
        onOpenArtifact={onOpenArtifact}
      />
    );
  }

  if (gameState.phase === 'defeat') {
    return (
      <DefeatContent gameState={gameState} defeat={defeat} onReset={onReset} />
    );
  }

  if (gameState.latestResolution == null) {
    return <IntroContent onStart={onStart} />;
  }

  return (
    <ResultContent
      resolution={gameState.latestResolution}
      councillor={currentCouncillor}
      hasNextEvent={gameState.currentEventIndex < councilEvents.length - 1}
      onContinue={onContinue}
      onReset={onReset}
    />
  );
};

const StrategyGameHome: React.FC = () => {
  const [artifactOpen, setArtifactOpen] = useState(false);
  const [pendingChoice, setPendingChoice] = useState<CouncilChoice>();
  const [profileModalCouncillorId, setProfileModalCouncillorId] =
    useState<CouncillorId>();
  const [selectedCouncillorId, setSelectedCouncillorId] =
    useState<CouncillorId>('lauretana');
  const {
    musicEnabled,
    musicVolume,
    enableMusic,
    pauseMusic,
    setMusicVolume,
    toggleMusic,
  } = useBackgroundMusic(musicConfig);
  const {
    gameState,
    currentEvent,
    currentCouncillor,
    earnedSigilSet,
    gameStarted,
    hasSavedGame,
    savedGameState,
    storageReady,
    beginNewGame,
    loadCouncil,
    startCouncil,
    resetCouncil,
    continueCouncil,
    selectChoice,
  } = useCouncilGame();
  const statCards = createStatPreviews(gameState.stats);
  const selectedCouncillor = councillorProfiles[selectedCouncillorId];
  const endingDefinition =
    endingDefinitions[gameState.endingTier ?? 'noble-chaos'];
  const defeatDefinition =
    defeatDefinitions[gameState.defeatReason ?? 'stress-meltdown'];
  const profileModalCouncillor =
    profileModalCouncillorId == null ? undefined : (
      councillorProfiles[profileModalCouncillorId]
    );
  const isEndState =
    gameState.phase === 'ending' || gameState.phase === 'defeat';
  const activeFigure =
    (
      gameState.phase === 'intro' ||
      gameState.phase === 'ending' ||
      gameState.phase === 'defeat'
    ) ?
      { src: heroAssets.georgia.src, alt: heroAssets.georgia.alt }
    : { src: currentCouncillor.fullSrc, alt: currentCouncillor.fullAlt };

  const handleNewGame = () => {
    setArtifactOpen(false);
    setPendingChoice(undefined);
    setProfileModalCouncillorId(undefined);
    setSelectedCouncillorId('lauretana');
    beginNewGame();
    enableMusic();
  };

  const handleLoadGame = () => {
    if (savedGameState == null) {
      return;
    }

    const savedCouncillor =
      councilEvents[savedGameState.currentEventIndex]?.councillorId ??
      'lauretana';

    setArtifactOpen(false);
    setPendingChoice(undefined);
    setProfileModalCouncillorId(undefined);
    setSelectedCouncillorId(savedCouncillor);
    loadCouncil();
    enableMusic();
  };

  const handleStartCouncil = () => {
    setPendingChoice(undefined);
    setProfileModalCouncillorId(undefined);
    setSelectedCouncillorId(currentEvent.councillorId);
    startCouncil();
  };

  const handleResetCouncil = () => {
    setArtifactOpen(false);
    setPendingChoice(undefined);
    setProfileModalCouncillorId(undefined);
    setSelectedCouncillorId('lauretana');
    pauseMusic();
    resetCouncil();
  };

  const handleContinueCouncil = () => {
    const nextEventIndex = gameState.currentEventIndex + 1;

    setProfileModalCouncillorId(undefined);
    setPendingChoice(undefined);

    if (nextEventIndex < councilEvents.length) {
      setSelectedCouncillorId(councilEvents[nextEventIndex].councillorId);
    }

    continueCouncil();
  };

  const handleSelectChoice = (choice: CouncilChoice) => {
    setPendingChoice(choice);
  };

  const handleConfirmChoice = (choice: CouncilChoice) => {
    setPendingChoice(undefined);
    selectChoice(choice);
  };

  const shellSx = {
    minHeight: '100dvh',
    width: '100%',
    overflowX: 'hidden',
    color: '#fff7df',
    fontFamily: 'inherit',
    background:
      'radial-gradient(circle at 18% 18%, rgb(117 50 36 / 28%), transparent 32%), linear-gradient(135deg, #171111 0%, #272016 48%, #111516 100%)',
  };

  if (!gameStarted) {
    return (
      <Stack component="main" sx={shellSx}>
        <MainMenuContent
          hasSavedGame={hasSavedGame}
          savedGameState={savedGameState}
          storageReady={storageReady}
          onNewGame={handleNewGame}
          onLoadGame={handleLoadGame}
        />
      </Stack>
    );
  }

  return (
    <Stack component="main" sx={shellSx}>
      <Stack
        gap={{ xs: 1.5, sm: 1.5, md: 2 }}
        sx={{
          width: '100%',
          maxWidth: 1440,
          mx: 'auto',
          px: { xs: 2, md: 2.5 },
          py: { xs: 2, sm: 2, md: 2 },
          height: { sm: '100dvh' },
          minHeight: { xs: '100dvh', sm: 0 },
          overflow: { sm: 'hidden' },
        }}
      >
        <Stack
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'minmax(150px, 0.5fr) minmax(205px, 0.66fr) minmax(190px, 0.58fr) minmax(360px, 1.26fr)',
            },
            alignItems: 'center',
            gap: 1.25,
            flex: '0 0 auto',
          }}
        >
          <Stack direction="row" alignItems="center" gap={1.25} minWidth={0}>
            <Box
              component="img"
              src={heroAssets.calendar.src}
              alt={heroAssets.calendar.alt}
              sx={{ width: 32, height: 32, flex: '0 0 auto' }}
            />
            <Stack minWidth={0} sx={{ flex: '1 1 auto' }}>
              <Text
                variant="overline"
                letterSpacing={0}
                color="#e8c56f"
                fontWeight={800}
                noWrap
              >
                Udienza di compleanno
              </Text>
              <Text variant="body2" color="rgb(255 242 207 / 72%)" noWrap>
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
          <TopDecreeStatus />
          <StatSummaryStrip stats={statCards} />
        </Stack>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          gap={{ xs: 1.5, md: 2 }}
          sx={{
            alignItems: 'stretch',
            flex: { sm: '1 1 auto' },
            minHeight: 0,
            overflow: { sm: 'hidden' },
          }}
        >
          <Stack
            gap={2}
            sx={{
              ...panelSx,
              flex: { sm: isEndState ? '1 1 100%' : '0 0 64%' },
              width: { sm: isEndState ? '100%' : '64%' },
              minHeight: { sm: 0 },
              height: { sm: '100%' },
              position: 'relative',
              overflow: { xs: 'hidden', sm: 'auto' },
              p: { xs: 2, md: 2.25 },
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
              direction={{ xs: 'column', md: isEndState ? 'column' : 'row' }}
              gap={2}
              alignItems={isEndState ? 'center' : 'stretch'}
              sx={{ position: 'relative', zIndex: 1, height: '100%' }}
            >
              <MainSceneContent
                gameState={gameState}
                currentEvent={currentEvent}
                currentCouncillor={currentCouncillor}
                ending={endingDefinition}
                defeat={defeatDefinition}
                onStart={handleStartCouncil}
                onContinue={handleContinueCouncil}
                onOpenArtifact={() => {
                  setArtifactOpen(true);
                }}
                onOpenCouncillorDetail={(councillorId) => {
                  setProfileModalCouncillorId(councillorId);
                }}
                onReset={handleResetCouncil}
                onSelectChoice={handleSelectChoice}
              />

              {isEndState ? null : (
                <Stack
                  alignItems="center"
                  justifyContent="flex-end"
                  sx={{
                    display: { xs: 'none', lg: 'flex' },
                    minHeight: { xs: 360, md: 540 },
                    flex: { md: '0 0 190px', xl: '0 0 220px' },
                    position: 'relative',
                    pointerEvents: 'none',
                  }}
                >
                  <Box
                    component="img"
                    src={activeFigure.src}
                    alt={activeFigure.alt}
                    sx={{
                      width: { xs: 180, md: 178, xl: 210 },
                      maxHeight: { xs: 420, md: 560 },
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 28px 46px rgb(0 0 0 / 55%))',
                      pointerEvents: 'none',
                    }}
                  />
                </Stack>
              )}
            </Stack>
          </Stack>

          {isEndState ? null : (
            <Stack
              gap={1.25}
              sx={{
                flex: { sm: '1 1 36%' },
                minWidth: 0,
                minHeight: 0,
                height: { sm: '100%' },
                overflowX: 'hidden',
                overflowY: { sm: 'auto' },
                pr: { sm: 0.5 },
                pb: { sm: 0.5 },
              }}
            >
              <Stack
                gap={1.1}
                sx={{
                  ...panelSx,
                  p: { xs: 1.5, md: 1.75 },
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
                      sm: 'repeat(2, minmax(0, 1fr))',
                      md: 'repeat(5, minmax(0, 1fr))',
                    },
                    gap: 0.7,
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
                  inAudience={
                    gameState.phase !== 'ending' &&
                    gameState.phase !== 'defeat' &&
                    selectedCouncillorId === currentEvent.councillorId
                  }
                  onOpenDetails={setProfileModalCouncillorId}
                />
              </Stack>
            </Stack>
          )}
        </Stack>
      </Stack>
      <DecisionConfirmationModal
        choice={pendingChoice}
        councillor={currentCouncillor}
        onCancel={() => {
          setPendingChoice(undefined);
        }}
        onConfirm={handleConfirmChoice}
      />
      <CouncillorProfileModal
        councillor={profileModalCouncillor}
        onClose={() => {
          setProfileModalCouncillorId(undefined);
        }}
      />
      <ArtifactRevealModal
        open={artifactOpen}
        onClose={() => {
          setArtifactOpen(false);
        }}
      />
    </Stack>
  );
};

export default memo(StrategyGameHome);
