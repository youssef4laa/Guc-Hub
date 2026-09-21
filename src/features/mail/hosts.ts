/**
 * Hosts this feature's live source needs `core/http` to allow. Declared here, not
 * in `core/http/config.ts` — `tools/gen-registry.js` aggregates every feature's
 * list into `src/core/http/hosts.generated.ts`. Add a host by editing only this
 * file (and, if it's a new one, your own block of `.env.example`).
 */
export const hosts: string[] = [process.env.EXPO_PUBLIC_GUC_MAIL_HOST].filter((host): host is string =>
  Boolean(host),
);
