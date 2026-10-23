let frame = 0
let manual = false

export function markManualScroll() {
  manual = true
}

export function consumeManualScroll() {
  const value = manual
  manual = false
  return value
}

function animateScroll(top: number) {
  cancelAnimationFrame(frame)
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const destination = Math.max(0, top)
  if (reduce) {
    window.scrollTo(0, destination)
    return
  }
  const start = window.scrollY
  const distance = destination - start
  if (Math.abs(distance) < 2) return
  const duration = Math.min(1200, Math.max(720, Math.abs(distance) * 0.5))
  const started = performance.now()
  const step = (now: number) => {
    const progress = Math.min(1, (now - started) / duration)
    const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2
    window.scrollTo({ top: start + distance * ease, behavior: 'instant' })
    if (progress < 1) frame = requestAnimationFrame(step)
  }
  frame = requestAnimationFrame(step)
}

export function scrollToTop() {
  animateScroll(0)
}

export function scrollToId(id: string) {
  if (id === 'top') {
    scrollToTop()
    return
  }
  const target = document.getElementById(id)
  if (!target) {
    scrollToTop()
    return
  }
  const top = target.getBoundingClientRect().top + window.scrollY - 112
  animateScroll(top)
}
