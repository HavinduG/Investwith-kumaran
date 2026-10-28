"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ArrowLeft, ArrowRight, Building2, Expand, X } from "lucide-react"
import { Dialog } from "radix-ui"

import { cn } from "@/lib/utils"
import type { CmsImage } from "@/lib/wordpress"

const EASE = [0.22, 1, 0.36, 1] as const

export function ProjectGallery({ images, title }: { images: CmsImage[]; title: string }) {
  const reduceMotion = useReducedMotion()
  const [[index, direction], setState] = useState<[number, number]>([0, 0])
  const [open, setOpen] = useState(false)
  const count = images.length

  const go = useCallback(
    (step: number) => setState(([i]) => [(i + step + count) % count, step]),
    [count]
  )
  const show = (i: number) => setState(([current]) => [i, i > current ? 1 : -1])

  // Arrow keys move through photos while the viewer is open
  useEffect(() => {
    if (!open || count < 2) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") go(1)
      if (event.key === "ArrowLeft") go(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, count, go])

  if (!count) {
    return (
      <div className="grid aspect-video place-items-center rounded-[2rem] border border-border bg-linear-to-b from-muted to-card">
        <Building2 className="size-20 text-gold/40" strokeWidth={1} />
      </div>
    )
  }

  const image = images[index]
  const slide = {
    enter: (dir: number) => (reduceMotion ? { opacity: 0 } : { opacity: 0, x: dir * 80, scale: 1.04 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (dir: number) => (reduceMotion ? { opacity: 0 } : { opacity: 0, x: dir * -80, scale: 0.98 }),
  }

  const arrows = (variant: "stage" | "viewer") =>
    count > 1 && (
      <>
        {[
          { step: -1, icon: ArrowLeft, label: "Previous photo", side: "left-4" },
          { step: 1, icon: ArrowRight, label: "Next photo", side: "right-4" },
        ].map(({ step, icon: Icon, label, side }) => (
          <button
            key={step}
            type="button"
            aria-label={label}
            onClick={() => go(step)}
            className={cn(
              "absolute top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-gold hover:bg-gold hover:text-gold-foreground focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none",
              side,
              variant === "stage" && "opacity-100 md:opacity-0 md:group-hover/stage:opacity-100 md:focus-visible:opacity-100"
            )}
          >
            <Icon className="size-5" />
          </button>
        ))}
      </>
    )

  return (
    <div>
      {/* -------------------------------- Stage -------------------------------- */}
      <div className="group/stage relative aspect-4/3 overflow-hidden rounded-[2rem] border border-gold/20 bg-muted sm:aspect-video">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={image.src}
            custom={direction}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.8, ease: EASE }}
            className="absolute inset-0"
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              preload={index === 0}
              sizes="(min-width: 1280px) 1216px, 100vw"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-black/50 to-transparent" />

        {arrows("stage")}

        <div className="absolute inset-x-5 bottom-5 z-10 flex items-center justify-between gap-4">
          <span className="rounded-full border border-white/20 bg-black/40 px-3 py-1.5 font-mono text-[0.65rem] tracking-[0.2em] text-white backdrop-blur-md tabular-nums">
            {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3.5 py-1.5 text-xs text-white backdrop-blur-md transition-colors hover:border-gold hover:bg-gold hover:text-gold-foreground focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
          >
            <Expand className="size-3.5" />
            Full screen
          </button>
        </div>
      </div>

      {/* ------------------------------ Thumbnails ------------------------------ */}
      {count > 1 && (
        <ul className="mt-3 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((thumb, i) => (
            <li key={thumb.src} className="shrink-0">
              <button
                type="button"
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index}
                onClick={() => show(i)}
                className={cn(
                  "relative block h-18 w-26 overflow-hidden rounded-xl border-2 transition-all duration-500 outline-none focus-visible:ring-2 focus-visible:ring-gold sm:h-20 sm:w-30",
                  i === index ? "border-gold" : "border-transparent opacity-55 hover:opacity-100"
                )}
              >
                <Image src={thumb.src} alt="" fill sizes="120px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* -------------------------------- Viewer -------------------------------- */}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
          <Dialog.Content className="fixed inset-0 z-50 flex flex-col outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0">
            <div className="flex items-center justify-between gap-4 p-4 text-white sm:p-6">
              <Dialog.Title className="truncate font-display text-lg font-light">{title}</Dialog.Title>
              <Dialog.Description className="sr-only">Photo gallery. Use the arrow keys to move between photos.</Dialog.Description>
              <span className="ml-auto font-mono text-xs tracking-[0.2em] text-white/70 tabular-nums">
                {index + 1} / {count}
              </span>
              <Dialog.Close
                aria-label="Close gallery"
                className="grid size-10 place-items-center rounded-full border border-white/25 transition-colors hover:border-gold hover:bg-gold hover:text-gold-foreground focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
              >
                <X className="size-5" />
              </Dialog.Close>
            </div>
            <div className="relative flex-1">
              <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div
                  key={image.src}
                  custom={direction}
                  variants={slide}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.6, ease: EASE }}
                  className="absolute inset-4 sm:inset-x-20 sm:inset-y-4"
                >
                  <Image src={image.src} alt={image.alt} fill sizes="100vw" className="object-contain" />
                </motion.div>
              </AnimatePresence>
              {arrows("viewer")}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
