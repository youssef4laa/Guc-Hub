import { PortalError } from "../../core/portal/PortalError";
import type { MailProvider } from "./provider";

function notConnected(): never {
  throw new PortalError(
    "NOT_IMPLEMENTED",
    "Mail isn't connected to GUC mail yet — blocked on Spike 2 (docs/discovery/spike-2-mail-protocol.md).",
  );
}

/**
 * Placeholder until Spike 2 decides the protocol (Graph / EWS / IMAP+SMTP / OWA).
 * Whatever wins implements MailProvider here, keeping its session and transport
 * inside this feature (docs/PARALLEL_WORK.md, "Session/credentials boundary").
 */
export const liveMailProvider: MailProvider = {
  id: "live",
  listFolders: async () => notConnected(),
  listMessages: async () => notConnected(),
  getMessage: async () => notConnected(),
  search: async () => notConnected(),
  markRead: async () => notConnected(),
  deleteMessages: async () => notConnected(),
  undoDelete: async () => notConnected(),
  send: async () => notConnected(),
};
