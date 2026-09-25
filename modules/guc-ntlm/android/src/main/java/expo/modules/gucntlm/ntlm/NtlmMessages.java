package expo.modules.gucntlm.ntlm;

/**
 * Guc Hub's own file, not vendored: the public entry point to Apache's
 * package-private NTLMEngineImpl, so the vendored files stay unmodified.
 * NTLMEngineImpl keeps no per-instance state, so one shared instance is safe.
 */
public final class NtlmMessages {
    private static final NTLMEngineImpl ENGINE = new NTLMEngineImpl();

    private NtlmMessages() {}

    /** Base64 NTLM Type 1 (negotiate) message. */
    public static String type1() throws NTLMEngineException {
        return ENGINE.generateType1Msg(null, null);
    }

    /** Base64 NTLM Type 3 (authenticate) message answering the server's Type 2 challenge. */
    public static String type3(String user, String password, String domain, String type2Challenge)
            throws NTLMEngineException {
        return ENGINE.generateType3Msg(user, password, domain, null, type2Challenge);
    }
}
