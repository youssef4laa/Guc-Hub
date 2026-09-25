/*
 * ====================================================================
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 * ====================================================================
 *
 * This software consists of voluntary contributions made by many
 * individuals on behalf of the Apache Software Foundation.  For more
 * information on the Apache Software Foundation, please see
 * <http://www.apache.org/>.
 *
 */
/*
 * Vendored from Apache HttpClient 4.5.14 (org.apache.http.impl.auth), Apache-2.0.
 * Source: httpclient-4.5.14-sources.jar from Maven Central (SHA-1 14321a36...196e).
 * Local changes, all packaging-level (see modules/guc-ntlm/NOTICE):
 *   - package renamed to expo.modules.gucntlm.ntlm (Android's boot classpath has its own org.apache.http)
 *   - commons-codec Base64 -> android.util.Base64; Consts.ASCII -> StandardCharsets.US_ASCII
 *   - NTLMEngineException extends Exception instead of httpclient's AuthenticationException
 *   - SecureRandom: platform default instead of "SHA1PRNG"
 */
package expo.modules.gucntlm.ntlm;


/**
 * Signals NTLM protocol failure.
 *
 *
 * @since 4.0
 */
public class NTLMEngineException extends Exception {

    private static final long serialVersionUID = 6027981323731768824L;

    public NTLMEngineException() {
        super();
    }

    /**
     * Creates a new NTLMEngineException with the specified message.
     *
     * @param message the exception detail message
     */
    public NTLMEngineException(final String message) {
        super(message);
    }

    /**
     * Creates a new NTLMEngineException with the specified detail message and cause.
     *
     * @param message the exception detail message
     * @param cause the {@code Throwable} that caused this exception, or {@code null}
     * if the cause is unavailable, unknown, or not a {@code Throwable}
     */
    public NTLMEngineException(final String message, final Throwable cause) {
        super(message, cause);
    }

}
