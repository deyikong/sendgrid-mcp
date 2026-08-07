import { timingSafeEqual } from "node:crypto";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import type { OAuthTokenVerifier } from "@modelcontextprotocol/sdk/server/auth/provider.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { InvalidTokenError } from "@modelcontextprotocol/sdk/server/auth/errors.js";
import type { OAuthProtectedResourceMetadata } from "@modelcontextprotocol/sdk/shared/auth.js";
import { getEnv } from "./shared/env.js";

/**
 * Normalizes a scope claim, which may arrive as a space-delimited string
 * (RFC 8693 `scope`) or as an array (`scp`, used by Entra ID and others).
 */
function extractScopes(payload: JWTPayload): string[] {
  const raw = (payload as Record<string, unknown>).scope ?? (payload as Record<string, unknown>).scp;
  if (typeof raw === "string") return raw.split(" ").filter(Boolean);
  if (Array.isArray(raw)) return raw.filter((s): s is string => typeof s === "string");
  return [];
}

/**
 * Verifies access tokens issued by an external authorization server.
 *
 * The MCP server acts purely as an OAuth 2.1 *resource server*: it never issues
 * or stores credentials, it only validates tokens minted by the configured
 * issuer. Signature verification uses the issuer's published JWKS.
 */
export class ExternalIdpTokenVerifier implements OAuthTokenVerifier {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(
    private readonly issuer: string,
    private readonly audience: string,
    jwksUri: string
  ) {
    // createRemoteJWKSet caches keys and handles rotation/cooldown internally.
    this.jwks = createRemoteJWKSet(new URL(jwksUri));
  }

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
        audience: this.audience,
      });

      // RFC 8707: if the token names a resource, it must be ours. jwtVerify
      // already enforced `aud`, but a resource-indicator claim is checked too
      // when present, to reject tokens minted for a different MCP server.
      const resourceClaim = (payload as Record<string, unknown>).resource;
      if (typeof resourceClaim === "string" && resourceClaim.split("#")[0] !== this.audience) {
        throw new InvalidTokenError("Token resource indicator does not match this server");
      }

      return {
        token,
        clientId: (payload.azp as string) ?? (payload.client_id as string) ?? (payload.sub as string) ?? "unknown",
        scopes: extractScopes(payload),
        expiresAt: payload.exp,
        resource: new URL(this.audience),
        extra: { sub: payload.sub, iss: payload.iss },
      };
    } catch (error) {
      if (error instanceof InvalidTokenError) throw error;
      // Collapse jose's error taxonomy (expired, bad signature, wrong audience,
      // malformed) into a single opaque 401 so we don't leak probe signal.
      throw new InvalidTokenError("Access token is invalid or expired");
    }
  }
}

/**
 * Verifies a single shared secret. Retained for local development and simple
 * self-hosted deployments where standing up an IdP is disproportionate.
 */
export class StaticTokenVerifier implements OAuthTokenVerifier {
  private readonly expected: Buffer;

  constructor(token: string) {
    this.expected = Buffer.from(token);
  }

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const provided = Buffer.from(token);
    const ok = provided.length === this.expected.length && timingSafeEqual(provided, this.expected);
    if (!ok) throw new InvalidTokenError("Access token is invalid");

    return {
      token,
      clientId: "static-token",
      scopes: [],
      // A shared secret has no expiry of its own, but requireBearerAuth requires
      // a numeric expiresAt and rejects the token outright without one. Report a
      // rolling window; rotation is a deployment concern, not a token claim.
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      resource: new URL(getEnv().MCP_PUBLIC_URL ?? "http://127.0.0.1"),
    };
  }
}

/**
 * Builds the RFC 9728 Protected Resource Metadata document. Clients fetch this
 * to discover which authorization server to send the user to.
 */
export function buildProtectedResourceMetadata(
  resourceUrl: string,
  issuer: string,
  scopes: string[]
): OAuthProtectedResourceMetadata {
  return {
    resource: resourceUrl,
    authorization_servers: [issuer],
    bearer_methods_supported: ["header"],
    scopes_supported: scopes.length > 0 ? scopes : undefined,
    resource_documentation: "https://github.com/deyikong/sendgrid-mcp#readme",
  };
}
