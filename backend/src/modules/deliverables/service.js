const Deliverable = require('../../models/Deliverable');
const DeliverableFile = require('../../models/DeliverableFile');
const Project = require('../../models/Project');
const ProjectMember = require("../../models/ProjectMember");
const ProjectFinalGrade = require("../../models/ProjectFinalGrade");
const { Op } = require("sequelize");
const JuryAssignment = require("../../models/JuryAssignment");
const User = require("../../models/User");
const GroupMember = require("../../models/GroupMember");


class DeliverablesService {
    // creare deliverable nou pentru proiect
    async createDeliverable(projectId, title, description, dueDate, videoUrl, serverUrl, juryCount = 10) {
    return Deliverable.sequelize.transaction(async (t) => {
      const project = await Project.findByPk(projectId, { transaction: t });
      if (!project) throw new Error("Project not found");

      const deliverable = await Deliverable.create(
        {
          projectId: project.id,
          title,
          description: description || null,
          dueDate,
          videoUrl: videoUrl || null,
          serverUrl: serverUrl || null,
        },
        { transaction: t }
      );

      await ProjectFinalGrade.create(
        {
          projectId: project.id,
          deliverableId: deliverable.id,
          finalScore: null,
          calculatedAt: null,
        },
        { transaction: t }
      );

      const jury = await this.assignRandomJurorsForDeliverable(
        {
          deliverableId: deliverable.id,
          projectId: project.id,
          groupId: project.groupId,
          count: juryCount,
          transaction: t,
        }
      );

      return { deliverable, juryAssigned: jury.length };
    });
  }

  async assignRandomJurorsForDeliverable({ deliverableId, projectId, groupId, count, transaction }) {
    if (!groupId) throw new Error("Project has no groupId");

    const members = await ProjectMember.findAll({
      where: { projectId },
      transaction,
    });
    const memberIds = members.map((m) => m.userId);

    const existingAssignments = await JuryAssignment.findAll({
      where: { deliverableId },
      transaction,
    });
    const alreadyAssignedIds = existingAssignments.map((a) => a.jurorId);

    const sameGroupMembers = await GroupMember.findAll({
      where: { groupId },
      transaction,
    });
    const sameGroupIds = sameGroupMembers.map((gm) => gm.userId);

    const excludeAll = [...new Set([...memberIds, ...alreadyAssignedIds, ...sameGroupIds])];

    const eligibleStudents = await User.findAll({
      where: {
        role: "student",
        id: excludeAll.length ? { [Op.notIn]: excludeAll } : { [Op.ne]: null },
      },
      transaction,
    });

    if (eligibleStudents.length === 0) return [];

    const finalCount = Math.min(Number(count) || 10, eligibleStudents.length);

    const shuffled = [...eligibleStudents];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = tmp;
    }

    const selected = shuffled.slice(0, finalCount);

    const rows = selected.map((s) => ({
      deliverableId,
      jurorId: s.id,
      grade: null,
    }));

    return JuryAssignment.bulkCreate(rows, { transaction });
  }


    // lista deliverable pentru proiect
    async getDeliverablesForProject(projectId) {
        const project = await Project.findByPk(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        const deliverables = await Deliverable.findAll({
            where: { projectId },
            order: [['dueDate', 'ASC']],
        });

        return deliverables;
    }

    // detalii deliverable cu proiect si fisiere
    async getDeliverableById(id) {
        const deliverable = await Deliverable.findByPk(id, {
            include: [
                {
                    model: Project,
                    as: 'project',
                },
                {
                    model: DeliverableFile,
                    as: 'files',
                },
            ],
        });

        if (!deliverable) {
            throw new Error('Deliverable not found');
        }

        return deliverable;
    }

    // adaugare fisier pentru deliverable
    async addFileToDeliverable(deliverableId, fileName, filePath, fileUrl, fileType, isPrimary) {
        const deliverable = await Deliverable.findByPk(deliverableId);
        if (!deliverable) {
            throw new Error('Deliverable not found');
        }

        const allowedTypes = ['video', 'document', 'archive', 'image', 'other'];
        const finalType = allowedTypes.includes(fileType) ? fileType : 'other';

        const file = await DeliverableFile.create({
            deliverableId,
            fileName,
            filePath: filePath || null,
            fileUrl: fileUrl || null,
            fileType: finalType,
            isPrimary: !!isPrimary,
        });

        return file;
    }

    // lista fisiere pentru deliverable
    async getFilesForDeliverable(deliverableId) {
        const deliverable = await Deliverable.findByPk(deliverableId);
        if (!deliverable) {
            throw new Error('Deliverable not found');
        }

        const files = await DeliverableFile.findAll({
            where: { deliverableId },
            order: [['uploadedAt', 'ASC']],
        });

        return files;
    }

    async updateDeliverable({ deliverableId, requester, patch }) {
  if (!Number.isInteger(deliverableId) || deliverableId <= 0) {
    throw new Error("Id invalid");
  }

  const deliverable = await Deliverable.findByPk(deliverableId);
  if (!deliverable) throw new Error("NOT_FOUND");

  const project = await Project.findByPk(deliverable.projectId);
  if (!project) throw new Error("FORBIDDEN");

  const role = String(requester?.role || "").toLowerCase();
  const isProfessor = role === "professor" || role === "admin";

  if (!isProfessor) {
    const member = await ProjectMember.findOne({
      where: { projectId: deliverable.projectId, userId: requester.id },
    });
    if (!member) throw new Error("FORBIDDEN");
  }

  const allowed = ["title", "description", "videoUrl", "serverUrl"];
  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(patch, k)) {
      const v = patch[k];
      deliverable[k] = v === "" ? null : v;
    }
  }

  await deliverable.save();
  return deliverable;
}

}

module.exports = { DeliverablesService };
