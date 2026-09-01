import {
  BookOpen,
  Bot,
  ChartLine,
  ChartNoAxesCombined,
  GalleryVerticalEnd,
  Gamepad2,
  MessageSquare,
  Sparkles,
  Trophy,
  X as XLogo,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

export type NavLink = {
  name: string;
  href: string;
  icon?: LucideIcon;
  beta?: boolean;
};

// Earn is deliberately NOT in the nav, matching the reference.
//
// /earn still WORKS as a URL: anyone who has supplied capital needs a way back to their
// money. It regains a nav slot when the vault it points at is live and accepting supply.
export const PRIMARY_NAV: NavLink[] = [
  { name: "Markets", href: "/markets" },
  { name: "Reels", href: "/reels" },
  // 'Create', not 'Earn'. The creator studio is about making — a card, a code, attribution
  // on chain. It is renamed the day the builder-fee rail actually pays, not before.
  { name: "Create", href: "/creator/studio" },
  { name: "Strategies", href: "/strategies", beta: true },
  // Games are a first-class Masayume destination (additive), so they take a slot of their
  // own rather than displacing anything the reference already promised.
  { name: "Games", href: "/games", icon: Gamepad2 },
  { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { name: "Portfolio", href: "/portfolio" },
];

export const SECONDARY_NAV: NavLink[] = [
  // Opens the Sensei drawer rather than a page of its own, so the same assistant cannot
  // exist twice behind two layouts and drift.
  { name: "Sensei", href: "/markets?sensei=1", icon: MessageSquare },
  { name: "X-trade", href: "/trade-from-x", icon: XLogo },
  { name: "Parlay", href: "/parlay", icon: ChartNoAxesCombined },
  { name: "Docs", href: "/docs", icon: BookOpen },
];

/**
 * The phone's bottom bar. Anything primary that does not fit here is derived into the More
 * sheet below, so a link can never be primary on desktop and unreachable on mobile.
 */
export const MOBILE_NAV: NavLink[] = [
  { name: "Markets", href: "/markets", icon: ChartLine },
  { name: "Reels", href: "/reels", icon: GalleryVerticalEnd },
  { name: "Games", href: "/games", icon: Gamepad2 },
  { name: "Create", href: "/creator/studio", icon: Sparkles },
  { name: "Strategies", href: "/strategies", icon: Bot },
  { name: "Portfolio", href: "/portfolio", icon: WalletCards },
];

/** Whatever the bottom bar cannot fit, plus the secondary set — by construction. */
export const MOBILE_OVERFLOW: NavLink[] = [
  ...PRIMARY_NAV.filter((link) => !MOBILE_NAV.some((tab) => tab.href === link.href)),
  ...SECONDARY_NAV,
];

export function isActiveHref(pathname: string | null, href: string): boolean {
  const path = href.split("?")[0] ?? href;
  if (path === "/") return pathname === "/";
  return pathname === path || (pathname?.startsWith(`${path}/`) ?? false);
}
