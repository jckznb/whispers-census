import { toPng } from 'html-to-image'

/**
 * Renders a DOM element to a PNG and shares it via the Web Share API.
 * Falls back to triggering a download if Web Share isn't available.
 *
 * @param {HTMLElement} element  The off-screen template element to capture
 * @param {string}      filename Suggested filename without extension
 * @param {string}      title    Share sheet title
 */
export async function shareImage(element, filename, title) {
  const dataUrl = await toPng(element, {
    pixelRatio:      2,
    cacheBust:       true,
    backgroundColor: '#0d0518',
  })

  const blob = await (await fetch(dataUrl)).blob()
  const file = new File([blob], `${filename}.png`, { type: 'image/png' })

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title })
  } else if (navigator.share) {
    // Browser supports share but not files — share the URL instead
    await navigator.share({ url: window.location.href, title })
  } else {
    // Last resort: download
    const a = document.createElement('a')
    a.download = `${filename}.png`
    a.href = dataUrl
    a.click()
  }
}
