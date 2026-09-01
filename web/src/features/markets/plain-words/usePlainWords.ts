"use client";

import { booleanCodec, usePersistedState } from "@/lib/persisted";

const PLAIN_WORDS_KEY = "masayume.plainWords";

export function usePlainWords(): [boolean, (on: boolean) => void] {
  const [on, set] = usePersistedState(PLAIN_WORDS_KEY, false, booleanCodec);
  return [on, set];
}
