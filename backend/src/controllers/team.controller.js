const teamService = require('../services/team.service');
const catchAsync = require('../utils/catchAsync');

exports.createTeam = catchAsync(async (req, res) => {
    const team = await teamService.createTeam(req.body, req.user.id);
    res.status(201).json({
        success: true,
        data: team
    });
});

exports.getTeam = catchAsync(async (req, res) => {
    const team = await teamService.getTeamById(req.params.id);
    res.json({
        success: true,
        data: team
    });
});


exports.getProjTeam = async (req, res, next) => {
  try {
    const team = await teamService.getProjectTeam(req.params.id);

    res.status(200).json({
      success: true,
      data: team,
    });
  } catch (error) {
    next(error);
  }
};

exports.getTeams = catchAsync(async (req, res) => {
    const teams = await teamService.getTeams(req.query);
    res.json({
        success: true,
        data: teams
    });
});

exports.updateTeam = catchAsync(async (req, res) => {
    const team = await teamService.updateTeam(req.params.id, req.body);
    res.json({
        success: true,
        data: team
    });
});

exports.deleteTeam = catchAsync(async (req, res) => {
    await teamService.deleteTeam(req.params.id);
    res.status(204).send();
});

exports.addMember = catchAsync(async (req, res) => {
    const member = await teamService.addMember(
        req.params.id,
        req.body.userId,
        req.body.roleInTeam
    );
    res.status(201).json({
        success: true,
        data: member
    });
});

exports.removeMember = catchAsync(async (req, res) => {
    await teamService.removeMember(req.params.id, req.params.userId);
    res.status(204).send();
});
