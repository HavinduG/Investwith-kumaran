"use client"

import { useEffect, useId, useRef, useState } from "react"
import Image from "next/image"
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion"
import { CheckCheck, SendHorizontal, UserRound, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { WHATSAPP_NUMBER, whatsappUrl } from "@/lib/whatsapp"
import type { CmsImage } from "@/lib/wordpress"

// The button appears once the visitor scrolls past the top of the page
const SHOW_AFTER_PX = 420
// Teaser bubble pops up once per browser session, a little after the button appears
const TEASER_DELAY_MS = 6000
const TEASER_KEY = "whatsapp-teaser-dismissed"
// Simulated "typing…" before each reply in the chat window
const TYPING_MS = 1100

const EASE = [0.22, 1, 0.36, 1] as const

type Message = { id: number; from: "agent" | "visitor"; text: string; time: string }

const clock = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

const readTeaserDismissed = () => {
  try {
    return window.sessionStorage.getItem(TEASER_KEY) === "1"
  } catch {
    return false
  }
}

/** WhatsApp glyph (lucide no longer ships brand marks). */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 2.2a9.8 9.8 0 0 0-8.4 14.8L2.2 21.8l4.9-1.3A9.8 9.8 0 1 0 12 2.2Zm0 17.8a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 1 1 12 20Z" />
      <path d="M16.4 14.1c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.1 0-.3 0-.4l-.7-1.7c-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.1 1.6 2.5 4 3.5 1.5.6 2 .7 2.8.6.4-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.4-.1Z" />
    </svg>
  )
}

/**
 * Floating WhatsApp chat: a chat-style window with a greeting and quick replies.
 * Sending opens WhatsApp with the visitor's message already typed — WhatsApp
 * requires the visitor to tap Send there; websites cannot send on their behalf.
 */
export function WhatsAppButton({
  number = WHATSAPP_NUMBER,
  name = "Kamran",
  role = "Dubai property adviser",
  avatar,
  quickReplies = [],
}: {
  number?: string
  name?: string
  role?: string
  avatar?: CmsImage | null
  quickReplies?: string[]
}) {
  const id = useId()
  const reduceMotion = useReducedMotion()
  const input = useRef<HTMLTextAreaElement>(null)
  const body = useRef<HTMLDivElement>(null)
  const nextId = useRef(0)

  const [scrolledIn, setScrolledIn] = useState(false)
  const [open, setOpen] = useState(false)
  const [teaser, setTeaser] = useState(false)
  const [typing, setTyping] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState("")

  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, "change", (latest) => setScrolledIn(latest > SHOW_AFTER_PX))
  const visible = scrolledIn || open
  const hasSent = messages.some((message) => message.from === "visitor")

  const push = (from: Message["from"], text: string) =>
    setMessages((list) => [...list, { id: nextId.current++, from, text, time: clock() }])

  // Agent replies after a short "typing…" pause
  const reply = (text: string) => {
    setTyping(true)
    window.setTimeout(
      () => {
        setTyping(false)
        push("agent", text)
      },
      reduceMotion ? 0 : TYPING_MS
    )
  }

  const dismissTeaser = () => {
    setTeaser(false)
    try {
      window.sessionStorage.setItem(TEASER_KEY, "1")
    } catch {
      // Storage can be unavailable (private mode); the teaser just shows again next time
    }
  }

  const openChat = () => {
    dismissTeaser()
    setOpen(true)
    if (!messages.length && !typing) {
      reply(`Hi there 👋 I'm ${name}. How can I help you with Dubai property today?`)
    }
  }

  const send = (text: string) => {
    const message = text.trim()
    if (!message) return
    // Opened directly in the click handler so pop-up blockers allow it
    window.open(whatsappUrl(message, number), "_blank", "noopener,noreferrer")
    push("visitor", message)
    setDraft("")
    reply("WhatsApp is open with your message ready — tap Send there and we'll continue the chat. 💬")
  }

  // Teaser bubble, once per session
  useEffect(() => {
    if (!scrolledIn || open || readTeaserDismissed()) return
    const timer = window.setTimeout(() => setTeaser(true), TEASER_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [scrolledIn, open])

  // Focus the message box on open; Escape closes
  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() => input.current?.focus())
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKey)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  // Keep the latest message in view
  useEffect(() => {
    body.current?.scrollTo({ top: body.current.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" })
  }, [messages, typing, reduceMotion])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="whatsapp"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.4, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.4, y: 30 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6"
        >
          {/* ------------------------------ Chat window ------------------------------ */}
          <AnimatePresence>
            {open && (
              <motion.div
                id={`${id}-chat`}
                role="dialog"
                aria-label={`WhatsApp chat with ${name}`}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.94 }}
                transition={{ duration: 0.45, ease: EASE }}
                data-lenis-prevent
                className="flex max-h-[min(36rem,calc(100svh-7rem))] w-[min(23rem,calc(100vw-2rem))] origin-bottom-right flex-col overflow-hidden rounded-3xl border border-black/10 bg-[#efeae2] shadow-[0_30px_80px_-20px_rgb(0_0_0/0.65)] dark:border-white/10 dark:bg-[#0b141a]"
              >
                {/* Header */}
                <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3.5 text-white">
                  <span className="relative shrink-0">
                    <span className="relative block size-11 overflow-hidden rounded-full bg-white/15 ring-2 ring-white/25">
                      {avatar ? (
                        <Image src={avatar.src} alt="" fill sizes="44px" className="object-cover object-top" />
                      ) : (
                        <UserRound className="absolute inset-0 m-auto size-5 text-white/80" />
                      )}
                    </span>
                    <span className="absolute right-0 bottom-0 size-3 rounded-full bg-[#25d366] ring-2 ring-[#075e54]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.95rem] font-semibold">{name}</p>
                    <p className="truncate text-xs text-white/75">{typing ? "typing…" : role}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close chat"
                    className="grid size-8 place-items-center rounded-full text-white/85 transition-colors hover:bg-white/15 hover:text-white"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                {/* Messages */}
                <div
                  ref={body}
                  aria-live="polite"
                  className="flex-1 space-y-2 overflow-y-auto overscroll-contain bg-[radial-gradient(rgb(0_0_0/0.05)_1px,transparent_1px)] bg-size-[16px_16px] px-3.5 py-4 dark:bg-[radial-gradient(rgb(255_255_255/0.04)_1px,transparent_1px)]"
                >
                  <p className="mx-auto w-fit rounded-md bg-white/80 px-2.5 py-1 text-[0.62rem] tracking-wide text-black/55 uppercase shadow-sm dark:bg-[#182229] dark:text-white/55">
                    Today
                  </p>

                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.35, ease: EASE }}
                      className={cn("flex", message.from === "visitor" ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "relative max-w-[85%] rounded-xl px-3 pt-2 pb-1.5 text-[0.88rem] leading-snug shadow-sm",
                          message.from === "visitor"
                            ? "rounded-tr-sm bg-[#d9fdd3] text-black/85 dark:bg-[#005c4b] dark:text-white/95"
                            : "rounded-tl-sm bg-white text-black/85 dark:bg-[#202c33] dark:text-white/95"
                        )}
                      >
                        {message.from === "agent" && (
                          <p className="mb-0.5 text-[0.72rem] font-semibold text-[#128c7e] dark:text-[#25d366]">{name}</p>
                        )}
                        <p className="whitespace-pre-wrap">{message.text}</p>
                        <p className="mt-1 flex items-center justify-end gap-1 text-[0.62rem] text-black/45 dark:text-white/50">
                          {message.time}
                          {message.from === "visitor" && <CheckCheck className="size-3.5 text-[#53bdeb]" />}
                        </p>
                      </div>
                    </motion.div>
                  ))}

                  {/* Typing indicator */}
                  {typing && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-1 rounded-xl rounded-tl-sm bg-white px-3.5 py-3 shadow-sm dark:bg-[#202c33]">
                        {[0, 1, 2].map((dot) => (
                          <motion.span
                            key={dot}
                            className="size-1.5 rounded-full bg-black/40 dark:bg-white/50"
                            animate={reduceMotion ? undefined : { y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 0.9, repeat: Infinity, delay: dot * 0.15 }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick replies until the visitor sends something */}
                  {!hasSent && !typing && messages.length > 0 && quickReplies.length > 0 && (
                    <motion.div
                      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: EASE, delay: 0.15 }}
                      className="flex flex-wrap justify-end gap-1.5 pt-1"
                    >
                      {quickReplies.map((topic) => (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => send(`Hi ${name}, I'd like to know more about ${topic.toLowerCase()}.`)}
                          className="rounded-full border border-[#128c7e]/40 bg-white/90 px-3 py-1.5 text-xs text-[#075e54] transition-all hover:-translate-y-0.5 hover:border-[#128c7e] hover:bg-white dark:border-[#25d366]/40 dark:bg-[#202c33] dark:text-[#25d366] dark:hover:bg-[#2a3942]"
                        >
                          {topic}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>

                {/* Composer */}
                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    send(draft)
                  }}
                  className="flex items-end gap-2 bg-[#f0f2f5] px-3 py-2.5 dark:bg-[#202c33]"
                >
                  <label htmlFor={`${id}-message`} className="sr-only">
                    Message
                  </label>
                  <textarea
                    ref={input}
                    id={`${id}-message`}
                    rows={1}
                    value={draft}
                    maxLength={1000}
                    placeholder="Type a message"
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault()
                        send(draft)
                      }
                    }}
                    className="max-h-28 min-h-10 flex-1 resize-none rounded-2xl bg-white px-4 py-2.5 text-sm text-black/85 outline-none placeholder:text-black/40 dark:bg-[#2a3942] dark:text-white/95 dark:placeholder:text-white/40"
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim()}
                    aria-label="Send on WhatsApp"
                    className="grid size-10 shrink-0 place-items-center rounded-full bg-[#25d366] text-white transition-all hover:scale-105 hover:bg-[#1fb855] disabled:scale-100 disabled:opacity-50"
                  >
                    <SendHorizontal className="size-4.5" />
                  </button>
                </form>
                <p className="bg-[#f0f2f5] pb-2.5 text-center text-[0.62rem] text-black/45 dark:bg-[#202c33] dark:text-white/45">
                  Opens WhatsApp with your message ready to send
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ------------------------------- Teaser bubble ------------------------------- */}
          <AnimatePresence>
            {teaser && !open && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.45, ease: EASE }}
                className="relative max-w-[16rem] origin-bottom-right"
              >
                <button
                  type="button"
                  onClick={openChat}
                  className="block rounded-2xl rounded-br-md border border-emerald/30 bg-card/95 p-4 pr-9 text-left text-sm shadow-[0_24px_60px_-24px_rgb(0_0_0/0.7)] backdrop-blur-xl transition-colors hover:border-emerald/60"
                >
                  <span className="block font-medium">Hi there 👋</span>
                  <span className="mt-1 block text-[0.82rem] leading-relaxed text-muted-foreground">
                    Questions about Dubai property? Chat with {name} on WhatsApp.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={dismissTeaser}
                  aria-label="Dismiss message"
                  className="absolute top-2.5 right-2.5 grid size-6 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ------------------------------ Launcher button ------------------------------ */}
          <button
            type="button"
            onClick={() => (open ? setOpen(false) : openChat())}
            aria-expanded={open}
            aria-controls={`${id}-chat`}
            aria-label={open ? "Close WhatsApp chat" : `Chat with ${name} on WhatsApp`}
            className="group relative grid size-14 place-items-center rounded-full bg-[#25d366] text-white shadow-[0_14px_40px_-10px_rgb(37_211_102/0.7)] outline-none transition-shadow duration-500 hover:shadow-[0_18px_50px_-8px_rgb(37_211_102/0.85)] focus-visible:ring-4 focus-visible:ring-[#25d366]/40"
          >
            {!reduceMotion && !open && (
              <>
                <span aria-hidden className="absolute inset-0 animate-ping-slow rounded-full bg-[#25d366]/40" />
                <span aria-hidden className="absolute inset-0 animate-ping-slow rounded-full bg-[#25d366]/25 [animation-delay:1.2s]" />
              </>
            )}
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={open ? "close" : "chat"}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, rotate: -90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, rotate: 90, scale: 0.5 }}
                transition={{ duration: 0.25 }}
                className="relative grid place-items-center"
              >
                {open ? (
                  <X className="size-6" />
                ) : (
                  <WhatsAppIcon className="size-7 transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110" />
                )}
              </motion.span>
            </AnimatePresence>
            {!open && messages.length === 0 && (
              <span className="absolute -top-0.5 -right-0.5 grid size-5 place-items-center rounded-full bg-[#ff3b30] text-[0.65rem] font-semibold ring-2 ring-background">
                1
              </span>
            )}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
