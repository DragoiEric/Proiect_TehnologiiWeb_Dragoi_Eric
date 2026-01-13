const express = require('express');
const { CoursesController } = require('./controller');
const { requireAuth, requireProfessor } = require('../../middleware/auth');

const router = express.Router();
const controller = new CoursesController();

// creare course
router.post(
    '/',
    requireAuth,
    requireProfessor,
    (req, res) => controller.createCourse(req, res)
);

// lista courses
router.get(
    '/',
    requireAuth,
    (req, res) => controller.getAllCourses(req, res)
);

// detalii course cu offerings
router.get(
    '/:id',
    requireAuth,
    (req, res) => controller.getCourse(req, res)
);

// creare course offering
router.post(
    '/:courseId/offerings',
    requireAuth,
    requireProfessor,
    (req, res) => controller.createCourseOffering(req, res)
);

// lista offerings pentru course
router.get(
    '/:courseId/offerings',
    requireAuth,
    requireProfessor,
    (req, res) => controller.getOfferingsForCourse(req, res)
);

// detalii course offering
router.get(
    '/offerings/:offeringId',
    requireAuth,
    (req, res) => controller.getCourseOfferingDetails(req, res)
);

// adaugare staff pe offering
router.post(
    '/offerings/:offeringId/staff',
    requireAuth,
    requireProfessor,
    (req, res) => controller.addStaffToOffering(req, res)
);

router.get(
    '/offerings/teacher/:mainProfessorId',
    requireAuth,
    requireProfessor,
    (req, res) => controller.getCourseOfferingByTeacher(req, res)
);

router.delete(
  "/offerings/:offeringId",
  requireAuth,
  requireProfessor,
  (req, res) => controller.deleteOffering(req, res)
);


module.exports = router;
