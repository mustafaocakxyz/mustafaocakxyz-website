/** Supabase rejects 4+ label domains (e.g. gelisim.app.mustafaocak.xyz). */
export const AUTH_EMAIL_DOMAIN = 'gelisim.mustafaocak.xyz';

export function buildAuthEmail(loginUsername: string): string {
  return `${loginUsername.trim().toLowerCase()}@${AUTH_EMAIL_DOMAIN}`;
}
