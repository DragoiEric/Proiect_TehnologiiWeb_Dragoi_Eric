const express = require('express');
require('dotenv').config();

const { sequelize } = require('./models');
const authRouter = require('./modules/auth/routes');
const coursesRouter = require('./modules/courses/routes');
const groupsRouter = require('./modules/groups/routes');
const projectsRouter = require('./modules/projects/routes');
const deliverablesRouter = require('./modules/deliverables/routes');
const juryRouter = require('./modules/jury/routes');
const gradesRouter = require('./modules/grades/routes');
const reportsRouter = require('./modules/reports/routes');

const app = express();
app.use(express.json());

app.use('/auth', authRouter);
app.use('/courses', coursesRouter);
app.use('/groups', groupsRouter);
app.use('/projects', projectsRouter);
app.use('/deliverables', deliverablesRouter);
app.use('/jury', juryRouter);
app.use('/grades', gradesRouter);
app.use('/reports', reportsRouter);

const PORT = process.env.PORT || 3000;

(async () => {
    try {
        await sequelize.authenticate();
        console.log('DB connected');

        // sincronizare modele cu baza de date
        await sequelize.sync({ force: true });

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error('DB error:', err);
    }
})();
