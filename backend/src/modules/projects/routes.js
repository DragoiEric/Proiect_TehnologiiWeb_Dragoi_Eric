const express = require('express');
const { ProjectsController } = require('./controller');
const { requireAuth } = require('../../middleware/auth');

const router = express.Router();
const controller = new ProjectsController();

// creez proiect nou
router.post('/', requireAuth, (req, res) => controller.createProject(req, res));

// proiectele userului curent
router.get('/my', requireAuth, (req, res) => controller.getMyProjects(req, res));

// proiecte dupa course offering
router.get('/by-offering/:offeringId', requireAuth, (req, res) =>
    controller.getProjectsByOffering(req, res)
);

// proiecte dupa grupa
router.get('/by-group/:groupId', requireAuth, (req, res) =>
    controller.getProjectsByGroup(req, res)
);

// proiect cu detalii
router.get('/:id', requireAuth, (req, res) => controller.getProject(req, res));

// adaug membru
router.post('/:projectId/members', requireAuth, (req, res) =>
    controller.addMember(req, res)
);

// schimb leader
router.patch('/:projectId/members/:userId', requireAuth, (req, res) =>
    controller.updateMemberRole(req, res)
);

// sterg membru
router.delete('/:projectId/members/:userId', requireAuth, (req, res) =>
    controller.removeMember(req, res)
);

module.exports = router;
