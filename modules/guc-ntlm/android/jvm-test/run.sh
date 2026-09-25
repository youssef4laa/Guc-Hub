#!/usr/bin/env bash
# Runs our facade test (from outside the engine's package) plus Apache HttpClient
# 4.5.14's own NTLM known-answer tests (TestNTLMEngineImpl,
# from the rel/v4.5.14 tag, package-renamed) against the vendored engine on the
# JVM. Proves the vendoring changes didn't break the crypto. It does NOT prove
# Android's crypto providers offer DES/RC4 — that needs a device/emulator run.
# JUnit is downloaded into a temp dir; nothing is added to the project.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT
C=https://repo1.maven.org/maven2
curl -sSf -o "$WORK/junit.jar" "$C/junit/junit/4.13.2/junit-4.13.2.jar"
curl -sSf -o "$WORK/hamcrest.jar" "$C/org/hamcrest/hamcrest-core/1.3/hamcrest-core-1.3.jar"
find "$HERE/src" "$HERE/../src/main/java/expo/modules/gucntlm/ntlm" -name '*.java' -print0 |
  xargs -0 javac -d "$WORK/out" -cp "$WORK/junit.jar"
java -cp "$WORK/out:$WORK/junit.jar:$WORK/hamcrest.jar" org.junit.runner.JUnitCore \
  expo.modules.gucntlm.ntlm.TestNTLMEngineImpl com.guchub.ntlmcheck.NtlmMessagesFacadeTest
