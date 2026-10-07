import { flap, initialState, makeConfig, step, type GameState } from "../game";

const cfg = makeConfig(360, 640);
const rand = () => 0.5;

function playing(overrides: Partial<GameState> = {}): GameState {
  return { ...initialState(cfg), status: "playing", spawnIn: 100, ...overrides };
}

describe("flap", () => {
  it("starts the run from ready with an upward velocity", () => {
    const next = flap(initialState(cfg), cfg);
    expect(next.status).toBe("playing");
    expect(next.vy).toBeLessThan(0);
  });

  it("does nothing once the game is over", () => {
    const over = playing({ status: "over" });
    expect(flap(over, cfg)).toBe(over);
  });
});

describe("step", () => {
  it("does not move while ready or over", () => {
    const ready = initialState(cfg);
    expect(step(ready, 0.1, cfg, rand)).toBe(ready);
  });

  it("falls under gravity", () => {
    const next = step(playing({ y: 300, vy: 0 }), 0.1, cfg, rand);
    expect(next.y).toBeGreaterThan(300);
    expect(next.vy).toBeGreaterThan(0);
  });

  it("ends the game when the bird hits the floor", () => {
    const next = step(playing({ y: cfg.height - cfg.birdSize, vy: 500 }), 0.1, cfg, rand);
    expect(next.status).toBe("over");
  });

  it("ends the game when the bird hits the ceiling", () => {
    const next = step(playing({ y: 1, vy: -500 }), 0.1, cfg, rand);
    expect(next.status).toBe("over");
  });

  it("spawns a pipe when the timer runs out", () => {
    const next = step(playing({ spawnIn: 0.01, y: 300 }), 0.05, cfg, rand);
    expect(next.pipes).toHaveLength(1);
    expect(next.pipes[0].x).toBe(cfg.width);
  });

  it("scores once when a pipe is passed, and not again", () => {
    const pipe = { x: cfg.birdX - cfg.pipeWidth - 1, gapTop: 250, passed: false };
    const first = step(playing({ y: 300, vy: 0, pipes: [pipe] }), 0.001, cfg, rand);
    expect(first.score).toBe(1);
    const second = step({ ...first, y: 300, vy: 0 }, 0.001, cfg, rand);
    expect(second.score).toBe(1);
  });

  it("collides with a pipe outside its gap, but passes through the gap", () => {
    const pipeAtBird = { x: cfg.birdX - 10, gapTop: 400, passed: false };
    const hit = step(playing({ y: 100, vy: 0, pipes: [pipeAtBird] }), 0.001, cfg, rand);
    expect(hit.status).toBe("over");

    const through = step(playing({ y: 420, vy: 0, pipes: [pipeAtBird] }), 0.001, cfg, rand);
    expect(through.status).toBe("playing");
  });

  it("drops pipes that have left the screen", () => {
    const gone = { x: -cfg.pipeWidth - 5, gapTop: 200, passed: true };
    const next = step(playing({ y: 300, vy: 0, pipes: [gone] }), 0.001, cfg, rand);
    expect(next.pipes).toHaveLength(0);
  });
});
