const Deliverable = require('../../models/Deliverable');
const DeliverableFile = require('../../models/DeliverableFile');
const Project = require('../../models/Project');

class DeliverablesService {
    // creare deliverable nou pentru proiect
    async createDeliverable(projectId, title, description, dueDate, videoUrl, serverUrl) {
        const project = await Project.findByPk(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        const deliverable = await Deliverable.create({
            projectId: project.id,
            title,
            description: description || null,
            dueDate,
            videoUrl: videoUrl || null,
            serverUrl: serverUrl || null,
        });

        return deliverable;
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
}

module.exports = { DeliverablesService };
