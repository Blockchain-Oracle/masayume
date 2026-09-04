import { describe, expect, it } from "vitest";
import {
  DESKTOP_NAV,
  isActiveNavItem,
  MOBILE_DRAWER_SECTIONS,
  MOBILE_NAV,
  NAVIGABLE_ROUTE_PATHS,
  NAV_ITEMS,
} from "./nav-items";

describe("navigation registry", () => {
  it("keeps the approved desktop and mobile fast paths compact", () => {
    expect(DESKTOP_NAV.map((entry) => (entry.kind === "link" ? entry.item.name : entry.group.name))).toEqual([
      "Markets",
      "Reels",
      "Games",
      "Build",
      "Explore",
      "Portfolio",
    ]);
    expect(MOBILE_NAV.map((item) => item.name)).toEqual(["Markets", "Reels", "Games", "Portfolio"]);
  });

  it("gives every drawer destination exactly one home", () => {
    const ids = MOBILE_DRAWER_SECTIONS.flatMap((section) => section.items.map((item) => item.id));
    expect(ids).toHaveLength(32);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every accepted user-facing route an explicit navigation home", () => {
    const destinations = [...MOBILE_NAV, ...MOBILE_DRAWER_SECTIONS.flatMap((section) => section.items)].map(
      (item) => item.href.split("?")[0],
    );
    const missing = NAVIGABLE_ROUTE_PATHS.filter((path) => !destinations.includes(path));

    expect(missing).toEqual([]);
  });

  it("keeps Trader Edge in Explore without also activating Portfolio", () => {
    expect(isActiveNavItem("/portfolio/edge", NAV_ITEMS.edge)).toBe(true);
    expect(isActiveNavItem("/portfolio/edge", NAV_ITEMS.portfolio)).toBe(false);
  });

  it("maps nested game and market routes to their top-level destinations", () => {
    expect(isActiveNavItem("/games/range", NAV_ITEMS.games)).toBe(true);
    expect(isActiveNavItem("/games/range", NAV_ITEMS.range)).toBe(true);
    expect(isActiveNavItem("/games/range", NAV_ITEMS.gamesHub)).toBe(false);
    expect(isActiveNavItem("/markets/example", NAV_ITEMS.markets)).toBe(true);
  });

  it("uses internal application URLs throughout the registry", () => {
    expect(Object.values(NAV_ITEMS).every((item) => item.href.startsWith("/"))).toBe(true);
  });
});
