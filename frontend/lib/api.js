export const API_URL = process.env.API_URL || "http://localhost:3001";

/**
 * Meneruskan header penting dari request browser (seperti IP client dari Vercel / Cloudflare)
 * ke Backend Fastify API (Fly.io).
 */
export function getForwardHeaders(request) {
  const headers = { 'Content-Type': 'application/json' };
  if (!request) return headers;

  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-vercel-forwarded-for') ||
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip');

  if (clientIp) {
    headers['x-forwarded-for'] = clientIp;
  }

  const cfCountry = request.headers.get('cf-ipcountry');
  if (cfCountry) {
    headers['cf-ipcountry'] = cfCountry;
  }

  return headers;
}

