"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { BGM_BED, playSfx, setBgmVolume, setSfxVolume, useBgmVolume, useModalSfx, useSfxVolume } from "./audio";
import { GAMES } from "./copy";
import { fireFeedback, hapticsSupported } from "./feedback";
import { useGames } from "./GamesProvider";
import { ACCENT_CHOICES, ACCENT_LABELS, type MotionChoice } from "./settings";

const MOTION_ORDER: readonly MotionChoice[] = ["system", "full", "reduced"];

/**
 * The stage controls, reachable from every game surface.
 *
 * Each switch fires the cue it governs as it is turned on, so the setting demonstrates itself
 * rather than promising something the player has to go and verify. Vibration support is reported
 * rather than assumed — iOS Safari has none, and a haptics switch that silently does nothing there
 * is a lie the shell can easily avoid telling.
 */
export function GameSettingsSheet() {
  const { settings, settingsOpen, setSettingsOpen, setHaptics, setMotion, setAccent, systemPrefersReduced, reducedMotion, feedback } = useGames();
  const [canVibrate, setCanVibrate] = useState(true);
  const sfxVolume = useSfxVolume();
  const bgmVolume = useBgmVolume();
  useModalSfx(settingsOpen);

  // Read after mount: `navigator` does not exist while rendering on the server.
  useEffect(() => setCanVibrate(hapticsSupported()), []);

  const motionLabel: Record<MotionChoice, string> = {
    system: GAMES.settings.motion.system,
    full: GAMES.settings.motion.full,
    reduced: GAMES.settings.motion.reduced,
  };

  return (
    <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
      <SheetContent
        side="bottom"
        className="gm-sheet max-h-dvh overflow-y-auto"
        overlayClassName="gm-sheet-overlay"
        // The sheet portals to document.body, outside the frame, so it carries the setting itself —
        // otherwise the one surface where a player turns motion off keeps animating.
        data-reduced-motion={reducedMotion ? "true" : "false"}
      >
        <SheetHeader>
          <SheetTitle>{GAMES.settings.title}</SheetTitle>
          <SheetDescription>{GAMES.settings.intro}</SheetDescription>
        </SheetHeader>

        <div className="gm-settings">
          {/* Flicky's two channels, each its own slider; zero is that channel's mute. The effect slider
              demonstrates itself on release, at the level it was just set to. */}
          <label className="gm-set-row gm-set-row--stack">
            <span className="gm-set-text">
              <span className="gm-set-label">{GAMES.settings.sfx.label}</span>
              <span className="gm-set-hint">{GAMES.settings.sfx.hint}</span>
            </span>
            <input
              type="range"
              className="gm-range"
              min={0}
              max={1}
              step={0.05}
              value={sfxVolume}
              aria-label={GAMES.settings.sfx.label}
              onChange={(event) => setSfxVolume(Number(event.target.value))}
              onPointerUp={() => playSfx("click")}
              onKeyUp={() => playSfx("click")}
            />
          </label>

          <label className="gm-set-row gm-set-row--stack">
            <span className="gm-set-text">
              <span className="gm-set-label">{GAMES.settings.music.label}</span>
              <span className="gm-set-hint">{GAMES.settings.music.hint}</span>
            </span>
            <input
              type="range"
              className="gm-range"
              min={0}
              max={1}
              step={0.05}
              value={bgmVolume}
              aria-label={GAMES.settings.music.label}
              data-bed={BGM_BED}
              onChange={(event) => setBgmVolume(Number(event.target.value))}
            />
          </label>

          <label className="gm-set-row">
            <span className="gm-set-text">
              <span className="gm-set-label">{GAMES.settings.haptics.label}</span>
              <span className="gm-set-hint">{canVibrate ? GAMES.settings.haptics.hint : GAMES.settings.hapticsUnsupported}</span>
            </span>
            <Switch
              checked={settings.haptics}
              disabled={!canVibrate}
              onCheckedChange={(on) => {
                setHaptics(on);
                if (on) fireFeedback("confirm", { haptics: true });
              }}
            />
          </label>

          <div className="gm-set-row gm-set-row--stack">
            <span className="gm-set-text">
              <span className="gm-set-label">{GAMES.settings.motion.label}</span>
              <span className="gm-set-hint">{GAMES.settings.motion.hint}</span>
            </span>
            <div className="gm-seg" role="radiogroup" aria-label={GAMES.settings.motion.label}>
              {MOTION_ORDER.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  role="radio"
                  aria-checked={settings.motion === choice}
                  className="gm-seg-btn"
                  data-on={settings.motion === choice}
                  onClick={() => {
                    setMotion(choice);
                    feedback("tap");
                  }}
                >
                  {motionLabel[choice]}
                </button>
              ))}
            </div>
            {settings.motion === "system" && (
              <span className="gm-set-hint">
                {systemPrefersReduced ? GAMES.settings.motion.systemOnHint : GAMES.settings.motion.systemOffHint}
              </span>
            )}
          </div>

          <div className="gm-set-row gm-set-row--stack">
            <span className="gm-set-text">
              <span className="gm-set-label">{GAMES.profile.accent}</span>
              <span className="gm-set-hint">{GAMES.profile.accentHint}</span>
            </span>
            <div className="gm-seg" role="radiogroup" aria-label={GAMES.profile.accent}>
              {ACCENT_CHOICES.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  role="radio"
                  aria-checked={settings.accent === choice}
                  className="gm-seg-btn gm-seg-btn--accent"
                  data-on={settings.accent === choice}
                  data-accent={choice}
                  onClick={() => {
                    setAccent(choice);
                    feedback("tap");
                  }}
                >
                  <span className="gm-seg-swatch" aria-hidden />
                  {ACCENT_LABELS[choice]}
                </button>
              ))}
            </div>
          </div>

          <p className="gm-set-scope">{GAMES.settings.scope}</p>
          <p className="gm-set-scope">{GAMES.settings.credits}</p>
          <Button variant="secondary" onClick={() => setSettingsOpen(false)}>{GAMES.settings.close}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
