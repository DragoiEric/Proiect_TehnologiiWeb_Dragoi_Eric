const { ProjectsService } = require('./service');

const projectsService = new ProjectsService();

class ProjectsController {
    // creare proiect nou
    async createProject(req, res) {
        const { title, description, courseOfferingId, groupId } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'title este obligatoriu' });
        }

        try {
            const project = await projectsService.createProject(
                title,
                description,
                courseOfferingId || null,
                groupId || null,
                req.user
            );

            res.status(201).json(project);
        } catch (err) {
            console.error(err);
            if (['Course offering not found', 'Group not found'].includes(err.message)) {
                return res.status(400).json({ error: err.message });
            }
            res.status(500).json({ error: 'Eroare la crearea proiectului' });
        }
    }

    // proiect cu detalii
    async getProject(req, res) {
        const { id } = req.params;

        try {
            const project = await projectsService.getProjectById(id);
            res.json(project);
        } catch (err) {
            console.error(err);
            if (err.message === 'Project not found') {
                return res.status(404).json({ error: err.message });
            }
            res.status(500).json({ error: 'Eroare la preluarea proiectului' });
        }
    }

    // proiecte pe course offering
    async getProjectsByOffering(req, res) {
        const { offeringId } = req.params;

        try {
            const projects = await projectsService.getProjectsByOffering(offeringId);
            res.json(projects);
        } catch (err) {
            console.error(err);
            if (err.message === 'Course offering not found') {
                return res.status(404).json({ error: err.message });
            }
            res.status(500).json({ error: 'Eroare la preluarea proiectelor pentru course offering' });
        }
    }

    // proiecte pe grupa
    async getProjectsByGroup(req, res) {
        const { groupId } = req.params;

        try {
            const projects = await projectsService.getProjectsByGroup(groupId);
            res.json(projects);
        } catch (err) {
            console.error(err);
            if (err.message === 'Group not found') {
                return res.status(404).json({ error: err.message });
            }
            res.status(500).json({ error: 'Eroare la preluarea proiectelor pentru grupa' });
        }
    }

    // proiectele mele
    async getMyProjects(req, res) {
        try {
            const projects = await projectsService.getProjectsForUser(req.user.id);
            res.json(projects);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Eroare la preluarea proiectelor utilizatorului' });
        }
    }

    // adaug membru in proiect
    async addMember(req, res) {
        const { projectId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId este obligatoriu' });
        }

        try {
            const membership = await projectsService.addMember(projectId, userId, req.user);
            res.status(201).json(membership);
        } catch (err) {
            console.error(err);
            if (
                ['Project not found', 'User not found', 'Not allowed to manage project members'].includes(
                    err.message
                )
            ) {
                return res.status(400).json({ error: err.message });
            }
            res.status(500).json({ error: 'Eroare la adaugarea membrului in proiect' });
        }
    }

    // update leader pentru membru
    async updateMemberRole(req, res) {
        const { projectId, userId } = req.params;
        const { isLeader } = req.body;

        if (typeof isLeader === 'undefined') {
            return res.status(400).json({ error: 'isLeader este obligatoriu' });
        }

        try {
            const membership = await projectsService.updateMemberRole(
                projectId,
                userId,
                isLeader,
                req.user
            );
            res.json(membership);
        } catch (err) {
            console.error(err);
            if (
                ['Project not found', 'Membership not found', 'Not allowed to manage project members'].includes(
                    err.message
                )
            ) {
                return res.status(400).json({ error: err.message });
            }
            res.status(500).json({ error: 'Eroare la actualizarea rolului membrului' });
        }
    }

    // sterg membru din proiect
    async removeMember(req, res) {
        const { projectId, userId } = req.params;

        try {
            await projectsService.removeMember(projectId, userId, req.user);
            res.status(204).send();
        } catch (err) {
            console.error(err);
            if (
                [
                    'Project not found',
                    'Membership not found',
                    'Not allowed to manage project members',
                    'Cannot remove the only leader of the project',
                ].includes(err.message)
            ) {
                return res.status(400).json({ error: err.message });
            }
            res.status(500).json({ error: 'Eroare la stergerea membrului din proiect' });
        }
    }
}

module.exports = { ProjectsController };
