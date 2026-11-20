import { randomBytes } from 'node:crypto';

const SESSION_MS = 10 * 60 * 1000;
const LIMITS = { autocomplete: 40, estimate: 3 };

export async function verifyTurnstile(token, secret, hostname, fetcher = fetch) {
  if (typeof token !== 'string' || !token || token.length > 2048) return false;
  const response = await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error('No se pudo verificar la solicitud. Probá de nuevo.');
  const result = await response.json();
  return result.success === true && result.hostname === hostname;
}

export function createHumanGate(now = Date.now) {
  const sessions = new Map();
  function session(request) {
    const id = request.headers.cookie?.match(/(?:^|;\s*)petway_human=([a-f0-9]{48})(?:;|$)/)?.[1];
    const entry = id && sessions.get(id);
    if (!entry) return null;
    if (entry.expires <= now()) {
      sessions.delete(id);
      return null;
    }
    return entry;
  }
  return {
    issue(response) {
      for (const [id, entry] of sessions) if (entry.expires <= now()) sessions.delete(id);
      const id = randomBytes(24).toString('hex');
      sessions.set(id, { expires: now() + SESSION_MS, autocomplete: 0, estimate: 0 });
      response.setHeader('Set-Cookie', `petway_human=${id}; Max-Age=600; Path=/api/; HttpOnly; SameSite=Strict`);
    },
    consume(request, kind) {
      const entry = session(request);
      if (!entry) return { status: 403, error: 'Verificá que sos una persona para consultar rutas.' };
      if (entry[kind] >= LIMITS[kind]) return { status: 429, error: 'Llegaste al límite de consultas de esta verificación. Podés consultar por WhatsApp.' };
      entry[kind] += 1;
      return null;
    },
  };
}
