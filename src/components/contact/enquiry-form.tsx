"use client"

import { startTransition, useActionState, useId, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { AlertCircle, ArrowUpRight, Check, ChevronDown, LoaderCircle, Mail, MessageCircle, Phone } from "lucide-react"

import { type ContactMethod, type EnquiryState, sendEnquiry } from "@/app/actions/enquiry"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const EASE = [0.22, 1, 0.36, 1] as const
const MESSAGE_MAX = 2000

const METHODS: {
  value: ContactMethod
  label: string
  icon: typeof Mail
  field: { label: string; placeholder: string; type: string; inputMode: "tel" | "email"; autoComplete: string }
}[] = [
  {
    value: "whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
    field: { label: "WhatsApp number", placeholder: "e.g. +971 50 000 0000", type: "tel", inputMode: "tel", autoComplete: "tel" },
  },
  {
    value: "email",
    label: "Email",
    icon: Mail,
    field: { label: "Email address", placeholder: "you@example.com", type: "email", inputMode: "email", autoComplete: "email" },
  },
  {
    value: "phone",
    label: "Phone",
    icon: Phone,
    field: { label: "Phone number", placeholder: "e.g. +971 50 000 0000", type: "tel", inputMode: "tel", autoComplete: "tel" },
  },
]

const INITIAL: EnquiryState = { status: "idle", message: "", errors: {} }

const inputClass =
  "w-full rounded-xl border border-border bg-background/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-[border-color,box-shadow,background-color] duration-300 hover:border-gold/30 focus:border-gold/60 focus:bg-background/70 focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--gold)_14%,transparent)] aria-invalid:border-destructive/70"

/** Enquiry form card. Remounting it (new `key`) clears it for another enquiry. */
export function EnquiryForm({ services, onReset }: { services: string[]; onReset: () => void }) {
  const id = useId()
  const reduceMotion = useReducedMotion()
  const [state, formAction, pending] = useActionState(sendEnquiry, INITIAL)
  const [method, setMethod] = useState<ContactMethod>("whatsapp")
  const [messageLength, setMessageLength] = useState(0)
  const current = METHODS.find((m) => m.value === method)!

  // Submitting through a transition (instead of the `action` prop) keeps what the
  // visitor typed when validation fails, rather than resetting the form.
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    startTransition(() => formAction(data))
  }

  const errorFor = (name: keyof EnquiryState["errors"]) => state.errors[name]

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card/80 p-6 shadow-[0_40px_100px_-50px_rgb(0_0_0/0.8)] backdrop-blur-xl sm:p-8">
      <AnimatePresence mode="wait" initial={false}>
        {state.status === "success" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: EASE }}
            role="status"
            className="flex min-h-[28rem] flex-col items-center justify-center text-center"
          >
            <svg viewBox="0 0 80 80" className="size-20" aria-hidden>
              <motion.circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke="var(--gold)"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: EASE }}
              />
              <motion.path
                d="M26 41l9 9 19-20"
                fill="none"
                stroke="var(--gold)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.6, ease: EASE }}
              />
            </svg>
            <p className="mt-6 font-display text-3xl font-light">Enquiry received</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">{state.message}</p>
            <Button variant="glass" size="xl" className="mt-8" onClick={onReset}>
              Send another enquiry
            </Button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            exit={{ opacity: 0, y: reduceMotion ? 0 : -12, transition: { duration: 0.3 } }}
            onSubmit={onSubmit}
            noValidate
            aria-describedby={state.status === "error" ? `${id}-status` : undefined}
          >
            <div data-reveal="field" className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl leading-tight font-light sm:text-[1.75rem]">Send an enquiry</h3>
                <p className="mt-1.5 font-mono text-[0.62rem] tracking-[0.15em] text-muted-foreground uppercase">
                  A few details help us reply properly
                </p>
              </div>
            </div>

            {/* Honeypot: hidden from people, often filled in by bots */}
            <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] size-px opacity-0" />
            <input type="hidden" name="method" value={method} />

            <div className="mt-7 grid gap-5">
              <Field data-reveal="field" id={`${id}-name`} label="Full name" error={errorFor("name")}>
                <input
                  id={`${id}-name`}
                  name="name"
                  autoComplete="name"
                  placeholder="e.g. Sarah Ahmed"
                  maxLength={120}
                  aria-invalid={Boolean(errorFor("name"))}
                  aria-describedby={errorFor("name") ? `${id}-name-error` : undefined}
                  className={inputClass}
                />
              </Field>

              <div data-reveal="field">
                <p id={`${id}-method`} className="mb-2 text-xs font-medium text-foreground/80">
                  Preferred contact
                </p>
                <div
                  role="radiogroup"
                  aria-labelledby={`${id}-method`}
                  className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-background/50 p-1"
                >
                  {METHODS.map((option) => {
                    const selected = option.value === method
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setMethod(option.value)}
                        className={cn(
                          "relative flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-medium outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-gold/50 sm:text-sm",
                          selected ? "text-gold-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {selected && (
                          <motion.span
                            layoutId={`${id}-method-pill`}
                            transition={{ type: "spring", stiffness: 420, damping: 34 }}
                            className="absolute inset-0 rounded-lg bg-gold shadow-[0_8px_24px_-8px_var(--gold)]"
                          />
                        )}
                        <option.icon className="relative size-3.5" />
                        <span className="relative">{option.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div data-reveal="field" className="grid gap-5 sm:grid-cols-2">
                <Field id={`${id}-contact`} label={current.field.label} error={errorFor("contact")} animateLabel>
                  <input
                    key={method}
                    id={`${id}-contact`}
                    name="contact"
                    type={current.field.type}
                    inputMode={current.field.inputMode}
                    autoComplete={current.field.autoComplete}
                    placeholder={current.field.placeholder}
                    maxLength={160}
                    aria-invalid={Boolean(errorFor("contact"))}
                    aria-describedby={errorFor("contact") ? `${id}-contact-error` : undefined}
                    className={inputClass}
                  />
                </Field>

                <Field id={`${id}-service`} label="Service">
                  <div className="relative">
                    <select
                      id={`${id}-service`}
                      name="service"
                      defaultValue={services[0] ?? ""}
                      className={cn(inputClass, "cursor-pointer appearance-none pr-10")}
                    >
                      {services.map((service) => (
                        <option key={service} value={service}>
                          {service}
                        </option>
                      ))}
                      <option value="Something else">Something else</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </Field>
              </div>

              <Field
                data-reveal="field"
                id={`${id}-message`}
                label={
                  <>
                    Message <span className="font-mono text-[0.6rem] tracking-[0.1em] text-muted-foreground">optional</span>
                  </>
                }
                hint={messageLength > 0 ? `${messageLength} / ${MESSAGE_MAX}` : undefined}
              >
                <textarea
                  id={`${id}-message`}
                  name="message"
                  rows={4}
                  maxLength={MESSAGE_MAX}
                  placeholder="Tell us what you have in mind — area, budget, timing…"
                  onChange={(event) => setMessageLength(event.target.value.length)}
                  className={cn(inputClass, "resize-none")}
                />
              </Field>

              <div data-reveal="field">
                <label className="group flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-muted-foreground">
                  <span className="relative mt-0.5 grid size-5 shrink-0 place-items-center">
                    <input
                      type="checkbox"
                      name="consent"
                      aria-invalid={Boolean(errorFor("consent"))}
                      aria-describedby={errorFor("consent") ? `${id}-consent-error` : undefined}
                      className="peer size-5 cursor-pointer appearance-none rounded-md border border-border bg-background/50 transition-colors checked:border-gold checked:bg-gold focus-visible:ring-2 focus-visible:ring-gold/50 aria-invalid:border-destructive/70 group-hover:border-gold/40"
                    />
                    <Check className="pointer-events-none absolute size-3.5 scale-0 text-gold-foreground transition-transform duration-300 peer-checked:scale-100" strokeWidth={3} />
                  </span>
                  <span>I agree to be contacted by Metroplex Properties about this enquiry.</span>
                </label>
                {errorFor("consent") && (
                  <p id={`${id}-consent-error`} className="mt-1.5 pl-8 text-xs text-destructive">
                    {errorFor("consent")}
                  </p>
                )}
              </div>
            </div>

            <AnimatePresence>
              {state.status === "error" && state.message && (
                <motion.p
                  key={state.message}
                  id={`${id}-status`}
                  role="alert"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-5 flex items-start gap-2 overflow-hidden rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs leading-relaxed text-foreground/90"
                >
                  <AlertCircle className="mt-px size-4 shrink-0 text-destructive" />
                  {state.message}
                </motion.p>
              )}
            </AnimatePresence>

            <Button data-reveal="field" type="submit" variant="gold" size="xl" disabled={pending} className="mt-6 w-full">
              {pending ? (
                <>
                  <LoaderCircle className="animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  Send enquiry
                  <ArrowUpRight className="transition-transform duration-300 group-hover/button:rotate-45" />
                </>
              )}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}

function Field({
  id,
  label,
  error,
  hint,
  animateLabel = false,
  children,
  ...rest
}: {
  id: string
  label: React.ReactNode
  error?: string
  hint?: string
  /** Cross-fade the label when it changes (e.g. with the contact method). */
  animateLabel?: boolean
  children: React.ReactNode
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="relative text-xs font-medium text-foreground/80">
          {animateLabel ? (
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={String(label)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="inline-block"
              >
                {label}
              </motion.span>
            </AnimatePresence>
          ) : (
            label
          )}
        </label>
        {hint && <span className="font-mono text-[0.6rem] text-muted-foreground tabular-nums">{hint}</span>}
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
