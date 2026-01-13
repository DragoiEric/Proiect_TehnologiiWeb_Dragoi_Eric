const { AuthService } = require('./service');   

const authService = new AuthService();
const User = require('../../models/User');

class AuthController {

    async registerStudent(req, res) {
        const { name, email, password } = req.body;
        try {

            if (!name || !email || !password) {
                return res.status(400).json({ error: 'Toate câmpurile sunt obligatorii' });
            }

            const user = await authService.registerStudent(name, email, password);
            res.status(201).json(user);

        } catch (err) {
            console.error(err);
            if (err.message === 'Email-ul este deja folosit') {
                return res.status(409).json({ error: err.message });
            }
            res.status(500).json({ error: 'Eroare la înregistrare' });
        }
    }

    async registerProfessor(req, res) {
        const { name, email, password, registrationCode } = req.body;
        try {
            if (!name || !email || !password || !registrationCode) {
                return res.status(400).json({ error: 'Toate câmpurile sunt obligatorii' });
            }

            if (registrationCode !== process.env.PROFESSOR_REGISTRATION_CODE) {
                return res.status(403).json({ error: 'Cod de înregistrare invalid pentru profesori' });
            }

            const user = await authService.registerProfessor(name, email, password);
            res.status(201).json(user);

        } catch (err) {
            console.error(err);
            if (err.message === 'Email-ul este deja folosit') {
                return res.status(409).json({ error: err.message });
            }
            res.status(500).json({ error: 'Eroare la înregistrare' });
        }
    }

    async login(req, res) {
        const { email, password } = req.body;
        try {
            if (!email || !password) {
                return res.status(400).json({ error: 'Toate câmpurile sunt obligatorii' });
            }

            const result = await authService.login(email, password);
            res.status(200).json(result);

        } catch (err) {
            console.error(err);
            if (err.message === 'Invalid email or password') {
                return res.status(401).json({ error: err.message });
            }
            res.status(500).json({ error: 'Eroare la autentificare' });
        }
    }

    async getMe(req, res) {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({ error: 'Utilizator neautentificat' });
            }

            const user = await User.findByPk(req.user.id, {
                attributes: { exclude: ['passwordHash'] }
            });

            if (!user) {
                return res.status(404).json({ error: 'Utilizatorul nu a fost găsit' });
            }

            res.status(200).json(user);

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Eroare la preluarea profilului' });
        }
    }

    async getProfessors(req, res) {
        try {
            const professors = await authService.getProfessors();
            return res.json(professors);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to fetch professors" });
        }
    }

}

module.exports = { AuthController };
