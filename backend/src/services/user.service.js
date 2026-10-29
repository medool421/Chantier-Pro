const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const {
  sequelize,
  User,
  Project,
  Task,
  TaskAssignment,
  TeamMember,
  Invitation,
  Notification,
} = require('../models');
const AppError = require('../utils/AppError');

async function deleteMyAccount(userId) {
  await sequelize.transaction(async (transaction) => {
    const user = await User.findByPk(userId, { transaction });
    if (!user || !user.isActive) {
      throw new AppError('Compte introuvable ou déjà supprimé.', 404);
    }

    const originalEmail = user.email;
    const anonymizedEmail = `deleted-${user.id}@example.com`;
    const randomPassword = crypto.randomBytes(48).toString('hex');
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    // Preserve company projects and their history while removing this user's
    // active ownership and assignment links.
    await Project.update(
      { bossId: null },
      { where: { bossId: user.id }, transaction }
    );
    await Project.update(
      { managerId: null },
      { where: { managerId: user.id }, transaction }
    );
    await Task.update(
      { assignedTo: null },
      { where: { assignedTo: user.id }, transaction }
    );
    await Task.update(
      { createdBy: null },
      { where: { createdBy: user.id }, transaction }
    );

    await TaskAssignment.destroy({
      where: { userId: user.id },
      transaction,
    });
    await TaskAssignment.update(
      { assignedBy: null },
      { where: { assignedBy: user.id }, transaction }
    );
    await TeamMember.destroy({
      where: { userId: user.id },
      transaction,
    });

    // Revoke outstanding invitations and remove the inviter reference. Also
    // anonymize invitation addresses belonging to the account being deleted.
    await Invitation.update(
      { status: 'REVOKED', invitedBy: null },
      { where: { invitedBy: user.id, status: 'PENDING' }, transaction }
    );
    await Invitation.update(
      { invitedBy: null },
      { where: { invitedBy: user.id }, transaction }
    );
    await Invitation.update(
      { email: anonymizedEmail },
      {
        where: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('email')),
          originalEmail.trim().toLowerCase()
        ),
        transaction,
      }
    );

    await Notification.destroy({
      where: { userId: user.id },
      transaction,
    });

    // Keep a non-login tombstone for required historical foreign keys on
    // reports, task updates, and uploaded files. The status enum in the
    // current schema has no DELETED value, so isActive is the deletion flag.
    await user.update({
      firstName: 'Compte',
      lastName: 'supprimé',
      email: anonymizedEmail,
      passwordHash,
      phone: null,
      companyId: null,
      expoPushToken: null,
      isActive: false,
    }, { transaction });
  });

  return {
    success: true,
    message: 'Compte supprimé avec succès.',
  };
}

module.exports = { deleteMyAccount };
