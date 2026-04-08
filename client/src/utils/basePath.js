/**
 * Client URL path under the Vite `base` (matches BrowserRouter basename).
 * Use for window.location / window.open; keep API paths like `${BACKEND_URL}/clinic/...` unchanged.
 */
export function withBasePath(path) {
  const base = import.meta.env.BASE_URL || '/'
  const clean = path.startsWith('/') ? path : `/${path}`
  if (base === '/') return clean
  return `${base.replace(/\/$/, '')}${clean}`
}
