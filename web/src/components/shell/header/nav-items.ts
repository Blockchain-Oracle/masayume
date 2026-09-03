import {
  Activity,
  BarChart3,
  BookOpen,
  Bot,
  ChartCandlestick,
  ChartLine,
  ChartNoAxesCombined,
  CircleHelp,
  Download,
  GalleryVerticalEnd,
  Gamepad2,
  MessageSquare,
  Newspaper,
  ScanSearch,
  Sparkles,
  Trophy,
  WalletCards,
  X as XLogo,
  type LucideIcon,
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
  id: "build" | "explore";
  name: string;
  description: string;
  sections: readonly NavSection[];
};

export const NAV_ITEMS = {
  markets: { id: "markets", name: "Markets", href: "/markets", description: "Trade live price windows.", icon: ChartLine, match: { paths: ["/markets", "/markets-live"] } },
  reels: { id: "reels", name: "Reels", href: "/reels", description: "Scan market stories quickly.", icon: GalleryVerticalEnd },
  games: { id: "games", name: "Games", href: "/games", description: "Play market-powered games.", icon: Gamepad2 },
  portfolio: { id: "portfolio", name: "Portfolio", href: "/portfolio", description: "Track positions, money, and activity.", icon: WalletCards, match: { paths: ["/portfolio"], exact: true } },
  create: { id: "create", name: "Create", href: "/creator/studio", description: "Create and publish a market.", icon: Sparkles, match: { paths: ["/creator/studio", "/creators"] } },
  strategies: { id: "strategies", name: "Strategies", href: "/strategies", description: "Explore repeatable trading approaches.", icon: Bot, beta: true },
  agents: { id: "agents", name: "Agents", href: "/agents", description: "Manage automated market agents.", icon: Bot },
  xTrade: { id: "x-trade", name: "X-trade", href: "/trade-from-x", description: "Turn a post into a bounded trade.", icon: XLogo },
  parlay: { id: "parlay", name: "Parlay", href: "/parlay", description: "Combine several market outcomes.", icon: ChartNoAxesCombined },
  sensei: { id: "sensei", name: "Sensei", href: "/markets?sensei=1", description: "Ask the market assistant.", icon: MessageSquare, match: { paths: [] } },
  leaderboard: { id: "leaderboard", name: "Leaderboard", href: "/leaderboard", description: "See the strongest verified records.", icon: Trophy },
  stats: { id: "stats", name: "Stats", href: "/stats", description: "Inspect protocol and market activity.", icon: BarChart3 },
  surface: { id: "surface", name: "Market Surface", href: "/surface", description: "Read the market structure at a glance.", icon: ScanSearch },
  edge: { id: "edge", name: "Trader Edge", href: "/portfolio/edge", description: "Review your trading edge report.", icon: ChartCandlestick },
  news: { id: "news", name: "News", href: "/news", description: "Follow the stories moving markets.", icon: Newspaper },
  howItWorks: { id: "how-it-works", name: "How it works", href: "/how-it-works", description: "Understand the product from end to end.", icon: CircleHelp },
  docs: { id: "docs", name: "Docs", href: "/docs", description: "Read technical and product documentation.", icon: BookOpen },
  status: { id: "status", name: "Status", href: "/status", description: "Check connected services and contracts.", icon: Activity },
  download: { id: "download", name: "Download", href: "/download", description: "Install Masayume as a web app.", icon: Download },
} as const satisfies Record<string, NavItem>;

const BUILD_SECTION: NavSection = {
  id: "build",
  name: "Build",
  description: "Create and automate",
  items: [NAV_ITEMS.create, NAV_ITEMS.strategies, NAV_ITEMS.agents, NAV_ITEMS.xTrade],
};

export const BUILD_GROUP: NavGroup = {
  id: "build",
  name: "Build",
  description: "Create markets and automate how you trade.",
  sections: [BUILD_SECTION],
};

export const EXPLORE_GROUP: NavGroup = {
  id: "explore",
  name: "Explore",
  description: "Trade tools, proof, and product knowledge.",
  sections: [
    { id: "trade", name: "Trade", description: "More ways to make a call", items: [NAV_ITEMS.parlay, NAV_ITEMS.sensei] },
    { id: "proof", name: "Proof", description: "Records and market evidence", items: [NAV_ITEMS.leaderboard, NAV_ITEMS.stats, NAV_ITEMS.surface, NAV_ITEMS.edge] },
    { id: "learn", name: "Learn", description: "News, guidance, and help", items: [NAV_ITEMS.news, NAV_ITEMS.howItWorks, NAV_ITEMS.docs, NAV_ITEMS.status, NAV_ITEMS.download] },
  ],
};

export type DesktopNavEntry = { kind: "link"; item: NavItem } | { kind: "group"; group: NavGroup };

export const DESKTOP_NAV: readonly DesktopNavEntry[] = [
  { kind: "link", item: NAV_ITEMS.markets },
  { kind: "link", item: NAV_ITEMS.reels },
  { kind: "link", item: NAV_ITEMS.games },
  { kind: "group", group: BUILD_GROUP },
  { kind: "group", group: EXPLORE_GROUP },
  { kind: "link", item: NAV_ITEMS.portfolio },
];

export const MOBILE_NAV: readonly NavItem[] = [NAV_ITEMS.markets, NAV_ITEMS.reels, NAV_ITEMS.games, NAV_ITEMS.portfolio];
export const MOBILE_DRAWER_SECTIONS: readonly NavSection[] = [BUILD_SECTION, ...EXPLORE_GROUP.sections];
export const MOBILE_OVERFLOW: readonly NavItem[] = MOBILE_DRAWER_SECTIONS.flatMap((section) => section.items);

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
