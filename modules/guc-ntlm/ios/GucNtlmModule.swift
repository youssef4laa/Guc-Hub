import ExpoModulesCore
import Foundation

/// Mirrors NativeNtlmRequest in src/core/portal/ntlm/nativeBinding.ts.
struct NtlmRequestRecord: Record {
  @Field var url: String = ""
  @Field var method: String = "GET"
  @Field var headers: [String: String] = [:]
  @Field var body: String?
  @Field var username: String = ""
  @Field var password: String = ""
  @Field var timeoutMs: Int = 30_000
}

final class NtlmRequestException: GenericException<String>, @unchecked Sendable {
  override var reason: String { "NTLM request failed: \(param)" }
}

/// Per-request delegate: answers NTLM with the given credential once, refuses
/// Negotiate so the OS falls back to NTLM, leaves TLS to the default evaluation,
/// and never follows redirects (JS re-checks the allowlist on every hop).
private final class NtlmTaskDelegate: NSObject, URLSessionTaskDelegate, @unchecked Sendable {
  private let credential: URLCredential

  init(username: String, password: String) {
    credential = URLCredential(user: username, password: password, persistence: .forSession)
  }

  func urlSession(
    _ session: URLSession,
    task: URLSessionTask,
    didReceive challenge: URLAuthenticationChallenge,
    completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
  ) {
    switch challenge.protectionSpace.authenticationMethod {
    case NSURLAuthenticationMethodNTLM:
      // A second NTLM challenge means the credential was refused: let the 401 through.
      if challenge.previousFailureCount == 0 {
        completionHandler(.useCredential, credential)
      } else {
        completionHandler(.performDefaultHandling, nil)
      }
    case NSURLAuthenticationMethodNegotiate:
      completionHandler(.rejectProtectionSpace, nil)
    default:
      // Includes NSURLAuthenticationMethodServerTrust: normal certificate validation.
      completionHandler(.performDefaultHandling, nil)
    }
  }

  func urlSession(
    _ session: URLSession,
    task: URLSessionTask,
    willPerformHTTPRedirection response: HTTPURLResponse,
    newRequest request: URLRequest,
    completionHandler: @escaping (URLRequest?) -> Void
  ) {
    completionHandler(nil)
  }
}

/// ADR A-001 transport, iOS side. One ephemeral session for the app run: its
/// cookie store and credential cache live in memory only. Set-Cookie values are
/// never handed to JS. Nothing here logs request data or credentials.
public final class GucNtlmModule: Module {
  private var session = GucNtlmModule.makeSession()

  private static func makeSession() -> URLSession {
    let config = URLSessionConfiguration.ephemeral
    config.httpShouldSetCookies = true
    config.httpCookieAcceptPolicy = .onlyFromMainDocumentDomain
    return URLSession(configuration: config)
  }

  public func definition() -> ModuleDefinition {
    Name("GucNtlm")

    AsyncFunction("request") { (req: NtlmRequestRecord) async throws -> [String: Any] in
      guard let url = URL(string: req.url) else {
        throw NtlmRequestException("invalid URL")
      }
      guard req.method == "GET" || req.method == "POST" else {
        throw NtlmRequestException("unsupported method \(req.method)")
      }

      var request = URLRequest(url: url)
      request.httpMethod = req.method
      request.timeoutInterval = TimeInterval(req.timeoutMs) / 1000
      for (name, value) in req.headers {
        request.setValue(value, forHTTPHeaderField: name)
      }
      if req.method == "POST" {
        request.httpBody = (req.body ?? "").data(using: .utf8)
      }

      let delegate = NtlmTaskDelegate(username: req.username, password: req.password)
      let data: Data
      let response: URLResponse
      do {
        (data, response) = try await session.data(for: request, delegate: delegate)
      } catch {
        throw NtlmRequestException(error.localizedDescription)
      }
      guard let http = response as? HTTPURLResponse else {
        throw NtlmRequestException("not an HTTP response")
      }

      var headers: [String: String] = [:]
      for (key, value) in http.allHeaderFields {
        guard let name = key as? String, name.lowercased() != "set-cookie" else { continue }
        headers[name.lowercased()] = "\(value)"
      }
      var result: [String: Any] = [
        "status": http.statusCode,
        "headers": headers,
        "body": String(data: data, encoding: .utf8) ?? String(decoding: data, as: UTF8.self),
      ]
      if let location = http.value(forHTTPHeaderField: "Location") {
        result["location"] = location
      }
      return result
    }

    Function("clearSession") {
      self.session.invalidateAndCancel()
      self.session = GucNtlmModule.makeSession()
    }
  }
}
