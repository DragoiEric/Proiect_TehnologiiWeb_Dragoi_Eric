const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class AuthService {

    // inregistrare student
    async registerStudent(name, email, password) {
        return this._registerUserWithRole(name, email, password, 'student');
    }

    // inregistrare profesor
    async registerProfessor(name, email, password) {
        return this._registerUserWithRole(name, email, password, 'professor');
    }

    async _registerUserWithRole(name, email, password, role) {
        // verificare user existent dupa email
        const existing = await User.findOne({ where: { email } });
        if (existing) {
            throw new Error('Email-ul este deja folosit');
        }

        // generare hash pentru parola
        const passwordHash = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            passwordHash,
            role,
        });

        // eliminare hash parola 
        const plainUser = user.get ? user.get({ plain: true }) : { ...user };
        delete plainUser.passwordHash;

        return plainUser;
    }

    async login(email, password) {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            throw new Error('Invalid email or password');
        }

        // verificare parola introdusa
        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) {
            throw new Error('Invalid email or password');
        }

        // generare token jwt cu id si rol
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const plainUser = user.get ? user.get({ plain: true }) : { ...user };
        delete plainUser.passwordHash;

        return { token, user: plainUser };
    }

    async getProfessors() {
    return User.findAll({
        where: { role: "professor" }, // must match exactly what you store in DB
        attributes: ["id", "name", "email", "role"], // exclude passwordHash by not selecting it
        order: [["name", "ASC"]],
    });
    }



}

module.exports = { AuthService };
