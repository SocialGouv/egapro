/**
 * MFA floor for the ProConnect sign-in (issue #4962).
 *
 * These are the only assurance levels that prove a second factor, as published
 * by ProConnect's "forcer la double authentification" documentation. Any other
 * value — `eidas0`, `eidas1`, or no `acr` at all — means no second factor was
 * presented, and `callbacks.signIn` refuses to open a session.
 */
export const MFA_ACR_VALUES = ["eidas0-mfa", "eidas1-mfa", "eidas2", "eidas3"] as const;

const MFA_ACR_SET: ReadonlySet<string> = new Set(MFA_ACR_VALUES);

export function isMfaAcr(acr: unknown): acr is string {
  return typeof acr === "string" && MFA_ACR_SET.has(acr);
}

/**
 * The `claims` authorization parameter that makes the floor binding at
 * ProConnect. `acr_values` is only a preference an issuer may ignore, so it is
 * never used: `essential: true` asks ProConnect to refuse the sign-in rather
 * than return a lower level.
 */
export const MFA_CLAIMS = JSON.stringify({
  id_token: {
    acr: { essential: true, values: [...MFA_ACR_VALUES] },
  },
});

/**
 * Reads the `acr` claim of a ProConnect id_token.
 *
 * The token is decoded without re-verifying its signature: it never transited
 * through the browser — NextAuth fetched it server-to-server and openid-client
 * already validated signature, issuer, audience and nonce before handing it
 * over, so a second check would re-run the same one against the same JWKS.
 */
export function readAcr(idToken: string | null | undefined): string | null {
  const payload = idToken?.split(".")[1];
  if (!payload) {
    return null;
  }

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as Record<string, unknown>;
    return typeof claims.acr === "string" ? claims.acr : null;
  } catch {
    return null;
  }
}
