const express = require('express');
const { AuthController } = require('./controller'); 
const { requireAuth, requireProfessor } = require('../../middleware/auth');


const router = express.Router();
const authController = new AuthController();

// inregistrare student
router.post('/register-student', (req, res) => authController.registerStudent(req, res));
// inregistrare profesor
router.post('/register-professor', (req, res) => authController.registerProfessor(req, res));
// login
router.post('/login', (req, res) => authController.login(req, res));
// profil utilizator
router.get('/me', requireAuth, (req, res) => authController.getMe(req, res));
router.get("/professors", requireAuth, requireProfessor, (req, res) =>
  authController.getProfessors(req, res)
);

module.exports = router;
