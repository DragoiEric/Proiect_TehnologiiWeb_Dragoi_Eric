const { CoursesService } = require('./service');

const coursesService = new CoursesService();


class CoursesController {
    // creare curs
    async createCourse(req, res) {
        const { code, name, description } = req.body;

        if (!code || !name) {
            return res.status(400).json({ error: 'code și name sunt obligatorii' });
        }

        try {
            const course = await coursesService.createCourse(code, name, description);
            res.status(201).json(course);
        } catch (err) {
            console.error(err);
            if (err.message === 'Course code already exists') {
                return res.status(409).json({ error: err.message });
            }
            res.status(500).json({ error: 'Eroare la crearea cursului' });
        }
    }

    // preluare toate courses
    async getAllCourses(req, res) {
        try {
            const courses = await coursesService.getAllCourses();
            res.json(courses);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Eroare la preluarea cursurilor' });
        }
    }

    // detalii pentru un course
    async getCourse(req, res) {
        const { id } = req.params;
        try {
            const course = await coursesService.getCourseWithOfferings(id);
            res.json(course);
        } catch (err) {
            console.error(err);
            if (err.message === 'Course not found') {
                return res.status(404).json({ error: err.message });
            }
            res.status(500).json({ error: 'Eroare la preluarea cursului' });
        }
    }

    // creare course offering
    async createCourseOffering(req, res) {
        const { courseId } = req.params;
        const { academicYear, semester, mainProfessorId } = req.body;

        if (!academicYear || !semester) {
            return res.status(400).json({
                error: 'academicYear și semester sunt obligatorii',
            });
        }

        try {
            const offering = await coursesService.createCourseOffering(
                courseId,
                academicYear,
                semester,
                req.user.id,
                mainProfessorId
            );
            res.status(201).json(offering);
        } catch (err) {
            console.error(err);
            if (['Course not found', 'Main professor not found or not a professor', 'Invalid semester'].includes(err.message)) {
                return res.status(400).json({ error: err.message });
            }
            res.status(500).json({ error: 'Eroare la crearea course offering-ului' });
        }
    }

    // preluare course offerings pentru un course
    async getOfferingsForCourse(req, res) {
        const { courseId } = req.params;
        try {
            const offerings = await coursesService.getOfferingsForCourse(courseId);
            res.json(offerings);
        } catch (err) {
            console.error(err);
            if (err.message === 'Course not found') {
                return res.status(404).json({ error: err.message });
            }
            res.status(500).json({ error: 'Eroare la preluarea course offerings' });
        }
    }

    // detalii pentru un course offering
    async getCourseOfferingDetails(req, res) {
        const { offeringId } = req.params;
        try {
            const offering = await coursesService.getCourseOfferingDetails(offeringId);
            res.json(offering);
        } catch (err) {
            console.error(err);
            if (err.message === 'Course offering not found') {
                return res.status(404).json({ error: err.message });
            }
            res.status(500).json({ error: 'Eroare la preluarea course offering-ului' });
        }
    }

    // adaugare staff pe offering
    async addStaffToOffering(req, res) {
        const { offeringId } = req.params;
        const { userId, role } = req.body;

        if (!userId || !role) {
            return res.status(400).json({ error: 'userId și role sunt obligatorii' });
        }

        try {
            const entry = await coursesService.addStaffToOffering(offeringId, userId, role);
            res.status(201).json(entry);
        } catch (err) {
            console.error(err);
            if (
                ['Course offering not found', 'User not found', 'Invalid staff role'].includes(
                    err.message
                )
            ) {
                return res.status(400).json({ error: err.message });
            }
            res.status(500).json({ error: 'Eroare la adăugarea staff-ului' });
        }
    }

    async getCourseOfferingByTeacher(req, res){
        const { mainProfessorId } = req.params;


        try{
            const offerings = await coursesService.getCourseOfferingsByTeacher(mainProfessorId);
            res.json(offerings);
        }catch(err){
            console.error(err);
            return res.status(500).json({error: 'Eroare la gasirea cursurilor'});
        }
    }

    async deleteOffering(req, res) {
        try {
            const offeringId = Number(req.params.offeringId);
            if (!Number.isInteger(offeringId) || offeringId <= 0) {
            return res.status(400).json({ error: "Invalid offeringId" });
            }

            const result = await coursesService.deleteOfferingCascade({
            offeringId,
            requester: req.user, // { id, role }
            });

            return res.json(result);
        } catch (err) {
            console.error(err);
            if (err.message === "NOT_FOUND") {
            return res.status(404).json({ error: "Course offering not found" });
            }
            if (err.message === "FORBIDDEN") {
            return res.status(403).json({ error: "Forbidden" });
            }
            return res.status(500).json({ error: "Failed to delete offering" });
        }
    }
}

module.exports = { CoursesController };
