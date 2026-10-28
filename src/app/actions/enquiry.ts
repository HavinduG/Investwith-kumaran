"use server"

export type ContactMethod = "whatsapp" | "email" | "phone"

export type EnquiryState = {
  status: "idle" | "success" | "error"
  message: string
  /** Per-field validation messages, keyed by input name. */
  errors: Partial<Record<"name" | "contact" | "consent", string>>
}

const METHODS: ContactMethod[] = ["whatsapp", "email", "phone"]
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE = /^\+?[\d\s()-]{7,20}$/

const field = (data: FormData, name: string, max: number) =>
  String(data.get(name) ?? "")
    .trim()
    .slice(0, max)

/**
 * Validates an enquiry and forwards it as JSON to ENQUIRY_WEBHOOK_URL
 * (e.g. a CRM, Zapier/Make hook or an email relay).
 */
export async function sendEnquiry(_previous: EnquiryState, data: FormData): Promise<EnquiryState> {
  // Hidden field that people never fill in; bots usually do
  if (field(data, "company", 200)) {
    return { status: "success", message: "Thank you — your enquiry has been sent.", errors: {} }
  }

  const name = field(data, "name", 120)
  const method = METHODS.includes(data.get("method") as ContactMethod)
    ? (data.get("method") as ContactMethod)
    : "whatsapp"
  const contact = field(data, "contact", 160)
  const service = field(data, "service", 120)
  const message = field(data, "message", 2000)
  const consent = data.get("consent") === "on"

  const errors: EnquiryState["errors"] = {}
  if (name.length < 2) errors.name = "Please enter your name."
  if (method === "email" ? !EMAIL.test(contact) : !PHONE.test(contact)) {
    errors.contact = method === "email" ? "Please enter a valid email address." : "Please enter a valid phone number."
  }
  if (!consent) errors.consent = "Please confirm we may contact you about this enquiry."
  if (Object.keys(errors).length) {
    return { status: "error", message: "Please check the highlighted fields.", errors }
  }

  const webhook = process.env.ENQUIRY_WEBHOOK_URL
  if (!webhook) {
    console.warn("[enquiry] ENQUIRY_WEBHOOK_URL is not set; enquiry was not delivered.")
    return {
      status: "error",
      message: "Online enquiries aren't connected yet. Please reach us on WhatsApp or book a meeting instead.",
      errors: {},
    }
  }

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        preferredContact: method,
        contact,
        service,
        message,
        consent,
        submittedAt: new Date().toISOString(),
      }),
    })
    if (!res.ok) throw new Error(`Webhook responded ${res.status}`)
  } catch (error) {
    console.error("[enquiry] Delivery failed:", error)
    return {
      status: "error",
      message: "Something went wrong sending your enquiry. Please try again or reach us on WhatsApp.",
      errors: {},
    }
  }

  return { status: "success", message: "Thank you — your enquiry has been sent.", errors: {} }
}
