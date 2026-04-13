const { sequelize } = require('../config/database');
const User = require('../models/User');
const Company = require('../models/Company');
const { Invitation } = require('../models');
const { signToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');
const { sendNotification } = require('./notification.service');

// ─── Helper: build JWT ─────────────────────────────────────────────────────
function buildToken(user) {
  return signToken({
    id: user.id,
    role: user.role,
    companyId: user.companyId,
  });
}

// ─── Register BOSS + create Company atomically ────────────────────────────
exports.registerBoss = async ({ password, companyName, ...userData }) => {
  const result = await sequelize.transaction(async (t) => {
    const company = await Company.create(
      { name: companyName },
      { transaction: t }
    );

    const user = await User.create(
      {
        ...userData,
        passwordHash: password,
        role: 'BOSS',
        companyId: company.id,
        status: 'ACTIVE',
      },
      { transaction: t }
    );

    return { user, company };
  });

  const token = buildToken(result.user);
  return { user: result.user, company: result.company, token };
};

// ─── Register invited user (MANAGER or WORKER) ────────────────────────────
// Email, role, and companyId are ALWAYS derived from the invitation.
// Frontend only provides: firstName, lastName, password, inviteToken.
exports.register = async ({ password, firstName, lastName, inviteToken, email }) => {
  // Step 1 — fetch and validate invitation
  const invitation = await Invitation.findOne({ where: { token: inviteToken } });

  if (!invitation) throw new AppError('Invalid invitation token', 404);
  if (invitation.status !== 'PENDING') {
    throw new AppError(`Invitation is already ${invitation.status.toLowerCase()}`, 400);
  }
  if (new Date() > invitation.expiresAt) {
    await invitation.update({ status: 'EXPIRED' });
    throw new AppError('Invitation has expired', 400);
  }

  // Step 2 — create user + mark invitation ACCEPTED atomically
  const finalEmail =
    process.env.NODE_ENV === 'development' && email
        ? email
        : invitation.email;
        console.log({
          invitationEmail: invitation.email,
          usedEmail: finalEmail,
        });
  const user = await sequelize.transaction(async (t) => {
    const newUser = await User.create(
      {
        firstName,
        lastName,
        email: finalEmail,          
        passwordHash: password,
        role: invitation.role,            // from invitation — never from frontend
        companyId: invitation.companyId,  // from invitation — never from frontend
        status: 'ACTIVE',
      },
      { transaction: t }
    );

    await invitation.update({ status: 'ACCEPTED' }, { transaction: t });

    return newUser;
  });

  // Step 3 — notify the inviter
  if (invitation.invitedBy) {
    await sendNotification({
      userId: invitation.invitedBy,
      title: '✅ Invitation acceptée',
      body: `${user.firstName} ${user.lastName} a rejoint votre entreprise`,
      type: 'INVITATION_ACCEPTED',
      data: { userId: user.id, companyId: invitation.companyId },
    });
  }

  const token = buildToken(user);
  return { user, token };
};

// ─── Login ─────────────────────────────────────────────────────────────────
exports.login = async (email, password) => {
  const user = await User.findOne({ where: { email } });

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  if (user.status === 'PENDING') {
    throw new AppError('Your account is pending. Please accept your invitation first.', 403);
  }

  const token = buildToken(user);
  return { user, token };
};

// ─── Get current user ──────────────────────────────────────────────────────
exports.getMe = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [
      {
        model: Company,
        attributes: ['id', 'name'],
      },
    ],
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};