import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import { PortalError } from "../../../core/portal/PortalError";
import type { AttachmentContent } from "../schema";
import { isWithinSizeLimit, safeAttachmentFilename } from "../security/attachments";

/** Everything downloaded from a message lands here, inside the app's own cache. */
const ATTACHMENT_DIRECTORY = "mail-attachments";

/**
 * Writes an attachment into the app's cache directory under a sanitised name and
 * returns its URI. The app never opens the file itself — the caller hands the URI
 * to the OS share sheet, which lets the student choose what should open it.
 */
export function saveAttachmentToCache(content: AttachmentContent): string {
  if (!isWithinSizeLimit(content.sizeBytes)) {
    throw new PortalError("PORTAL_UNAVAILABLE", "That attachment is too large to open in the app.");
  }

  const directory = new Directory(Paths.cache, ATTACHMENT_DIRECTORY);
  if (!directory.exists) directory.create({ intermediates: true });

  const file = new File(directory, safeAttachmentFilename(content.filename));
  if (file.exists) file.delete();
  file.create();
  file.write(content.base64, { encoding: "base64" });
  return file.uri;
}

/** Hands a cached file to the OS share sheet. Never opens it directly. */
export async function shareCachedFile(uri: string, mimeType: string, dialogTitle: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new PortalError("PORTAL_UNAVAILABLE", "Sharing isn't available on this device.");
  }
  await Sharing.shareAsync(uri, { mimeType, dialogTitle });
}
