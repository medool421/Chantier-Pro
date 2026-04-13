const crypto = require('crypto');
const { Invitation, User, Company } = require('../models');
const AppError = require('../utils/AppError');
const { sendNotification } = require('./notification.service');
const { sendInvitationEmail } = require('./email.service');

const INVITATION_EXPIRY_HOURS = 48;

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// ─── Send an invitation ────────────────────────────────────────────────────
async function sendInvitation({ email, role, invitedBy, companyId }) {
  // #region agent log
  fetch('http://127.0.0.1:7376/ingest/d2026b59-fde2-4b44-b199-784e44ae48ce',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'404a50'},body:JSON.stringify({sessionId:'404a50',hypothesisId:'C',location:'invitation.service.js:sendInvitation:entry',message:'sendInvitation entered',data:{role,emailDomain:typeof email==='string'?email.split('@')[1]:null,hasPlus:typeof email==='string'&&email.includes('+')},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  const inviter = await User.findByPk(invitedBy);
  if (!inviter) throw new AppError('Inviter not found', 404);
  if (inviter.companyId !== companyId) throw new AppError('Unauthorized', 403);
  if (inviter.role !== 'BOSS') throw new AppError('Only a BOSS can send invitations', 403);

  const company = await Company.findByPk(companyId);
  if (!company) throw new AppError('Company not found', 404);

  const existingUser = await User.findOne({ where: { email, companyId } });
  if (existingUser) throw new AppError('This user is already a member of the company', 409);

  const existingInvitation = await Invitation.findOne({
    where: { email, companyId, status: 'PENDING' },
  });
  if (existingInvitation) throw new AppError('A pending invitation already exists for this email', 409);

  const token = generateToken();
  const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_HOURS * 60 * 60 * 1000);

  const invitation = await Invitation.create({
    email,
    role,
    token,
    status: 'PENDING',
    expiresAt,
    companyId,
    invitedBy,
  });

  // #region agent log
  fetch('http://127.0.0.1:7376/ingest/d2026b59-fde2-4b44-b199-784e44ae48ce',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'404a50'},body:JSON.stringify({sessionId:'404a50',hypothesisId:'C',location:'invitation.service.js:sendInvitation:preEmail',message:'invitation row created, calling sendInvitationEmail',data:{invitationId:invitation.id},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  // Send email — after DB insert so invitation exists even if email fails
  await sendInvitationEmail({
    to: email,
    inviterName: `${inviter.firstName} ${inviter.lastName}`,
    companyName: company.name,
    role,
    token,
    expiresAt,
  });

  return invitation;
}

// ─── Accept an invitation ──────────────────────────────────────────────────
async function acceptInvitation({ token, userId }) {
  const invitation = await Invitation.findOne({ where: { token } });

  if (!invitation) throw new AppError('Invalid invitation token', 404);
  if (invitation.status !== 'PENDING') {
    throw new AppError(`Invitation is already ${invitation.status.toLowerCase()}`, 400);
  }
  if (new Date() > invitation.expiresAt) {
    await invitation.update({ status: 'EXPIRED' });
    throw new AppError('Invitation has expired', 400);
  }

  const user = await User.findByPk(userId);
  if (!user) throw new AppError('User not found', 404);

  if (user.email !== invitation.email) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ DEV MODE: Email mismatch bypassed');
    } else {
      throw new AppError('This invitation was sent to a different email address', 403);
    }
  }

  await user.update({
    companyId: invitation.companyId,
    role: invitation.role,
    status: 'ACTIVE',
  });

  await invitation.update({ status: 'ACCEPTED' });

  if (invitation.invitedBy) {
    await sendNotification({
      userId: invitation.invitedBy,
      title: '✅ Invitation acceptée',
      body: `${user.firstName} ${user.lastName} a rejoint votre entreprise`,
      type: 'INVITATION_ACCEPTED',
      data: { userId: user.id, companyId: invitation.companyId },
    });
  }

  return { user, invitation };
}

// ─── Revoke an invitation ──────────────────────────────────────────────────
async function revokeInvitation({ invitationId, requesterId }) {
  const invitation = await Invitation.findByPk(invitationId);
  if (!invitation) throw new AppError('Invitation not found', 404);

  const requester = await User.findByPk(requesterId);
  if (!requester || requester.companyId !== invitation.companyId) throw new AppError('Unauthorized', 403);
  if (requester.role !== 'BOSS') throw new AppError('Only a BOSS can revoke invitations', 403);
  if (invitation.status !== 'PENDING') throw new AppError('Only pending invitations can be revoked', 400);

  await invitation.update({ status: 'REVOKED' });
  return invitation;
}

// ─── List all invitations for a company ───────────────────────────────────
async function getCompanyInvitations(companyId, requesterId) {
  const requester = await User.findByPk(requesterId);
  if (!requester || requester.companyId !== companyId) throw new AppError('Unauthorized', 403);
  if (requester.role !== 'BOSS') throw new AppError('Only a BOSS can view invitations', 403);

  return Invitation.findAll({
    where: { companyId },
    include: [
      {
        model: User,
        as: 'inviter',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
    ],
    order: [['createdAt', 'DESC']],
  });
}

// ─── Validate token (public — used before register) ───────────────────────
async function validateToken(token) {
  const invitation = await Invitation.findOne({
    where: { token },
    include: [
      {
        model: Company,
        as: 'company',
        attributes: ['id', 'name'],
      },
    ],
  });

  if (!invitation) throw new AppError('Invalid invitation token', 404);
  if (invitation.status !== 'PENDING') {
    throw new AppError(`Invitation is already ${invitation.status.toLowerCase()}`, 400);
  }
  if (new Date() > invitation.expiresAt) {
    await invitation.update({ status: 'EXPIRED' });
    throw new AppError('Invitation has expired', 400);
  }

  return {
    email: invitation.email,
    role: invitation.role,
    company: invitation.company,
    expiresAt: invitation.expiresAt,
  };
}

module.exports = {
  sendInvitation,
  acceptInvitation,
  revokeInvitation,
  getCompanyInvitations,
  validateToken,
};