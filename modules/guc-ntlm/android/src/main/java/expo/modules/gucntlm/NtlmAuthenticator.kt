package expo.modules.gucntlm

import expo.modules.gucntlm.ntlm.NtlmMessages
import okhttp3.Authenticator
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route

/**
 * Answers IIS's NTLM challenge (ADR A-001): 401 "NTLM" -> send Type 1;
 * 401 "NTLM <challenge>" -> send Type 3. Only ever answers NTLM, never
 * Negotiate. Returns null (so the 401 reaches JS as AUTH_INVALID) once the
 * Type 3 has been rejected, which also stops any retry loop.
 */
internal class NtlmAuthenticator(
  private val username: String,
  private val password: String,
) : Authenticator {
  override fun authenticate(route: Route?, response: Response): Request? {
    val ntlmChallenge = response.headers("WWW-Authenticate")
      .map { it.trim() }
      .firstOrNull { it.equals("NTLM", ignoreCase = true) || it.startsWith("NTLM ", ignoreCase = true) }
      ?: return null

    val previous = response.request.header("Authorization")
    val (user, domain) = splitUsername(username)

    val header = if (ntlmChallenge.equals("NTLM", ignoreCase = true)) {
      // A bare challenge after we already answered means the credential was refused.
      if (previous != null) return null
      "NTLM " + NtlmMessages.type1()
    } else {
      // "NTLM <Type 2>": only valid right after our own Type 1.
      if (previous == null || !previous.startsWith("NTLM ", ignoreCase = true)) return null
      val type2 = ntlmChallenge.substring("NTLM ".length).trim()
      "NTLM " + NtlmMessages.type3(user, password, domain, type2)
    }

    return response.request.newBuilder().header("Authorization", header).build()
  }

  companion object {
    /** "DOMAIN\\user" -> (user, DOMAIN). Anything else (incl. user@domain) goes as-is with no domain. */
    fun splitUsername(raw: String): Pair<String, String?> {
      val slash = raw.indexOf('\\')
      return if (slash > 0) raw.substring(slash + 1) to raw.substring(0, slash) else raw to null
    }
  }
}
