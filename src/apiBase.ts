/**
 * Base URL for the Node/Express API when the frontend is packaged as an Android APK.
 * Keep empty for the normal same-origin web deployment.
 */
const configured = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');

export function apiUrl(path: string): string {
  if (!configured) return path;
  return `${configured}${path.startsWith('/') ? path : `/${path}`}`;
}
