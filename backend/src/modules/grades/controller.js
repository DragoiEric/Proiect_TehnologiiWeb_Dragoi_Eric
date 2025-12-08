// src/modules/grades/controller.js
const { GradesService } = require('./service');

const gradesService = new GradesService();

class GradesController {
    // student juror da nota
    async submitGrade(req, res) {
        const { deliverableId } = req.params;
        const { score, comment } = req.body;

        if (typeof score === 'undefined') {
            return res.status(400).json({ error: 'score este obligatoriu' });
        }

        try {
            const grade = await gradesService.submitGrade(
                deliverableId,
                req.user.id,
                score,
                comment
            );
            res.status(201).json(grade);
        } catch (err) {
            console.error(err);
            if (err.message === 'Deliverable not found') {
                return res.status(404).json({ error: err.message });
            }
            if (err.message === 'User is not juror for this deliverable') {
                return res.status(403).json({ error: err.message });
            }
            if (['Grade already exists', 'Invalid score'].includes(err.message)) {
                return res.status(400).json({ error: err.message });
            }
            res.status(500).json({ error: 'Error submitting grade' });
        }
    }

    // note pentru un deliverable pentru profesor
    async getGradesForDeliverable(req, res) {
        const { deliverableId } = req.params;

        try {
            const grades = await gradesService.getGradesForDeliverableForProfessor(
                deliverableId
            );
            res.json(grades);
        } catch (err) {
            console.error(err);
            if (err.message === 'Deliverable not found') {
                return res.status(404).json({ error: err.message });
            }
            res.status(500).json({ error: 'Error getting grades' });
        }
    }

    // note date de userul curent
    async getMyGrades(req, res) {
        try {
            const grades = await gradesService.getGradesForUser(req.user.id);
            res.json(grades);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error getting user grades' });
        }
    }

    // profesor recalculeaza nota finala pentru un deliverable
    async recalculateFinal(req, res) {
        const { deliverableId } = req.params;

        try {
            const finalGrade = await gradesService.recalculateFinalForDeliverable(
                deliverableId
            );
            res.status(201).json(finalGrade);
        } catch (err) {
            console.error(err);
            if (err.message === 'Deliverable not found') {
                return res.status(404).json({ error: err.message });
            }
            if (['Project not found', 'No grades for deliverable'].includes(err.message)) {
                return res.status(400).json({ error: err.message });
            }
            res.status(500).json({ error: 'Error recalculating final grade' });
        }
    }

    // profesor vede note finale pentru proiect
    async getFinalForProject(req, res) {
        const { projectId } = req.params;

        try {
            const finals = await gradesService.getFinalGradesForProject(projectId);
            res.json(finals);
        } catch (err) {
            console.error(err);
            if (err.message === 'Project not found') {
                return res.status(404).json({ error: err.message });
            }
            res.status(500).json({ error: 'Error getting final grades for project' });
        }
    }
}

module.exports = { GradesController };
