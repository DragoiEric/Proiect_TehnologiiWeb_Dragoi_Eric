const { Op } = require('sequelize');
const JuryAssignment = require('../../models/JuryAssignment');
const Deliverable = require('../../models/Deliverable');
const Project = require('../../models/Project');
const ProjectMember = require('../../models/ProjectMember');
const User = require('../../models/User');

class JuryService {
    // assignments random pentru un deliverable
    async assignRandomJurors(deliverableId, count) {
  const deliverable = await Deliverable.findByPk(deliverableId);
  if (!deliverable) throw new Error("Deliverable not found");

  const project = await Project.findByPk(deliverable.projectId);
  if (!project) throw new Error("Project not found");

  const members = await ProjectMember.findAll({ where: { projectId: project.id } });
  const memberIds = members.map((m) => m.userId);

  const existingAssignments = await JuryAssignment.findAll({ where: { deliverableId } });
  const alreadyAssignedIds = existingAssignments.map((a) => a.jurorId);

  const excludedIds = [...new Set([...memberIds, ...alreadyAssignedIds])];

  const groupId = project.groupId;
  if (!groupId) throw new Error("Project has no groupId");

  const sameGroupMembers = await GroupMember.findAll({ where: { groupId } });
  const sameGroupIds = sameGroupMembers.map((gm) => gm.userId);

  const excludeAll = [...new Set([...excludedIds, ...sameGroupIds])];

  const eligibleStudents = await User.findAll({
    where: {
      role: "student",
      id: excludeAll.length > 0 ? { [Op.notIn]: excludeAll } : { [Op.ne]: null },
    },
  });

  if (eligibleStudents.length === 0) throw new Error("No eligible jurors available");

  const finalCount = Math.min(Number(count) || 10, eligibleStudents.length);

  const shuffled = [...eligibleStudents];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = tmp;
  }

  const selected = shuffled.slice(0, finalCount);

  const created = [];
  for (const student of selected) {
    const assignment = await JuryAssignment.create({
      deliverableId,
      jurorId: student.id,
      grade: null,
    });
    created.push(assignment);
  }

  return created;
}


    // iau assignments pentru un deliverable
    async getAssignmentsForDeliverable(deliverableId) {
        const deliverable = await Deliverable.findByPk(deliverableId);
        if (!deliverable) {
            throw new Error('Deliverable not found');
        }

        const assignments = await JuryAssignment.findAll({
            where: { deliverableId },
            include: [
                {
                    model: User,
                    as: 'juror',
                    attributes: ['id', 'name', 'role']
                }
            ]
        });

        return assignments;
    }

    // iau assignments pentru un user
    async getAssignmentsForUser(userId) {
        const assignments = await JuryAssignment.findAll({
            where: { jurorId: userId },
            include: [
                {
                    model: Deliverable,
                    as: 'deliverable',
                    include: [
                        {
                            model: Project,
                            as: 'project'
                        }
                    ]
                }
            ],
            order: [['assignedAt', 'ASC']]
        });

        return assignments;
    }
}

module.exports = { JuryService };
