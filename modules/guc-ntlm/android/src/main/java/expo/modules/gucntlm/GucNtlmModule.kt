package expo.modules.gucntlm

import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.net.CookieManager
import java.net.CookiePolicy
import java.util.concurrent.TimeUnit
import okhttp3.ConnectionPool
import okhttp3.JavaNetCookieJar
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

/** Mirrors NativeNtlmRequest in src/core/portal/ntlm/nativeBinding.ts. */
class NtlmRequestRecord : Record {
  @Field val url: String = ""
  @Field val method: String = "GET"
  @Field val headers: Map<String, String> = emptyMap()
  @Field val body: String? = null
  @Field val username: String = ""
  @Field val password: String = ""
  @Field val timeoutMs: Int = 30_000
}

class NtlmRequestException(message: String, cause: Throwable?) :
  CodedException("ERR_GUC_NTLM_REQUEST", message, cause)

/**
 * ADR A-001 transport, Android side. Contract (see nativeBinding.ts):
 * - no redirect following (JS re-checks the allowlist per hop),
 * - NTLM only, never Negotiate,
 * - default TLS validation (plus whatever the app's Network Security Config adds),
 * - HTTP/1.1 only: NTLM authenticates a connection, which HTTP/2 multiplexing breaks,
 * - an in-memory cookie jar for the app run (portal pages may use ASP.NET session
 *   cookies); Set-Cookie values are never handed to JS.
 * Nothing here logs request data or credentials.
 */
class GucNtlmModule : Module() {
  private val cookieManager = CookieManager(null, CookiePolicy.ACCEPT_ORIGINAL_SERVER)

  private val baseClient: OkHttpClient by lazy {
    OkHttpClient.Builder()
      .protocols(listOf(Protocol.HTTP_1_1))
      .followRedirects(false)
      .followSslRedirects(false)
      // Silently re-sending mid-handshake on a fresh socket would break NTLM's
      // per-connection state; let the failure surface instead.
      .retryOnConnectionFailure(false)
      .connectionPool(ConnectionPool(4, 5, TimeUnit.MINUTES))
      .cookieJar(JavaNetCookieJar(cookieManager))
      .build()
  }

  override fun definition() = ModuleDefinition {
    Name("GucNtlm")

    AsyncFunction("request") { req: NtlmRequestRecord ->
      val client = baseClient.newBuilder()
        .authenticator(NtlmAuthenticator(req.username, req.password))
        .callTimeout(req.timeoutMs.toLong(), TimeUnit.MILLISECONDS)
        .build()

      val builder = Request.Builder().url(req.url)
      req.headers.forEach { (name, value) -> builder.header(name, value) }
      when (req.method) {
        "GET" -> builder.get()
        "POST" -> {
          val contentType = req.headers.entries
            .firstOrNull { it.key.equals("Content-Type", ignoreCase = true) }?.value
          builder.post((req.body ?: "").toRequestBody(contentType?.toMediaTypeOrNull()))
        }
        else -> throw NtlmRequestException("Unsupported method ${req.method}", null)
      }

      try {
        client.newCall(builder.build()).execute().use { response ->
          val headers = mutableMapOf<String, String>()
          for (name in response.headers.names()) {
            if (name.equals("Set-Cookie", ignoreCase = true)) continue
            headers[name.lowercase()] = response.headers(name).joinToString(", ")
          }
          val result = mutableMapOf<String, Any>(
            "status" to response.code,
            "headers" to headers,
            "body" to (response.body?.string() ?: ""),
          )
          response.header("Location")?.let { result["location"] = it }
          result
        }
      } catch (e: Exception) {
        // IOException (network/TLS) or the NTLM engine failing to parse a challenge.
        throw NtlmRequestException(e.message ?: e.javaClass.simpleName, e)
      }
    }

    Function("clearSession") {
      cookieManager.cookieStore.removeAll()
      baseClient.connectionPool.evictAll()
    }
  }
}
