/**
 * Per-host request gate: caps concurrency and enforces a minimum gap between
 * requests, so we never hammer a GUC portal even if several screens fetch at once.
 */
export class HostQueue {
  private active = 0;
  private lastStart = 0;
  private readonly waiters: (() => void)[] = [];

  constructor(
    private readonly concurrency: number,
    private readonly minIntervalMs: number,
  ) {}

  async run<T>(work: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await work();
    } finally {
      this.release();
    }
  }

  private async acquire(): Promise<void> {
    if (this.active >= this.concurrency) {
      await new Promise<void>((resolve) => this.waiters.push(resolve));
    }
    const wait = this.minIntervalMs - (Date.now() - this.lastStart);
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    this.active += 1;
    this.lastStart = Date.now();
  }

  private release(): void {
    this.active -= 1;
    const next = this.waiters.shift();
    next?.();
  }
}

const queues = new Map<string, HostQueue>();

export function getHostQueue(host: string, concurrency: number, minIntervalMs: number): HostQueue {
  let queue = queues.get(host);
  if (!queue) {
    queue = new HostQueue(concurrency, minIntervalMs);
    queues.set(host, queue);
  }
  return queue;
}
