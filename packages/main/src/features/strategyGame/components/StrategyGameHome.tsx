'use client';

import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { memo, useState } from 'react';
import Box from '@swiftpost/elysium/ui/base/Box';
import Button from '@swiftpost/elysium/ui/base/Button';
import Stack from '@swiftpost/elysium/ui/base/Stack';
import Text from '@swiftpost/elysium/ui/base/Text';
import {
  councilSealPreviews,
  gameSubtitle,
  gameTitle,
  heroAssets,
  musicConfig,
  openingLines,
  statPreviews,
} from '../constants';
import type { CouncilSealPreview, StatPreview, StatTone } from '../types';
import { useBackgroundMusic } from '../hooks';

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
        {[0, 1, 2].map((pipIndex) => (
          <Box
            key={pipIndex}
            sx={{
              width: 22,
              height: 8,
              borderRadius: 99,
              background:
                pipIndex < 2 ? toneStyle.color : 'rgb(255 255 255 / 18%)',
              boxShadow: pipIndex < 2 ? `0 0 16px ${toneStyle.color}` : 'none',
            }}
          />
        ))}
      </Stack>
    </Stack>
  );
};

interface CouncilSealProps {
  seal: CouncilSealPreview;
}

const CouncilSeal: React.FC<CouncilSealProps> = ({ seal }) => {
  return (
    <Stack alignItems="center" gap={0.75} sx={{ minWidth: 86 }}>
      <Box
        component="img"
        src={seal.sealSrc}
        alt={`Sigillo di ${seal.name}`}
        sx={{
          width: 58,
          height: 58,
          objectFit: 'contain',
          filter:
            seal.id === 'lauretana' ? 'none' : 'grayscale(1) opacity(0.58)',
        }}
      />
      <Text
        variant="caption"
        fontWeight={800}
        color="#fff2cf"
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
        {seal.role}
      </Text>
    </Stack>
  );
};

const StrategyGameHome: React.FC = () => {
  const [councilSummoned, setCouncilSummoned] = useState(false);
  const { musicEnabled, musicVolume, setMusicVolume, toggleMusic } =
    useBackgroundMusic(musicConfig);

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
              <Stack
                gap={2}
                justifyContent="space-between"
                sx={{ flex: 1, minWidth: 0 }}
              >
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
                      fontSize: 52,
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
                    onClick={() => {
                      setCouncilSummoned(true);
                    }}
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
                  <Text
                    variant="body2"
                    color={
                      councilSummoned ? '#b9e6b9' : 'rgb(255 242 207 / 68%)'
                    }
                  >
                    {councilSummoned ?
                      'La sala è pronta. Le udienze arriveranno nel prossimo passo.'
                    : 'Avvio scenico pronto: musica, sigilli e sala sono già funzionanti.'
                    }
                  </Text>
                </Stack>
              </Stack>

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
                  src={heroAssets.georgia.src}
                  alt={heroAssets.georgia.alt}
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
                  Stato iniziale del reame
                </Text>
                <Text variant="body2" color="rgb(255 242 207 / 70%)">
                  2 / 3
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
                {statPreviews.map((stat) => (
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
                  <CouncilSeal key={seal.id} seal={seal} />
                ))}
              </Box>
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
