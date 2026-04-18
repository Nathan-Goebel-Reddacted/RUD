export const AuthType = {
  NONE:        "NONE",
  BEARER:      "BEARER",
  API_KEY:     "API_KEY",
  BASIC:       "BASIC",
  OAUTH2_PKCE: "OAUTH2_PKCE",
} as const;

export type AuthType = typeof AuthType[keyof typeof AuthType];
