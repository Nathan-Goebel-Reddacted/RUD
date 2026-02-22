export const ParamType = {
  STRING:  "string",
  NUMBER:  "number",
  BOOLEAN: "boolean",
} as const;
export type ParamType = typeof ParamType[keyof typeof ParamType];

export const BodyContentType = {
  JSON:      "application/json",
  FORM_DATA: "application/x-www-form-urlencoded",
} as const;
export type BodyContentType = typeof BodyContentType[keyof typeof BodyContentType];

export type PathParam = {
  name:         string;
  type:         ParamType;
  defaultValue: string;
};

export type QueryParam = {
  name:         string;
  type:         ParamType;
  required:     boolean;
  defaultValue: string;
};
