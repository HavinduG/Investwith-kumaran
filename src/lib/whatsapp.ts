/** Kamran's WhatsApp (UAE +971 52 370 5205), in international format without "+". */
export const WHATSAPP_NUMBER = "971523705205"

export const DEFAULT_WHATSAPP_MESSAGE = "Hi Kamran, I'd like to talk about a property in Dubai."

/** wa.me link that opens a chat with the message already typed in. */
export function whatsappUrl(message: string = DEFAULT_WHATSAPP_MESSAGE, number: string = WHATSAPP_NUMBER) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

export const isWhatsAppHref = (href: string) => /^https?:\/\/(wa\.me|(api\.|web\.)?whatsapp\.com)\//i.test(href)

/** Digits of the number a WhatsApp link (or a bare phone number) points at; null otherwise. */
export function whatsappNumberFrom(value: string) {
  const raw = value.trim()
  if (/^\+?[\d\s().-]{7,}$/.test(raw)) return raw.replace(/\D/g, "")
  if (!isWhatsAppHref(raw)) return null
  try {
    const url = new URL(raw)
    const digits = (url.searchParams.get("phone") ?? url.pathname.replace(/^\/(send\/?)?/, "")).replace(/\D/g, "")
    return digits.length >= 7 ? digits : null
  } catch {
    return null
  }
}

/** Same WhatsApp chat as `href`, but with a different prefilled message. Non-WhatsApp links pass through. */
export function withWhatsAppMessage(href: string, message: string) {
  const number = whatsappNumberFrom(href)
  return number ? whatsappUrl(message, number) : href
}
