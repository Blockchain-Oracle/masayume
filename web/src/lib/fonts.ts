import { Archivo, IBM_Plex_Mono, Instrument_Sans, Noto_Serif_JP } from "next/font/google";

export const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", display: "swap" });

export const instrumentSans = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument-sans", display: "swap" });

export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

// Kanji slices load on demand; the stamp vocabulary is a handful of glyphs.
export const notoSerifJp = Noto_Serif_JP({
  subsets: ["latin"],
  variable: "--font-noto-serif-jp",
  display: "swap",
  preload: false,
});

export const fontVariables = [archivo.variable, instrumentSans.variable, plexMono.variable, notoSerifJp.variable].join(" ");
