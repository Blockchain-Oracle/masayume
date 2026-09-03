import { ensureMarkets, parseMarketsEnv } from "@masayume/markets";
import { resolveArenaDeployment } from "@masayume/markets/games";
import { readRoomEnv, ROOM_ENV } from "./env";
import { createRoomHub, type RoomHub } from "./hub";
import type { RoomContext } from "./handlers";
import { startRoomServer } from "./server";

type Log = (why: string) => void;

/**
 * The duel room actor: one `ws` listener, one hub, and nothing durable of its own.
 *
 * It refuses to listen in two cases rather than pretending. Without `ROOM_TOKEN_SECRET` every token
 * would verify, so an unset (or trivially short) secret idles the actor — the same rule the keeper
 * applies to a missing key. And with no `GameArena` on the configured chain there is no match to
 * reconstruct, so a room would be a socket that can only ever answer "unknown match".
 *
 * The hub is returned so the projector and the settler can broadcast into rooms without either of them
 * owning the transport: chain events reach a browser through this one socket registry, and nothing else
 * in ops writes to a client.
 */
export async function startGameRoom(log: Log): Promise<RoomHub | null> {
  const env = readRoomEnv();
  if (!env.secret) {
    log(`no ${ROOM_ENV.secret} of at least 16 characters; the duel room is not listening`);
    return null;
  }

  const marketsEnv = parseMarketsEnv({ venueId: env.venueId });
  ensureMarkets(marketsEnv);
  const deployment = resolveArenaDeployment(marketsEnv);
  if (!deployment) {
    log("GameArena is not deployed on this network; the duel room is not listening");
    return null;
  }

  const hub = createRoomHub();
  const ctx: RoomContext = {
    hub,
    chainId: deployment.chainId,
    arena: deployment.gameArena,
    log,
    // Both arrive in the slices that own them; until then the queue refuses honestly and `hello`
    // answers from the match id the browser already knows rather than from a directory.
    matchmaker: null,
    directory: null,
  };

  const server = startRoomServer({ ctx, env: { ...env, secret: env.secret } });
  log(`listening on ws://${env.host}:${env.port} for arena ${deployment.gameArena} on chain ${deployment.chainId}`);

  const stop = () => void server.close().then(() => log("closed"));
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  return hub;
}
