package android.util;
// JVM-only stand-in for android.util.Base64 so the vendored engine can be tested off-device.
public final class Base64 {
    public static final int NO_WRAP = 2;
    public static byte[] encode(byte[] input, int flags) { return java.util.Base64.getEncoder().encode(input); }
    public static byte[] decode(byte[] input, int flags) { return java.util.Base64.getDecoder().decode(input); }
}
