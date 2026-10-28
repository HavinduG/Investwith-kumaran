export { cn } from "cn"

/** Splits a CMS heading at its first comma; the rest is set as the gold, italic accent. */
export function splitTitle(title: string) {
  const index = title.indexOf(",")
  if (index === -1) return { lead: title, accent: "" }
  return { lead: title.slice(0, index + 1), accent: title.slice(index + 1).trim() }
}
