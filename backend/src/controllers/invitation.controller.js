const invitationService = require('../services/invitation.service');
const authService = require('../services/auth.service');
const catchAsync = require('../utils/catchAsync');

// POST /invitations/register — public registration using the invitation token
exports.registerInvitedUser = catchAsync(async (req, res) => {
  const result = await authService.register(req.body);

  res.status(201).json({
    success: true,
    data: result,
  });
});

// POST /invitations — BOSS sends an invitation
exports.sendInvitation = catchAsync(async (req, res) => {
  const invitation = await invitationService.sendInvitation({
    email: req.body.email,
    role: req.body.role,
    invitedBy: req.user.id,
    companyId: req.user.companyId,
  });

  res.status(201).json({
    success: true,
    data: invitation,
  });
});

// POST /invitations/accept — Logged-in user accepts via token
exports.acceptInvitation = catchAsync(async (req, res) => {
  const { user, invitation } = await invitationService.acceptInvitation({
    token: req.body.token,
    userId: req.user.id,
  });

  res.json({
    success: true,
    data: { user, invitation },
  });
});

// PATCH /invitations/:id/revoke — BOSS revokes a pending invitation
exports.revokeInvitation = catchAsync(async (req, res) => {
  const invitation = await invitationService.revokeInvitation({
    invitationId: req.params.id,
    requesterId: req.user.id,
  });

  res.json({
    success: true,
    data: invitation,
  });
});

// GET /invitations — BOSS gets all company invitations
exports.getCompanyInvitations = catchAsync(async (req, res) => {
  const invitations = await invitationService.getCompanyInvitations(
    req.user.companyId,
    req.user.id
  );

  res.json({
    success: true,
    data: invitations,
  });
});

// GET /invitations/validate/:token — Public, used before register flow
exports.validateToken = catchAsync(async (req, res) => {
  const data = await invitationService.validateToken(req.params.token);

  res.json({
    success: true,
    data,
  });
});
