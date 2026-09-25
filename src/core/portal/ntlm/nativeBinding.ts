import { requireOptionalNativeModule } from "expo";

/** What the `GucNtlm` native module (modules/guc-ntlm, not built yet) must implement. */
export interface NativeNtlmRequest {
  url: string;
  method: "GET" | "POST";
  headers: Record<string, string>;
  body: string | null;
  username: string;
  password: string;
  timeoutMs: number;
}

export interface NativeNtlmResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
  /** Redirect target when the native layer did not follow it (it never should). */
  location?: string;
}

export interface GucNtlmNativeModule {
  /**
   * One request over the OS stack, answering the NTLM challenge with the given
   * credential. Must NOT follow redirects (the JS layer re-checks the allowlist
   * on every hop), must NOT offer Negotiate/Kerberos, and must NOT relax TLS.
   */
  request(request: NativeNtlmRequest): Promise<NativeNtlmResponse>;
  /** Drops in-memory cookies and pooled (already-authenticated) connections. Called on sign-out. */
  clearSession(): void;
}

/** null until a dev client that includes modules/guc-ntlm is installed. */
export function getNativeNtlm(): GucNtlmNativeModule | null {
  return requireOptionalNativeModule<GucNtlmNativeModule>("GucNtlm");
}
