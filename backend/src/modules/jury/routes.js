const express = require('express');
const { JuryController } = require('./controller');
const { requireAuth, requireProfessor } = require('../../middleware/auth');

const router = express.Router();
const controller = new JuryController();

// profesorul face asignare random de jurori pentru un deliverable
router.post(
    '/deliverables/:deliverableId/assign-random',
    requireAuth,
    requireProfessor,
    (req, res) => controller.assignRandom(req, res)
);

// assignments pentru un deliverable
router.get(
    '/deliverables/:deliverableId',
    requireAuth,
    requireProfessor,
    (req, res) => controller.getForDeliverable(req, res)
);

// assignments pentru userul logat
router.get(
    '/my',
    requireAuth,
    (req, res) => controller.getMyAssignments(req, res)
);

module.exports = router;
