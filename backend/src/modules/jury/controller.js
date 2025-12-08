const { JuryService } = require('./service');

const juryService = new JuryService();

class JuryController {
    // asignare random de jurori pentru un deliverable
    async assignRandom(req, res) {
        const { deliverableId } = req.params;
        const { count } = req.body;

        const finalCount = Number.isInteger(count) && count > 0 ? count : 3;

        try {
            const assignments = await juryService.assignRandomJurors(
                deliverableId,
                finalCount
            );
            res.status(201).json({
                count: assignments.length,
                assignments
            });
        } catch (err) {
            console.error(err);
            if (
                [
                    'Deliverable not found',
                    'Project not found',
                    'No eligible jurors available'
                ].includes(err.message)
            ) {
                return res.status(400).json({ error: err.message });
            }
            res.status(500).json({ error: 'Error assigning jurors' });
        }
    }

    // assignments pentru un deliverable
    async getForDeliverable(req, res) {
        const { deliverableId } = req.params;

        try {
            const assignments = await juryService.getAssignmentsForDeliverable(
                deliverableId
            );
            res.json(assignments);
        } catch (err) {
            console.error(err);
            if (err.message === 'Deliverable not found') {
                return res.status(404).json({ error: err.message });
            }
            res.status(500).json({ error: 'Error getting jury assignments' });
        }
    }

    // assignments pentru userul logat
    async getMyAssignments(req, res) {
        try {
            const assignments = await juryService.getAssignmentsForUser(
                req.user.id
            );
            res.json(assignments);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error getting jury assignments for user' });
        }
    }
}

module.exports = { JuryController };
