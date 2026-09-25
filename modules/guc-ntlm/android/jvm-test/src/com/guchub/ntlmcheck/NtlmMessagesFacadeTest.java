package com.guchub.ntlmcheck;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import expo.modules.gucntlm.ntlm.NtlmMessages;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import org.junit.Test;

/**
 * Guc Hub's own test. Deliberately in a DIFFERENT package from the vendored
 * engine: the Kotlin module calls the facade from outside that package, and a
 * same-package test can't catch package-private access errors (which is how a
 * compile failure slipped past the Apache tests once already).
 */
public class NtlmMessagesFacadeTest {
    private static byte[] hex(String s) {
        byte[] out = new byte[s.length() / 2];
        for (int i = 0; i < out.length; i++) out[i] = (byte) Integer.parseInt(s.substring(2 * i, 2 * i + 2), 16);
        return out;
    }

    private static void le16(ByteArrayOutputStream o, int v) { o.write(v & 0xff); o.write((v >> 8) & 0xff); }
    private static void le32(ByteArrayOutputStream o, int v) { le16(o, v); le16(o, v >>> 16); }

    /** A Type 2 challenge with target info (the NTLMv2 path IIS uses). Target info from Apache's vectors. */
    private static String type2WithTargetInfo() {
        byte[] targetInfo = hex("02000c0044004f004d00410049004e0001000c005300450052005600450052000400140064006f006d00610069006e002e0063006f006d00030022007300650072007600650072002e0064006f006d00610069006e002e0063006f006d0000000000");
        ByteArrayOutputStream o = new ByteArrayOutputStream();
        o.writeBytes(hex("4E544C4D53535000"));       // "NTLMSSP\0"
        le32(o, 2);                                    // message type 2
        le16(o, 0); le16(o, 0); le32(o, 48);           // target name: empty
        le32(o, 0x00808205);                           // UNICODE | REQUEST_TARGET | NTLM | TARGET_INFO
        o.writeBytes(hex("0123456789abcdef"));         // server challenge
        o.writeBytes(new byte[8]);                     // reserved
        le16(o, targetInfo.length); le16(o, targetInfo.length); le32(o, 48);
        o.writeBytes(targetInfo);
        return Base64.getEncoder().encodeToString(o.toByteArray());
    }

    @Test
    public void type1IsANegotiateMessage() throws Exception {
        byte[] msg = Base64.getDecoder().decode(NtlmMessages.type1());
        assertArrayEquals(hex("4E544C4D53535000"), java.util.Arrays.copyOf(msg, 8));
        assertEquals(1, msg[8]);
    }

    @Test
    public void type3AnswersAChallengeWithoutEchoingThePassword() throws Exception {
        String password = "not-a-real-password";
        byte[] msg = Base64.getDecoder().decode(NtlmMessages.type3("first.last", password, null, type2WithTargetInfo()));
        assertArrayEquals(hex("4E544C4D53535000"), java.util.Arrays.copyOf(msg, 8));
        assertEquals(3, msg[8]);
        String asUtf16 = new String(msg, java.nio.charset.StandardCharsets.UTF_16LE);
        String asAscii = new String(msg, java.nio.charset.StandardCharsets.US_ASCII);
        assertTrue(!asUtf16.contains(password) && !asAscii.contains(password));
        assertTrue(asUtf16.contains("first.last")); // the username IS sent, as NTLM requires
    }
}
