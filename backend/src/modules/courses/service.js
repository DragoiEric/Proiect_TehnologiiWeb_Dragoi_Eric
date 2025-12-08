const Course = require('../../models/Course');
const CourseOffering = require('../../models/CourseOffering');
const CourseStaff = require('../../models/CourseStaff');
const User = require('../../models/User');

class CoursesService {
    // creare course nou
    async createCourse(code, name, description) {
        const existing = await Course.findOne({ where: { code } });
        if (existing) {
            throw new Error('Course code already exists');
        }

        const course = await Course.create({
            code,
            name,
            description: description || null,
        });

        return course;
    }

    // lista courses
    async getAllCourses() {
        const courses = await Course.findAll({
            order: [['code', 'ASC']],
        });
        return courses;
    }

    // cautare course dupa id
    async getCourseById(id) {
        const course = await Course.findByPk(id);
        if (!course) {
            throw new Error('Course not found');
        }
        return course;
    }

    // course cu lista de offerings
    async getCourseWithOfferings(id) {
        const course = await Course.findByPk(id, {
            include: [
                {
                    model: CourseOffering,
                    as: 'offerings',
                },
            ],
        });

        if (!course) {
            throw new Error('Course not found');
        }

        return course;
    }

    // creare course offering
    async createCourseOffering(courseId, academicYear, semester, callerUserId, mainProfessorIdFromBody) {
        const course = await Course.findByPk(courseId);
        if (!course) {
            throw new Error('Course not found');
        }

        // daca nu se trimite mainProfessorId se foloseste user logat
        let mainProfessorId = mainProfessorIdFromBody || callerUserId;

        const prof = await User.findByPk(mainProfessorId);
        if (!prof || prof.role !== 'professor') {
            throw new Error('Main professor not found or not a professor');
        }

        const allowedSemesters = ['autumn', 'spring', 'summer'];
        if (!allowedSemesters.includes(semester)) {
            throw new Error('Invalid semester');
        }

        const offering = await CourseOffering.create({
            courseId: course.id,
            academicYear,
            semester,
            mainProfessorId: prof.id,
        });

        return offering;
    }

    // lista offerings pentru un course
    async getOfferingsForCourse(courseId) {
        const course = await Course.findByPk(courseId);
        if (!course) {
            throw new Error('Course not found');
        }

        const offerings = await CourseOffering.findAll({
            where: { courseId },
            order: [['academicYear', 'DESC'], ['semester', 'ASC']],
        });

        return offerings;
    }

    // detalii offering cu course si staff
    async getCourseOfferingDetails(offeringId) {
        const offering = await CourseOffering.findByPk(offeringId, {
            include: [
                { model: Course, as: 'course' },
                {
                    model: User,
                    as: 'staff',
                    through: { attributes: ['role'] }, // include rol din tabela CourseStaff
                },
            ],
        });

        if (!offering) {
            throw new Error('Course offering not found');
        }

        return offering;
    }

    // adaugare sau update staff pe offering
    async addStaffToOffering(offeringId, userId, role) {
        const offering = await CourseOffering.findByPk(offeringId);
        if (!offering) {
            throw new Error('Course offering not found');
        }

        const user = await User.findByPk(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const allowedRoles = ['lecturer', 'assistant', 'lab', 'other'];
        if (!allowedRoles.includes(role)) {
            throw new Error('Invalid staff role');
        }

        const existing = await CourseStaff.findOne({
            where: { courseOfferingId: offeringId, userId },
        });

        if (existing) {
            existing.role = role;
            await existing.save();
            return existing;
        }

        const entry = await CourseStaff.create({
            courseOfferingId: offeringId,
            userId,
            role,
        });

        return entry;
    }
}

module.exports = { CoursesService };
