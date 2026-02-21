import type Profile from "@/class/Profiles"

export function applyColors(profile: Profile): void {
  const root = document.documentElement
  root.style.setProperty("--background-color", profile.getBackgroundColor())
  root.style.setProperty("--border-color",     profile.getBorderColor())
  root.style.setProperty("--text-color",       profile.getTextColor())
  root.style.setProperty("--text-hover-color", profile.getTextHoverColor())
}

export function resetColors(): void {
  const root = document.documentElement
  root.style.removeProperty("--background-color")
  root.style.removeProperty("--border-color")
  root.style.removeProperty("--text-color")
  root.style.removeProperty("--text-hover-color")
}
