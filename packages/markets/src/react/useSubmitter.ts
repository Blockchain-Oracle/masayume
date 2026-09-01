"use client";

import { useMemo } from "react";
import { nowMs } from "../provider/clock";
import { createSubmitter, type MarketsSubmitter } from "../submitter/create";
import { createLocalStorageJournal } from "../submitter/journal-local-storage";

let shared: MarketsSubmitter | null = null;

/** One submitter per app — one journal, one Stop seam, one attribution hook — so every surface's writes share it (AD-3). */
export function getSharedSubmitter(): MarketsSubmitter {
  shared ??= createSubmitter({ journal: createLocalStorageJournal(nowMs), nowMs });
  return shared;
}

export function useSubmitter(): MarketsSubmitter {
  return useMemo(getSharedSubmitter, []);
}
