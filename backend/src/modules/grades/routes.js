// src/modules/grades/routes.js
const express = require('express');
const { GradesController } = require('./controller');
const { requireAuth, requireProfessor } = require('../../middleware/auth');

const router = express.Router();
const controller = new GradesController();

// student juror da nota la un deliverable
router.post(
    '/deliverables/:deliverableId',
    requireAuth,
    (req, res) => controller.submitGrade(req, res)
);

// profesor vede notele la un deliverable fara jurori
router.get(
    '/deliverables/:deliverableId',
    requireAuth,
    requireProfessor,
    (req, res) => controller.getGradesForDeliverable(req, res)
);

// userul curent vede notele date de el
router.get(
    '/my',
    requireAuth,
    (req, res) => controller.getMyGrades(req, res)
);

// profesor recalculeaza nota finala pentru un deliverable
router.post(
    '/deliverables/:deliverableId/recalculate-final',
    requireAuth,
    requireProfessor,
    (req, res) => controller.recalculateFinal(req, res)
);

// profesor vede notele finale pentru un proiect
router.get(
    '/projects/:projectId/final',
    requireAuth,
    requireProfessor,
    (req, res) => controller.getFinalForProject(req, res)
);

module.exports = router;
