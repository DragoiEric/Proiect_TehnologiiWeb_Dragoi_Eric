// src/modules/reports/routes.js
const express = require('express');
const { ReportsController } = require('./controller');
const { requireAuth, requireProfessor } = require('../../middleware/auth');

const router = express.Router();
const controller = new ReportsController();

// summary pentru un course offering pentru profesor
router.get(
    '/course-offerings/:offeringId/summary',
    requireAuth,
    requireProfessor,
    (req, res) => controller.getCourseOfferingSummary(req, res)
);

// summary pentru un proiect pentru profesor
router.get(
    '/projects/:projectId/summary',
    requireAuth,
    requireProfessor,
    (req, res) => controller.getProjectSummary(req, res)
);

module.exports = router;
