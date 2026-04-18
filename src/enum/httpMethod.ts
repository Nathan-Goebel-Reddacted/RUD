export const HttpMethod = {
  GET:    "GET",
  POST:   "POST",
  PUT:    "PUT",
  PATCH:  "PATCH",
  DELETE: "DELETE",
  WS:     "WS",
} as const;

export type HttpMethod = typeof HttpMethod[keyof typeof HttpMethod];
