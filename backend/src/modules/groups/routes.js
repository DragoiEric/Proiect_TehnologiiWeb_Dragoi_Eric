const express = require('express');
const { GroupsController } = require('./controller');
const { requireAuth, requireProfessor } = require('../../middleware/auth');

const router = express.Router();
const controller = new GroupsController();

// creeaza o grupa 
router.post(
    '/',
    requireAuth,
    requireProfessor,
    (req, res) => controller.createGroup(req, res)
);

// detalii grupa
router.get(
    '/:id',
    requireAuth,
    (req, res) => controller.getGroup(req, res)
);

// toate grupele pentru un course offering
router.get(
    '/by-offering/:offeringId',
    requireAuth,
    (req, res) => controller.getGroupsForOffering(req, res)
);

// adauga membru în grupă – doar profesori 
router.post(
    '/:groupId/members',
    requireAuth,
    requireProfessor,
    (req, res) => controller.addMember(req, res)
);

// sterge membru din grupă
router.delete(
    '/:groupId/members/:userId',
    requireAuth,
    requireProfessor,
    (req, res) => controller.removeMember(req, res)
);

// leaga grupa de course offering
router.post(
    '/:groupId/course-offerings/:offeringId',
    requireAuth,
    requireProfessor,
    (req, res) => controller.linkToOffering(req, res)
);

// sterge legatura grupa–course offering
router.delete(
    '/:groupId/course-offerings/:offeringId',
    requireAuth,
    requireProfessor,
    (req, res) => controller.unlinkFromOffering(req, res)
);

module.exports = router;
