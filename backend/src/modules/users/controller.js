// src/modules/users/users.controller.js
const { UsersService } = require('./service');

const usersService = new UsersService();

class UsersController {
  async createStudent(req, res) {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'name, email, password sunt obligatorii' });
      }

      // TODO: aici vei face hash la parolă
      const user = await usersService.createStudent(name, email, password);

      res.status(201).json(user);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Eroare la crearea studentului' });
    }
  }

  async listAll(req, res) {
    try {
      const users = await usersService.listAll();
      res.json(users);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Eroare la listarea utilizatorilor' });
    }
  }
}

module.exports = { UsersController };
