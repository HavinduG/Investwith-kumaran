import type Lenis from "lenis"

/** The active smooth-scroll instance, registered by <SmoothScroll>. Null when reduced motion is on. */
let lenis: Lenis | null = null

export function registerLenis(instance: Lenis | null) {
  lenis = instance
}

/** Scrolls to the element with this hash ("#about"), or to the top for an empty hash. */
export function scrollToHash(hash: string, { immediate = false } = {}) {
  const id = decodeURIComponent(hash.replace(/^#/, ""))
  const target = id ? document.getElementById(id) : null
  if (id && !target) return false

  if (lenis) {
    lenis.scrollTo(target ?? 0, { immediate, duration: 1.4, force: true })
  } else {
    const top = target ? target.getBoundingClientRect().top + window.scrollY : 0
    window.scrollTo({ top, behavior: immediate ? "auto" : "smooth" })
  }
  return true
}

/**
 * Click handler for links that may point at a section ("/#about"). When the link
 * targets the current page it scrolls there smoothly instead of navigating;
 * links to other pages navigate normally and the hash is applied on arrival.
 */
export function handleSectionLinkClick(
  event: React.MouseEvent<HTMLAnchorElement>,
  href: string,
  { delay = 0 }: { delay?: number } = {}
) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return
  }

  const url = new URL(href, window.location.href)
  if (url.origin !== window.location.origin || url.pathname !== window.location.pathname) return
  // Plain "/" on the home page means "back to the top"
  if (!url.hash && href !== url.pathname) return

  event.preventDefault()
  const go = () => {
    if (scrollToHash(url.hash)) {
      window.history.replaceState(window.history.state, "", url.hash ? `${url.pathname}${url.hash}` : url.pathname)
    }
  }
  // e.g. wait for a closing menu to release its scroll lock
  if (delay) window.setTimeout(go, delay)
  else go()
}
