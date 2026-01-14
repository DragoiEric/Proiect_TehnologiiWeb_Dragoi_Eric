const express = require('express');
const { DeliverablesController } = require('./controller');
const { requireAuth, requireProfessor } = require('../../middleware/auth');

const router = express.Router();
const controller = new DeliverablesController();

// creare deliverable pentru proiect
router.post(
    '/projects/:projectId',
    requireAuth,
    requireProfessor,
    (req, res) => controller.createDeliverable(req, res)
);

// lista deliverable pentru proiect
router.get(
    '/projects/:projectId',
    requireAuth,
    (req, res) => controller.getDeliverablesForProject(req, res)
);

router.patch(
  "/:id",
  requireAuth,
  (req, res) => controller.updateDeliverable(req, res)
);


// detalii deliverable
router.get(
    '/:id',
    requireAuth,
    (req, res) => controller.getDeliverable(req, res)
);

// adaugare fisier pe deliverable
router.post(
    '/:id/files',
    requireAuth,
    requireProfessor,
    (req, res) => controller.addFile(req, res)
);

// lista fisiere pentru deliverable
router.get(
    '/:id/files',
    requireAuth,
    (req, res) => controller.getFiles(req, res)
);

module.exports = router;
