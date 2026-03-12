export const Language = {
  EN: "en",
  FR: "fr"
} as const;

export type Language = typeof Language[keyof typeof Language]