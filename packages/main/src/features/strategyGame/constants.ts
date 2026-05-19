import type {
  CouncilSealPreview,
  CouncilEvent,
  CouncillorId,
  CouncillorProfile,
  EndingDefinition,
  EndingTier,
  GameStats,
  HeroAsset,
  MusicConfig,
  RevealAssets,
  StatPreview,
  StatLevel,
} from './types';

const publicBasePath =
  process.env.NODE_ENV === 'development' ? '' : '/bug-free-broccoli';

const publicAsset = (assetPath: `/${string}`) =>
  `${publicBasePath}${assetPath}`;

export const statValueLabels: Record<StatLevel, string> = {
  1: 'Basso',
  2: 'Medio',
  3: 'Alto',
};

export const initialGameStats: GameStats = {
  stress: 2,
  gold: 2,
  harmony: 2,
  suspicion: 2,
};

export const councilGameStorageKey = 'genetliaco:council-game-state:v2';

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

export const revealAssets: RevealAssets = {
  giftJumbo: {
    src: publicAsset('/gift-jumbo.png'),
    alt: 'Crusader Kings III Starter Edition',
  },
  giftBundle: {
    src: publicAsset('/gift-bundle.png'),
    alt: 'Contenuto del bundle Crusader Kings III Starter Edition',
  },
  trailerEmbedUrl: 'https://www.youtube.com/embed/xjn66Cl3pMA',
};

export const statDefinitions: Omit<StatPreview, 'value' | 'valueLabel'>[] = [
  {
    key: 'stress',
    label: 'Stress',
    iconSrc: publicAsset('/stats-soul-tearing-32.png'),
    tone: 'danger',
  },
  {
    key: 'gold',
    label: 'Oro',
    iconSrc: publicAsset('/stats-gold-coins-32.png'),
    tone: 'wealth',
  },
  {
    key: 'harmony',
    label: 'Armonia',
    iconSrc: publicAsset('/stats-golden-crown-32.png'),
    tone: 'harmony',
  },
  {
    key: 'suspicion',
    label: 'Sospetto',
    iconSrc: publicAsset('/stats-rusty-crown-32.png'),
    tone: 'intrigue',
  },
];

export const createStatPreviews = (stats: GameStats): StatPreview[] =>
  statDefinitions.map((stat) => ({
    ...stat,
    value: stats[stat.key],
    valueLabel: statValueLabels[stats[stat.key]],
  }));

export const statPreviews = createStatPreviews(initialGameStats);

export const councillorOrder: CouncillorId[] = [
  'lauretana',
  'giommaria',
  'alessandro',
  'roberta',
  'phabous',
];

export const councillorProfiles: Record<CouncillorId, CouncillorProfile> = {
  lauretana: {
    id: 'lauretana',
    name: 'Lauretana da Grosseto',
    role: 'Amministratrice',
    traits: ['Frugale', 'Diligente', 'Testarda'],
    motto: 'Ogni moneta ha una fonte. Ogni fonte ha una nota a pie pagina.',
    detail:
      'Lauretana considera ogni spreco un piccolo tradimento feudale. Pretende ricevute, fonti e sigilli con la stessa calma con cui altri chiedono acqua. Se una spesa non torna, la trova prima del cameriere.',
    fullSrc: publicAsset('/character-full-lauretana-200-560.png'),
    fullAlt: 'Lauretana da Grosseto, amministratrice del Consiglio',
    mugshotSrc: publicAsset('/character-mugshot-lauretana-96.png'),
    sealSrc: publicAsset(
      '/extras/council-seal-steward-keys-active-140-129.png',
    ),
    inactiveSealSrc: publicAsset(
      '/extras/council-seal-steward-keys-inactive-152-134.png',
    ),
  },
  giommaria: {
    id: 'giommaria',
    name: 'Giommaria il Locandiere',
    role: 'Maestro di Spie',
    traits: ['Impaziente', 'Ambizioso', 'Avventuriero'],
    motto: 'Nessuno entra in locanda senza lasciare almeno un gancio.',
    detail:
      'Giommaria vede ogni locanda come un ufficio informazioni con vino incluso. La sua rete arriva ovunque, ma ogni incarico rischia di diventare una spedizione corsara con ricevuta impossibile.',
    fullSrc: publicAsset('/character-full-giommaria-200-560.png'),
    fullAlt: 'Giommaria il Locandiere, maestro di spie',
    mugshotSrc: publicAsset('/character-mugshot-giommaria-96.png'),
    sealSrc: publicAsset('/extras/council-seal-spymaster-network-124-139.png'),
  },
  alessandro: {
    id: 'alessandro',
    name: 'Alessandro di Monza',
    role: 'Maresciallo',
    traits: ['Brillante Stratega', 'Coraggioso', 'Astuto'],
    motto: 'Il morale e il vantaggio decidono ogni campagna.',
    detail:
      'Alessandro pianifica anche una merenda come se fosse una campagna militare. Le sedie diventano fortezze, il dolce un obiettivo, e il morale una risorsa sacra.',
    fullSrc: publicAsset('/character-full-alessandro-200-560.png'),
    fullAlt: 'Alessandro di Monza, maresciallo del Consiglio',
    mugshotSrc: publicAsset('/character-mugshot-alessandro-96.png'),
    sealSrc: publicAsset('/extras/council-seal-marshal-mace-124-139.png'),
  },
  roberta: {
    id: 'roberta',
    name: 'Donna Roberta di Modena',
    role: 'Cancelliera',
    traits: ['Gregaria', 'Compassionevole', 'Cronista'],
    motto:
      'Un regno resta in piedi se qualcuno ricorda di invitare tutti al banchetto.',
    detail:
      'Roberta salva la diplomazia con inviti, miti e una memoria di corte pericolosamente precisa. Dove altri vedono protocollo, lei vede persone che vogliono sentirsi incluse.',
    fullSrc: publicAsset('/character-full-roberta-200-560.png'),
    fullAlt: 'Donna Roberta di Modena, cancelliera del Consiglio',
    mugshotSrc: publicAsset('/character-mugshot-roberta-96.png'),
    sealSrc: publicAsset('/extras/council-seal-chancellor-scroll-119-130.png'),
  },
  phabous: {
    id: 'phabous',
    name: 'Phabous Koleman',
    role: 'Sacerdote / Eretico',
    traits: ['Erudito', 'Eccentrico', 'Cinico'],
    motto: 'Mostratemi il miracolo, poi controllerò il metodo sperimentale.',
    detail:
      'Phabous accetta il sacro con riserva metodologica. Porta calcoli, alambicchi e una certezza fastidiosa: senza prova empirica, anche un miracolo resta una bozza.',
    fullSrc: publicAsset('/character-full-phabous-200-560.png'),
    fullAlt: 'Phabous Koleman, sacerdote eretico del Consiglio',
    mugshotSrc: publicAsset('/character-mugshot-phabous-96.png'),
    sealSrc: publicAsset(
      '/extras/council-seal-priest-astral-artifact-117-138.png',
    ),
  },
};

const councilSealNames: Record<CouncillorId, string> = {
  lauretana: 'Lauretana',
  giommaria: 'Giommaria',
  alessandro: 'Alessandro',
  roberta: 'Roberta',
  phabous: 'Phabous',
};

export const councilSealPreviews: CouncilSealPreview[] = councillorOrder.map(
  (councillorId) => {
    const councillor = councillorProfiles[councillorId];

    return {
      id: councillor.id,
      name: councilSealNames[councillorId],
      role: councillor.role,
      sealSrc: councillor.sealSrc,
      inactiveSealSrc: councillor.inactiveSealSrc,
    };
  },
);

export const councilEvents: CouncilEvent[] = [
  {
    id: 'lauretana-ledgers',
    councillorId: 'lauretana',
    eyebrow: 'Prima udienza',
    title: 'Il Bilancio del Genetliaco',
    setup:
      'Lauretana depone sul tavolo un registro più pesante di una corona imperiale. Le casse possono sostenere candele, corrieri e un acquisto misterioso, ma solo se ogni moneta viene scortata da ricevute sigillate e fonti impeccabili.',
    choices: [
      {
        id: 'triple-receipts',
        label: 'Autorizza la spesa, ma con ricevute in triplice copia.',
        preview: '-Oro, -Sospetto',
        statDeltas: { gold: -1, suspicion: -1 },
        awardsSigil: true,
        result: {
          title: 'Contabilità inattaccabile',
          description:
            'Lauretana annuisce. Nessuno sa cosa sia stato comprato, ma tutti sanno dove archiviare la ricevuta.',
        },
      },
      {
        id: 'save-the-treasury',
        label: 'Risparmia sul banchetto e salva le casse.',
        preview: '+Oro, -Armonia',
        statDeltas: { gold: 1, harmony: -1 },
        awardsSigil: false,
        result: {
          title: 'Il Tesoro respira',
          description:
            'Il Tesoro respira. Gli invitati, meno: qualcuno inizia a sospettare che il buffet sia stato tassato.',
        },
      },
      {
        id: 'miscellaneous-line',
        label: "Nascondi la voce sotto 'varie ed eventuali'.",
        preview: '+Stress, +Sospetto',
        statDeltas: { stress: 1, suspicion: 1 },
        awardsSigil: false,
        result: {
          title: 'Scomunica contabile',
          description:
            "Lauretana trova l'anomalia in otto secondi. Il silenzio successivo ha il peso di una scomunica contabile.",
        },
      },
    ],
  },
  {
    id: 'giommaria-inn-hooks',
    councillorId: 'giommaria',
    eyebrow: 'Seconda udienza',
    title: "Ganci nelle Locande d'Oriente",
    setup:
      "Giommaria arriva con una mappa macchiata di vino e una lista di persone che gli devono favori. I corrieri dell'artefatto possono passare inosservati, a patto che la rete di locande non trasformi la copertura in una spedizione corsara.",
    choices: [
      {
        id: 'sealed-hooks',
        label: 'Attiva i ganci, ma tieni tu il sigillo reale.',
        preview: '-Oro, -Sospetto',
        statDeltas: { gold: -1, suspicion: -1 },
        awardsSigil: true,
        result: {
          title: 'Ombre ben pagate',
          description:
            'La rete si muove nella notte. Giommaria sorride: abbastanza libertà da divertirsi, non abbastanza da fondare una contea pirata.',
        },
      },
      {
        id: 'royal-cellars',
        label: 'Apri le cantine reali agli informatori.',
        preview: '-Stress, +Sospetto',
        statDeltas: { stress: -1, suspicion: 1 },
        awardsSigil: false,
        result: {
          title: 'Brindisi pericolosi',
          description:
            'Le informazioni arrivano abbondanti, insieme a tre canzoni e a un brindisi che contiene troppi indizi.',
        },
      },
      {
        id: 'norse-cover-raid',
        label: 'Inscena una razzia norrena di copertura.',
        preview: '+Stress, -Sospetto',
        statDeltas: { stress: 1, suspicion: -1 },
        awardsSigil: false,
        result: {
          title: 'Predoni da corridoio',
          description:
            "Nessuno parla più dell'artefatto. Tutti parlano però dei finti predoni nel corridoio.",
        },
      },
    ],
  },
  {
    id: 'alessandro-surprise-campaign',
    councillorId: 'alessandro',
    eyebrow: 'Terza udienza',
    title: 'La Campagna della Sorpresa',
    setup:
      'Alessandro schiera una mappa tattica della sala da pranzo. Le sedie diventano fortezze, il dolce un obiettivo strategico, e il morale degli alleati deve reggere fino al segnale convenuto.',
    choices: [
      {
        id: 'disciplined-campaign',
        label: 'Approva il piano, ma vieta assedi al buffet.',
        preview: '-Stress, +Armonia',
        statDeltas: { stress: -1, harmony: 1 },
        awardsSigil: true,
        result: {
          title: 'Fronte sotto controllo',
          description:
            'Il Maresciallo accetta la disciplina. Per la prima volta, la linea del fronte coincide con il buon senso.',
        },
      },
      {
        id: 'full-war-council',
        label: 'Convoca un consiglio di guerra completo.',
        preview: '+Stress, +Armonia',
        statDeltas: { stress: 1, harmony: 1 },
        awardsSigil: false,
        result: {
          title: 'Promozioni improvvise',
          description:
            'Tutti ricevono un ruolo. Anche chi voleva solo sedersi viene promosso a comandante del tovagliolo sinistro.',
        },
      },
      {
        id: 'kitchen-charge',
        label: 'Ordina una carica preventiva verso la cucina.',
        preview: '+Stress, -Oro',
        statDeltas: { stress: 1, gold: -1 },
        awardsSigil: false,
        result: {
          title: 'Cucina conquistata',
          description:
            'La cucina cade in pochi minuti. La misura strategica, purtroppo, resta dispersa dietro le linee.',
        },
      },
    ],
  },
  {
    id: 'roberta-banquet-diplomacy',
    councillorId: 'roberta',
    eyebrow: 'Quarta udienza',
    title: 'Diplomazia da Banchetto',
    setup:
      'Donna Roberta porta inviti, miti e una calma psicologica che potrebbe pacificare due casate rivali. La sorpresa richiede calore umano, una leggenda condivisa e nessun nobile dimenticato fuori dalla sala.',
    choices: [
      {
        id: 'shared-legend',
        label: 'Fai aggiungere a ciascuno un verso alla leggenda.',
        preview: '+Armonia, -Stress',
        statDeltas: { harmony: 1, stress: -1 },
        awardsSigil: true,
        result: {
          title: 'Mito collettivo',
          description:
            'La storia diventa collettiva, caotica e molto vostra. Roberta prende nota come se stesse salvando il patrimonio culturale.',
        },
      },
      {
        id: 'lavish-banquet',
        label: 'Organizza un banchetto impeccabile e costosissimo.',
        preview: '+Armonia, -Oro',
        statDeltas: { harmony: 1, gold: -1 },
        awardsSigil: false,
        result: {
          title: 'Protocollo splendente',
          description:
            'Gli invitati applaudono, il Tesoro tossisce, e Roberta salva entrambi con un sorriso diplomatico.',
        },
      },
      {
        id: 'optional-invitations',
        label: 'Dichiara facoltativa la diplomazia degli inviti.',
        preview: '-Armonia, +Sospetto',
        statDeltas: { harmony: -1, suspicion: 1 },
        awardsSigil: false,
        result: {
          title: 'Serenità terrificante',
          description:
            'Roberta annota la frase con una serenità terrificante. Qualcuno nota subito chi non è stato invitato.',
        },
      },
    ],
  },
  {
    id: 'phabous-artifact-heresy',
    councillorId: 'phabous',
    eyebrow: 'Quinta udienza',
    title: "L'Eresia dell'Artefatto",
    setup:
      "Phabous posa sul tavolo calcoli, diagrammi e una candela usata come variabile di controllo. L'artefatto è quasi pronto, ma nessun miracolo verrà riconosciuto senza prova empirica e almeno una piccola eresia metodologica.",
    choices: [
      {
        id: 'peer-review',
        label: '[Erudita] Pretendi una revisione tra pari.',
        preview: '-Stress, -Sospetto',
        statDeltas: { stress: -1, suspicion: -1 },
        awardsSigil: true,
        result: {
          title: 'Eresia verificata',
          description:
            "L'eresia funziona. Tra formule e sigilli emerge una verità quasi pronta, ma ancora abbastanza nascosta.",
        },
      },
      {
        id: 'controlled-experiment',
        label: 'Concedi un esperimento controllato, lontano dalle tende.',
        preview: '+Armonia, -Oro',
        statDeltas: { harmony: 1, gold: -1 },
        awardsSigil: false,
        result: {
          title: 'Scintilla contenuta',
          description:
            'Una scintilla conferma la teoria. Le tende restano nel regno dei vivi, che tutti considerano un successo.',
        },
      },
      {
        id: 'declare-miracle',
        label: 'Dichiara il miracolo e chiudi il laboratorio.',
        preview: '+Stress, +Sospetto',
        statDeltas: { stress: 1, suspicion: 1 },
        awardsSigil: false,
        result: {
          title: 'Metodologia insufficiente',
          description:
            "Phabous obbedisce, ma scrive 'metodologia insufficiente' su una pergamena abbastanza lunga da destare sospetti.",
        },
      },
    ],
  },
];

export const endingDefinitions: Record<EndingTier, EndingDefinition> = {
  'dynastic-triumph': {
    tier: 'dynastic-triumph',
    title: 'Trionfo Dinastico',
    text: 'Il Consiglio trattiene il respiro. I sigilli sono allineati, il reame è stabile, e perfino Lauretana non trova una nota spese fuori posto.',
    revealLine: 'Hai vinto Crusader Kings III: il bundle reale ti attende!',
  },
  'noble-chaos': {
    tier: 'noble-chaos',
    title: 'Un Nobile Caos',
    text: 'Qualche indizio è trapelato, un piano è quasi esploso, ma la corte è ancora in piedi. Il Consiglio decide che questo, in fondo, è pienamente in stile CK3.',
    revealLine:
      'Sorpresa: il misterioso artefatto è il bundle di Crusader Kings III!',
  },
  'last-resort': {
    tier: 'last-resort',
    title: "L'Ultima Spiaggia",
    text: 'La finzione medievale collassa sotto il peso dei decreti. Il Consiglio rompe il personaggio, chiede perdono per il roleplay troppo elaborato e consegna direttamente il dono.',
    revealLine: 'Buon compleanno, Regina Georgia: il CK3 bundle è tuo.',
  },
};

export const openingLines = [
  'Mia Signora, il Vostro Genetliaco si avvicina.',
  'Il Consiglio richiede udienza per un manufatto antico e segreto da scoprire.',
  'Cinque udienze, tre decreti per volta: mantenete il regno in equilibrio e custodite la sorpresa fino al sigillo finale.',
] as const;
