import {
  Activity, BadgeDollarSign, BarChart3, BookOpen, Bot, ChartCandlestick, ChartLine, ChartNoAxesCombined,
  CircleHelp, Clapperboard, Coins, Dices, Download, GalleryVerticalEnd, Gamepad2, Goal, Handshake, KeyRound,
  Layers3, MessageSquare, Mountain, Newspaper, PenTool, Presentation, Radio, Rocket, RotateCcw, ScanSearch,
  Sparkles, Trophy, UserRound, Users, WalletCards, X as XLogo, type LucideIcon,
} from "lucide-react";

export type NavItem = {
  id: string;
  name: string;
  href: string;
  description: string;
  icon: LucideIcon;
  beta?: boolean;
  match?: { paths: readonly string[]; exact?: boolean };
};

export type NavSection = {
  id: string;
  name: string;
  description: string;
  items: readonly NavItem[];
};

export type NavGroup = {
  id: "games" | "build" | "explore";
  name: string;
  description: string;
  sections: readonly NavSection[];
};

export const NAV_ITEMS = {
  markets: {
    id: "markets",
    name: "Markets",
    href: "/markets",
    description: "Trade live price windows.",
    icon: ChartLine,
    match: { paths: ["/markets", "/markets-live"] },
  },
  reels: { id: "reels", name: "Reels", href: "/reels", description: "Scan market stories quickly.", icon: GalleryVerticalEnd },
  games: {
    id: "games",
    name: "Games",
    href: "/games",
    description: "Play every market-powered game.",
    icon: Gamepad2,
  },
  gamesHub: {
    id: "games-hub",
    name: "Games hub",
    href: "/games",
    description: "Choose a mode or resume a run.",
    icon: Gamepad2,
    match: { paths: ["/games"], exact: true },
  },
  practice: {
    id: "practice",
    name: "Practice",
    href: "/games/practice",
    description: "Learn the swipe loop without stakes.",
    icon: Goal,
    match: { paths: ["/games/practice"], exact: true },
  },
  duel: {
    id: "duel",
    name: "Duel",
    href: "/games/duel",
    description: "Face another player over a live deck.",
    icon: Handshake,
    match: { paths: ["/games/duel"], exact: true },
  },
  lucky: {
    id: "lucky",
    name: "Lucky",
    href: "/games/lucky",
    description: "Let the reel find a live market call.",
    icon: Dices,
    match: { paths: ["/games/lucky"], exact: true },
  },
  range: {
    id: "range",
    name: "Range",
    href: "/games/range",
    description: "Pick the band where price should finish.",
    icon: Layers3,
    match: { paths: ["/games/range"], exact: true },
  },
  moonshot: {
    id: "moonshot",
    name: "Moonshot",
    href: "/games/moonshot",
    description: "Aim for a distant price target.",
    icon: Rocket,
    match: { paths: ["/games/moonshot"], exact: true },
  },
  lineRider: {
    id: "line-rider",
    name: "Line Rider",
    href: "/games/line-rider",
    description: "Ride the line and build a combo.",
    icon: ChartNoAxesCombined,
    match: { paths: ["/games/line-rider"], exact: true },
  },
  candleHop: {
    id: "candle-hop",
    name: "Candle Hop",
    href: "/games/candle-hop",
    description: "Hop through a candlestick run.",
    icon: Mountain,
    match: { paths: ["/games/candle-hop"], exact: true },
  },
  portfolio: {
    id: "portfolio",
    name: "Portfolio",
    href: "/portfolio",
    description: "Track positions, money, and activity.",
    icon: WalletCards,
    match: { paths: ["/portfolio"], exact: true },
  },
  create: {
    id: "create",
    name: "Create",
    href: "/creator/studio",
    description: "Create and publish a market.",
    icon: Sparkles,
    match: { paths: ["/creator/studio"], exact: true },
  },
  creators: {
    id: "creators",
    name: "Creators",
    href: "/creators",
    description: "Discover creator-led markets.",
    icon: Users,
  },
  creatorRecovery: {
    id: "creator-recovery",
    name: "Creator recovery",
    href: "/creator/recover",
    description: "Recover a creator identity safely.",
    icon: RotateCcw,
  },
  strategies: {
    id: "strategies",
    name: "Strategies",
    href: "/strategies",
    description: "Explore repeatable trading approaches.",
    icon: Bot,
    beta: true,
  },
  agents: { id: "agents", name: "Agents", href: "/agents", description: "Manage automated market agents.", icon: Bot },
  studio: {
    id: "studio",
    name: "Playbook Studio",
    href: "/studio",
    description: "Shape reusable market playbooks.",
    icon: PenTool,
  },
  xTrade: {
    id: "x-trade",
    name: "X-trade",
    href: "/trade-from-x",
    description: "Turn a post into a bounded trade.",
    icon: XLogo,
  },
  earn: { id: "earn", name: "Earn", href: "/earn", description: "Put capital into earning opportunities.", icon: Coins },
  parlay: {
    id: "parlay",
    name: "Parlay",
    href: "/parlay",
    description: "Combine several market outcomes.",
    icon: ChartNoAxesCombined,
  },
  sensei: {
    id: "sensei",
    name: "Sensei",
    href: "/markets?sensei=1",
    description: "Ask the market assistant.",
    icon: MessageSquare,
    match: { paths: [] },
  },
  social: { id: "social", name: "Social", href: "/social", description: "Follow the market conversation.", icon: Radio },
  leaderboard: {
    id: "leaderboard",
    name: "Leaderboard",
    href: "/leaderboard",
    description: "See the strongest verified records.",
    icon: Trophy,
  },
  waitlist: {
    id: "waitlist",
    name: "Waitlist",
    href: "/waitlist",
    description: "Manage early-access membership.",
    icon: UserRound,
  },
  stats: { id: "stats", name: "Stats", href: "/stats", description: "Inspect protocol and market activity.", icon: BarChart3 },
  surface: {
    id: "surface",
    name: "Market Surface",
    href: "/surface",
    description: "Read the market structure at a glance.",
    icon: ScanSearch,
  },
  edge: {
    id: "edge",
    name: "Trader Edge",
    href: "/portfolio/edge",
    description: "Review your trading edge report.",
    icon: ChartCandlestick,
  },
  news: { id: "news", name: "News", href: "/news", description: "Follow the stories moving markets.", icon: Newspaper },
  howItWorks: {
    id: "how-it-works",
    name: "How it works",
    href: "/how-it-works",
    description: "Understand the product from end to end.",
    icon: CircleHelp,
  },
  docs: { id: "docs", name: "Docs", href: "/docs", description: "Read technical and product documentation.", icon: BookOpen },
  status: {
    id: "status",
    name: "Status",
    href: "/status",
    description: "Check connected services and contracts.",
    icon: Activity,
  },
  download: {
    id: "download",
    name: "Download",
    href: "/download",
    description: "Install Masayume as a web app.",
    icon: Download,
  },
  demo: { id: "demo", name: "Demo", href: "/demo", description: "Walk through the complete product story.", icon: Clapperboard },
  pitch: { id: "pitch", name: "Pitch", href: "/pitch", description: "Read the concise Masayume thesis.", icon: Presentation },
  claims: { id: "claims", name: "Claims", href: "/claims", description: "Collect winnings ready for redemption.", icon: BadgeDollarSign },
  fund: { id: "fund", name: "Add funds", href: "/fund", description: "Fund the wallet used for market actions.", icon: Coins },
  xRecovery: {
    id: "x-recovery",
    name: "X recovery",
    href: "/claim",
    description: "Recover a trade created from X.",
    icon: KeyRound,
  },
} as const satisfies Record<string, NavItem>;

export const GAMES_GROUP: NavGroup = {
  id: "games",
  name: "Games",
  description: "Practice, predict, or chase an arcade score.",
  sections: [
    {
      id: "games-start",
      name: "Start",
      description: "Choose or learn",
      items: [NAV_ITEMS.gamesHub, NAV_ITEMS.practice],
    },
    {
      id: "games-prediction",
      name: "Prediction",
      description: "Market-backed play",
      items: [NAV_ITEMS.duel, NAV_ITEMS.lucky, NAV_ITEMS.range, NAV_ITEMS.moonshot],
    },
    {
      id: "games-arcade",
      name: "Arcade",
      description: "Score-only runs",
      items: [NAV_ITEMS.lineRider, NAV_ITEMS.candleHop],
    },
  ],
};

const BUILD_SECTIONS: readonly NavSection[] = [
  {
    id: "create",
    name: "Create",
    description: "Markets and identity",
    items: [NAV_ITEMS.create, NAV_ITEMS.creators, NAV_ITEMS.creatorRecovery],
  },
  {
    id: "automate",
    name: "Automate",
    description: "Playbooks and agents",
    items: [NAV_ITEMS.strategies, NAV_ITEMS.agents, NAV_ITEMS.studio, NAV_ITEMS.xTrade],
  },
];

export const BUILD_GROUP: NavGroup = {
  id: "build",
  name: "Build",
  description: "Create markets and automate how you trade.",
  sections: BUILD_SECTIONS,
};

export const EXPLORE_GROUP: NavGroup = {
  id: "explore",
  name: "Explore",
  description: "Trade tools, community, proof, and product knowledge.",
  sections: [
    {
      id: "trade",
      name: "Trade",
      description: "More ways to make a call",
      items: [NAV_ITEMS.earn, NAV_ITEMS.parlay, NAV_ITEMS.sensei],
    },
    {
      id: "community",
      name: "Community",
      description: "People and records",
      items: [NAV_ITEMS.social, NAV_ITEMS.leaderboard, NAV_ITEMS.waitlist],
    },
    {
      id: "proof",
      name: "Proof",
      description: "Market evidence",
      items: [NAV_ITEMS.stats, NAV_ITEMS.surface, NAV_ITEMS.edge],
    },
    {
      id: "learn",
      name: "Learn",
      description: "Guidance and context",
      items: [NAV_ITEMS.news, NAV_ITEMS.howItWorks, NAV_ITEMS.docs, NAV_ITEMS.status, NAV_ITEMS.download, NAV_ITEMS.demo, NAV_ITEMS.pitch],
    },
  ],
};

export const ACCOUNT_SECTION: NavSection = {
  id: "account",
  name: "Account",
  description: "Money and recovery",
  items: [NAV_ITEMS.claims, NAV_ITEMS.fund, NAV_ITEMS.xRecovery],
};

export type DesktopNavEntry = { kind: "link"; item: NavItem } | { kind: "group"; group: NavGroup };

export const DESKTOP_NAV: readonly DesktopNavEntry[] = [
  { kind: "link", item: NAV_ITEMS.markets },
  { kind: "link", item: NAV_ITEMS.reels },
  { kind: "group", group: GAMES_GROUP },
  { kind: "group", group: BUILD_GROUP },
  { kind: "group", group: EXPLORE_GROUP },
  { kind: "link", item: NAV_ITEMS.portfolio },
];

export const MOBILE_NAV: readonly NavItem[] = [NAV_ITEMS.markets, NAV_ITEMS.reels, NAV_ITEMS.games, NAV_ITEMS.portfolio];
export const MOBILE_DRAWER_SECTIONS: readonly NavSection[] = [
  ...GAMES_GROUP.sections,
  ...BUILD_GROUP.sections,
  ...EXPLORE_GROUP.sections,
  ACCOUNT_SECTION,
];
export const MOBILE_OVERFLOW: readonly NavItem[] = MOBILE_DRAWER_SECTIONS.flatMap((section) => section.items);

/** Every real, user-facing page that must retain an explicit navigation home. */
export const NAVIGABLE_ROUTE_PATHS = [
  "/agents", "/claim", "/claims", "/creator/recover", "/creator/studio", "/creators", "/demo", "/docs",
  "/download", "/earn", "/fund", "/games", "/games/candle-hop", "/games/duel", "/games/line-rider",
  "/games/lucky", "/games/moonshot", "/games/practice", "/games/range", "/how-it-works", "/leaderboard",
  "/markets", "/news", "/parlay", "/pitch", "/portfolio", "/portfolio/edge", "/reels", "/social", "/stats",
  "/status", "/strategies", "/studio", "/surface", "/trade-from-x", "/waitlist",
] as const;

/** The X-trade island keeps its own visual chrome but reads routes from this same registry. */
export const ISLAND_NAV: readonly NavItem[] = [
  NAV_ITEMS.markets,
  NAV_ITEMS.reels,
  NAV_ITEMS.games,
  NAV_ITEMS.strategies,
  NAV_ITEMS.leaderboard,
  NAV_ITEMS.portfolio,
];

export function isActiveNavItem(pathname: string | null, item: NavItem): boolean {
  if (!pathname) return false;
  const fallbackPath = item.href.split("?")[0] ?? item.href;
  const match = item.match ?? { paths: [fallbackPath] };
  return match.paths.some((path) => pathname === path || (!match.exact && pathname.startsWith(`${path}/`)));
}

export function isActiveNavGroup(pathname: string | null, group: NavGroup): boolean {
  return group.sections.some((section) => section.items.some((item) => isActiveNavItem(pathname, item)));
}
