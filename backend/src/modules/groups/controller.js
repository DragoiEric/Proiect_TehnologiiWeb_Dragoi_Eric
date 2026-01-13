const { GroupsService } = require('./service');

const groupsService = new GroupsService();

class GroupsController {
    // creare grupa
    async createGroup(req, res) {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'name este obligatoriu' });
        }

        try {
            const group = await groupsService.createGroup(name, description);
            res.status(201).json(group);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Eroare la crearea grupei' });
        }
    }

    // detalii grupa
    async getGroup(req, res) {
        const { id } = req.params;

        try {
            const group = await groupsService.getGroupById(id);
            res.json(group);
        } catch (err) {
            console.error(err);
            if (err.message === 'Group not found') {
                return res.status(404).json({ error: err.message });
            }
            res.status(500).json({ error: 'Eroare la preluarea grupei' });
        }
    }

    // grupe pentru un course offering
    async getGroupsForOffering(req, res) {
        const { offeringId } = req.params;

        try {
            const groups = await groupsService.getGroupsForOffering(offeringId);
            res.json(groups);
        } catch (err) {
            console.error(err);
            if (['Course offering not found'].includes(err.message)) {
                return res.status(404).json({ error: err.message });
            }
            res.status(500).json({ error: 'Eroare la preluarea grupelor pentru course offering' });
        }
    }

    // adaugare membru in grupa
    async addMember(req, res) {
        const { groupId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId este obligatoriu' });
        }

        try {
            const membership = await groupsService.addMemberToGroup(groupId, userId);
            res.status(201).json(membership);
        } catch (err) {
            console.error(err);
            if (['Group not found', 'User not found', 'Only students can be group members'].includes(err.message)) {
                return res.status(400).json({ error: err.message });
            }
            res.status(500).json({ error: 'Eroare la adaugarea membrului in grupa' });
        }
    }

    // stergere membru din grupa
    async removeMember(req, res) {
        const { groupId, userId } = req.params;

        try {
            await groupsService.removeMemberFromGroup(groupId, userId);
            res.status(204).send();
        } catch (err) {
            console.error(err);
            if (err.message === 'Membership not found') {
                return res.status(404).json({ error: err.message });
            }
            res.status(500).json({ error: 'Eroare la stergerea membrului din grupa' });
        }
    }

    // legare grupa de course offering
    async linkToOffering(req, res) {
        const { groupId, offeringId } = req.params;

        try {
            const link = await groupsService.linkGroupToOffering(groupId, offeringId);
            res.status(201).json(link);
        } catch (err) {
            console.error(err);
            if (['Group not found', 'Course offering not found'].includes(err.message)) {
                return res.status(400).json({ error: err.message });
            }
            res.status(500).json({ error: 'Eroare la legarea grupei de course offering' });
        }
    }

    // stergere legatura grupa - course offering
    async unlinkFromOffering(req, res) {
        const { groupId, offeringId } = req.params;

        try {
            await groupsService.unlinkGroupFromOffering(groupId, offeringId);
            res.status(204).send();
        } catch (err) {
            console.error(err);
            if (err.message === 'Link not found') {
                return res.status(404).json({ error: err.message });
            }
            res.status(500).json({ error: 'Eroare la stergerea legaturii dintre grupa si course offering' });
        }
    }

}

module.exports = { GroupsController };
