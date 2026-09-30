let frame = 0

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
  const duration = Math.min(1100, 650 + Math.abs(distance) * 0.28)
  const started = performance.now()
  const step = (now: number) => {
    const progress = Math.min(1, (now - started) / duration)
    const ease = 1 - Math.pow(1 - progress, 3)
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
  const top = target.getBoundingClientRect().top + window.scrollY - 88
  animateScroll(top)
}
