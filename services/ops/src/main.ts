/**
 * The single long-running ops service. Actors (seeder-maker, oracle-follow runner, relayer,
 * TG executor, settlement watcher, Stop service, watchdog) register here from Epic 5 onward.
 * Every cycle logs a structured why-string; idle is a heartbeat, never silence.
 */
const HEARTBEAT_MS = 30_000;

function whyString(actor: string, why: string): string {
  return JSON.stringify({ tsMs: Date.now(), actor, why });
}

console.log(whyString("ops", "boot: no actors registered yet"));
setInterval(() => console.log(whyString("ops", "idle heartbeat")), HEARTBEAT_MS);
