import api from './axios';

/**
 * Extracts a clean invitation token from various user inputs:
 * - Raw token (UUID or 64-char hex)
 * - Deep link (chantierpro://invite/:token or chantierpro://invite?token=...)
 * - Web URL (https://chantierpro.ma/invite/:token or query params)
 * - Full WhatsApp/SMS share message ("Rejoignez mon équipe... chantierpro://invite/:token")
 */
export function extractInvitationToken(input) {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  // 1. Check for query parameters ?token=, ?code=, ?inviteToken=
  const queryMatch = trimmed.match(/[?&](?:token|code|inviteToken)=([a-zA-Z0-9_-]+)/i);
  if (queryMatch?.[1]) {
    return queryMatch[1].trim();
  }

  // 2. Check for URL path patterns:
  //    chantierpro://invite/:token
  //    https://.../invite/:token
  //    https://.../invitations/(?:validate|verify)/:token
  const pathMatch = trimmed.match(/(?:invite|invitations\/(?:validate|verify)?)\/([a-zA-Z0-9_-]+)/i);
  if (pathMatch?.[1]) {
    return pathMatch[1].trim();
  }

  // 3. Check for 64-hex character token (standard crypto.randomBytes(32).toString('hex'))
  const hexMatch = trimmed.match(/\b([a-fA-F0-9]{64})\b/);
  if (hexMatch?.[1]) {
    return hexMatch[1];
  }

  // 4. Check for UUID (8-4-4-4-12 hex)
  const uuidMatch = trimmed.match(/\b([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})\b/i);
  if (uuidMatch?.[1]) {
    return uuidMatch[1];
  }

  // 5. Raw token code (alphanumeric string with at least 8 characters, stripped of surrounding punctuation)
  const stripped = trimmed.replace(/^[^\w]+|[^\w]+$/g, '');
  if (/^[a-zA-Z0-9_-]{8,}$/.test(stripped)) {
    return stripped;
  }

  return '';
}

export const invitationsService = {
  /**
   * Public — validate an invite token (no auth required).
   * Returns { email, role, company }
   */
  validate: (token) => {
    const cleanToken = extractInvitationToken(token) || (typeof token === 'string' ? token.trim() : '');
    if (!cleanToken) {
      return Promise.reject(new Error("Lien d'invitation manquant ou invalide."));
    }
    return api.get(`/invitations/validate/${encodeURIComponent(cleanToken)}`).then((r) => r.data);
  },

  /**
   * BOSS — send an invitation email to a new user.
   * body: { email, role }  (role: 'MANAGER' | 'WORKER')
   */
  send: (data) =>
    api.post('/invitations', data).then((r) => r.data),

  /**
   * Called after /auth/register to link the new user to a company.
   * body: { token }
   */
  accept: (token) =>
    api.post('/invitations/accept', { token }).then((r) => r.data),

  /**
   * BOSS — revoke a pending invitation.
   */
  revoke: (invitationId) =>
    api.patch(`/invitations/${invitationId}/revoke`).then((r) => r.data),
};
