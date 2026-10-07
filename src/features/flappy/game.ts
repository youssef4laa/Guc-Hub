/**
 * Pure game logic for "Glide" — deliberately free of React so it is unit-testable.
 * Original name and art; not Flappy Bird's (see docs/ROADMAP.md).
 */
export interface Config {
  width: number;
  height: number;
  gravity: number;
  flapVelocity: number;
  speed: number;
  pipeWidth: number;
  gap: number;
  birdSize: number;
  birdX: number;
  spawnEverySeconds: number;
}

export interface Pipe {
  x: number;
  /** Y of the top edge of the gap. */
  gapTop: number;
  passed: boolean;
}

export type Status = "ready" | "playing" | "over";

export interface GameState {
  status: Status;
  y: number;
  vy: number;
  pipes: Pipe[];
  score: number;
  spawnIn: number;
}

export function makeConfig(width: number, height: number): Config {
  return {
    width,
    height,
    gravity: 1500,
    flapVelocity: 430,
    speed: 150,
    pipeWidth: 58,
    gap: Math.min(190, height * 0.3),
    birdSize: 28,
    birdX: width * 0.25,
    spawnEverySeconds: 1.7,
  };
}

export function initialState(cfg: Config): GameState {
  return { status: "ready", y: cfg.height / 2, vy: 0, pipes: [], score: 0, spawnIn: 0.4 };
}

/** Tap: starts a run from "ready", flaps while "playing", does nothing when "over". */
export function flap(state: GameState, cfg: Config): GameState {
  if (state.status === "over") return state;
  return { ...state, status: "playing", vy: -cfg.flapVelocity };
}

function collides(state: GameState, cfg: Config): boolean {
  const top = state.y;
  const bottom = state.y + cfg.birdSize;
  if (top < 0 || bottom > cfg.height) return true;
  const left = cfg.birdX;
  const right = cfg.birdX + cfg.birdSize;
  return state.pipes.some((pipe) => {
    const overlapsX = right > pipe.x && left < pipe.x + cfg.pipeWidth;
    const inGap = top >= pipe.gapTop && bottom <= pipe.gapTop + cfg.gap;
    return overlapsX && !inGap;
  });
}

/** Advance the simulation by `dt` seconds. `rand` must return a number in [0, 1). */
export function step(state: GameState, dt: number, cfg: Config, rand: () => number): GameState {
  if (state.status !== "playing") return state;

  const vy = state.vy + cfg.gravity * dt;
  const y = state.y + vy * dt;

  let spawnIn = state.spawnIn - dt;
  let pipes = state.pipes.map((p) => ({ ...p, x: p.x - cfg.speed * dt }));
  if (spawnIn <= 0) {
    const margin = 60;
    const gapTop = margin + rand() * (cfg.height - cfg.gap - margin * 2);
    pipes = [...pipes, { x: cfg.width, gapTop, passed: false }];
    spawnIn += cfg.spawnEverySeconds;
  }
  pipes = pipes.filter((p) => p.x + cfg.pipeWidth > 0);

  let score = state.score;
  pipes = pipes.map((p) => {
    if (!p.passed && p.x + cfg.pipeWidth < cfg.birdX) {
      score += 1;
      return { ...p, passed: true };
    }
    return p;
  });

  const next: GameState = { ...state, y, vy, pipes, score, spawnIn };
  return collides(next, cfg) ? { ...next, status: "over" } : next;
}
