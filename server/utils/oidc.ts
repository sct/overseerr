import { getSettings } from '@server/lib/settings';
import type { Request } from 'express';
import * as yup from 'yup';

/** Fetch the oidc configuration blob */
export async function getOIDCWellknownConfiguration(domain: string) {
  // remove trailing slash from url if it exists and add /.well-known/openid-configuration path
  const wellKnownUrl = new URL(
    `https://${domain}`.replace(/\/$/, '') + '/.well-known/openid-configuration'
  ).toString();
  const wellKnownInfo: WellKnownConfiguration = await fetch(wellKnownUrl, {
    headers: new Headers([['Content-Type', 'application/json']]),
  }).then((r) => r.json());

  return wellKnownInfo;
}

export async function getOIDCRedirectUrl(req: Request, state: string) {
  const settings = getSettings();
  const { oidcDomain, oidcClientId } = settings.main;

  const wellKnownInfo = await getOIDCWellknownConfiguration(oidcDomain);
  const url = new URL(wellKnownInfo.authorization_endpoint);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', oidcClientId);

  const callbackUrl = new URL(
    '/api/v1/auth/oidc-callback',
    `${req.protocol}://${req.headers.host}`
  ).toString();
  url.searchParams.set('redirect_uri', callbackUrl);
  url.searchParams.set('scope', 'openid profile email');
  url.searchParams.set('state', state);
  return url.toString();
}

export const createJwtSchema = ({
  oidcDomain,
  oidcClientId,
}: {
  oidcDomain: string;
  oidcClientId: string;
}) => {
  return yup.object().shape({
    iss: yup
      .string()
      .oneOf(
        [`https://${oidcDomain}`, `https://${oidcDomain}/`],
        `The token iss value doesn't match the oidc_DOMAIN (${oidcDomain})`
      )
      .required("The token didn't come with an iss value."),
    
    aud: yup
      .mixed()
      .test(
        'aud-test',
        `The token aud value doesn't match the oidc_CLIENT_ID (${oidcClientId})`,
        (value) => {
          const audience = Array.isArray(value) ? value : [value];
          return audience.includes(oidcClientId);
        }
      )
      .required("The token didn't come with an aud value."),

    exp: yup
      .number()
      .required()
      .test(
        'is_before_date',
        'Token exp value is before current time.',
        (value) => {
          // Check if 'value' is undefined
          if (value === undefined) return false;
          return value >= Math.ceil(Date.now() / 1000);
        }
      ),

    iat: yup
      .number()
      .required()
      .test(
        'is_before_one_day',
        'Token was issued before one day ago and is now invalid.',
        (value) => {
          // Check if 'value' is undefined
          if (value === undefined) return false;
          const oneDayAgo = Math.ceil(Number(new Date()) / 1000) - 86400;
          return value >= oneDayAgo;
        }
      ),

    email: yup.string().email().required(),
    email_verified: yup.boolean().required(),
  });
};

export interface WellKnownConfiguration {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  device_authorization_endpoint: string;
  userinfo_endpoint: string;
  mfa_challenge_endpoint: string;
  jwks_uri: string;
  registration_endpoint: string;
  revocation_endpoint: string;
  scopes_supported: string[];
  response_types_supported: string[];
  code_challenge_methods_supported: string[];
  response_modes_supported: string[];
  subject_types_supported: string[];
  id_token_signing_alg_values_supported: string[];
  token_endpoint_auth_methods_supported: string[];
  claims_supported: string[];
  request_uri_parameter_supported: boolean;
}

export interface OIDCJwtPayload {
  // Standard OIDC Claims
  iss: string; // Issuer Identifier
  sub: string; // Subject Identifier
  aud: string | string[]; // Audience
  exp: number; // Expiration time
  iat: number; // Issued at time
  auth_time?: number; // Time when the authentication occurred (optional)
  nonce?: string; // String value used to associate a Client session with an ID Token (optional)

  // Commonly used OIDC Claims
  email?: string; // User's email address (optional)
  email_verified?: boolean; // Whether the user's email address has been verified (optional)
  name?: string; // User's full name (optional)
  given_name?: string; // User's given name(s) or first name(s) (optional)
  family_name?: string; // User's surname(s) or last name(s) (optional)
  preferred_username?: string; // Shorthand name by which the user wishes to be referred to (optional)
  locale?: string; // User's locale (optional)
  zoneinfo?: string; // User's time zone (optional)

  // Other possible custom claims (these depend on your OIDC provider)
  // Include any additional fields that your OIDC provider might use
  [additionalClaim: string]: unknown;
}

