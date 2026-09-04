# Sound sources

Every effect here is CC0 (public domain) from Kenney — no attribution required; recorded for provenance.
Re-encoded with `ffmpeg -vn -codec:a libmp3lame -qscale:a 4`. No music bed ships: the one the reference
duel uses is Uppbeat-licensed (a visible per-download credit), which is not ours to carry; a CC0 track
slots into `audio.ts`'s `BGM_FILE` when one is chosen.

| File | Original | Pack |
|---|---|---|
| click.mp3 | `click_001.ogg` | Kenney — Interface Sounds (kenney.nl/assets/interface-sounds, CC0) |
| modal-open.mp3 | `open_001.ogg` | Kenney — Interface Sounds (CC0) |
| modal-close.mp3 | `close_001.ogg` | Kenney — Interface Sounds (CC0) |
| card-win.mp3 | `confirmation_001.ogg` | Kenney — Interface Sounds (CC0) |
| card-loss.mp3 | `error_001.ogg` | Kenney — Interface Sounds (CC0) |
| swipe-up.mp3 | `phaserUp1.ogg` | Kenney — Digital Audio (kenney.nl/assets/digital-audio, CC0) |
| swipe-down.mp3 | `phaserDown1.ogg` | Kenney — Digital Audio (CC0) |
| match-found.mp3 | `twoTone1.ogg` | Kenney — Digital Audio (CC0) |
| duel-win.mp3 | `jingles_NES00.ogg` | Kenney — Music Jingles (kenney.nl/assets/music-jingles, CC0) |
| duel-lose.mp3 | `jingles_NES02.ogg` | Kenney — Music Jingles (CC0) |

The press/release sound on every game control is `click.mp3` varied per press (detune, gain, low-pass) in
Pips's discipline — `reference/pips/web/src/components/console/consoleAudio.ts` — re-implemented, not copied.
