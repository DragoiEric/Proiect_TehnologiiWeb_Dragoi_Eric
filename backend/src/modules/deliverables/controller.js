const { DeliverablesService } = require('./service');

const deliverablesService = new DeliverablesService();

class DeliverablesController {
    // creare deliverable pentru proiect
    async createDeliverable(req, res) {
        const { projectId } = req.params;
        const { title, description, dueDate, videoUrl, serverUrl } = req.body;

        if (!title || !dueDate) {
            return res.status(400).json({ error: 'title si dueDate sunt obligatorii' });
        }

        try {
            const deliverable = await deliverablesService.createDeliverable(
                projectId,
                title,
                description,
                dueDate,
                videoUrl,
                serverUrl
            );

            res.status(201).json(deliverable);
        } catch (err) {
            console.error(err);
            if (['Project not found'].includes(err.message)) {
                return res.status(400).json({ error: err.message });
            }
            res.status(500).json({ error: 'Eroare la crearea deliverable' });
        }
    }

    // toate deliverable pentru un proiect
    async getDeliverablesForProject(req, res) {
        const { projectId } = req.params;

        try {
            const deliverables = await deliverablesService.getDeliverablesForProject(projectId);
            res.json(deliverables);
        } catch (err) {
            console.error(err);
            if (err.message === 'Project not found') {
                return res.status(404).json({ error: err.message });
            }
            res.status(500).json({ error: 'Eroare la preluarea deliverable pentru proiect' });
        }
    }

    // detalii pentru un deliverable
    async getDeliverable(req, res) {
        const { id } = req.params;

        try {
            const deliverable = await deliverablesService.getDeliverableById(id);
            res.json(deliverable);
        } catch (err) {
            console.error(err);
            if (err.message === 'Deliverable not found') {
                return res.status(404).json({ error: err.message });
            }
            res.status(500).json({ error: 'Eroare la preluarea deliverable' });
        }
    }

    // adaugare fisier pe deliverable
    async addFile(req, res) {
        const { id } = req.params;
        const { fileName, filePath, fileUrl, fileType, isPrimary } = req.body;

        if (!fileName) {
            return res.status(400).json({ error: 'fileName este obligatoriu' });
        }

        try {
            const file = await deliverablesService.addFileToDeliverable(
                id,
                fileName,
                filePath,
                fileUrl,
                fileType,
                isPrimary
            );

            res.status(201).json(file);
        } catch (err) {
            console.error(err);
            if (['Deliverable not found'].includes(err.message)) {
                return res.status(400).json({ error: err.message });
            }
            res.status(500).json({ error: 'Eroare la adaugarea fisierului' });
        }
    }

    // lista fisiere pentru un deliverable
    async getFiles(req, res) {
        const { id } = req.params;

        try {
            const files = await deliverablesService.getFilesForDeliverable(id);
            res.json(files);
        } catch (err) {
            console.error(err);
            if (err.message === 'Deliverable not found') {
                return res.status(404).json({ error: err.message });
            }
            res.status(500).json({ error: 'Eroare la preluarea fisierelor' });
        }
    }
}

module.exports = { DeliverablesController };
