// src/modules/reports/controller.js
const { ReportsService } = require('./service');

const reportsService = new ReportsService();

class ReportsController {
    // summary pentru course offering
    async getCourseOfferingSummary(req, res) {
        const { offeringId } = req.params;

        try {
            const summary = await reportsService.getCourseOfferingSummary(offeringId);
            res.json(summary);
        } catch (err) {
            console.error(err);
            if (err.message === 'Course offering not found') {
                return res.status(404).json({ error: err.message });
            }
            res.status(500).json({ error: 'Error getting course offering summary' });
        }
    }

    // summary pentru proiect
    async getProjectSummary(req, res) {
        const { projectId } = req.params;

        try {
            const summary = await reportsService.getProjectSummary(projectId);
            res.json(summary);
        } catch (err) {
            console.error(err);
            if (err.message === 'Project not found') {
                return res.status(404).json({ error: err.message });
            }
            res.status(500).json({ error: 'Error getting project summary' });
        }
    }
}

module.exports = { ReportsController };
