import api from './axios';

export const invitationsService = {
  /**
   * Public — validate an invite token (no auth required).
   * Returns { email, role, company }
   */
  validate: (token) =>
    api.get(`/invitations/validate/${token}`).then((r) => r.data),

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
