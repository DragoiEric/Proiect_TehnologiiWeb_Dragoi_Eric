const sequelize = require('../core/db');

const User = require('./User');
const Course = require('./Course');
const CourseOffering = require('./CourseOffering');
const CourseStaff = require('./CourseStaff');
const Group = require('./Group');
const GroupMember = require('./GroupMember');
const GroupCourseOffering = require('./GroupCourseOffering');
const Project = require('./Project');
const ProjectMember = require('./ProjectMember');
const Deliverable = require('./Deliverable');
const DeliverableFile = require('./DeliverableFile');
const JuryAssignment = require('./JuryAssignment');
const Grade = require('./Grade');
const ProjectFinalGrade = require('./ProjectFinalGrade');

// relatii curs si offering
Course.hasMany(CourseOffering, {
    as: 'offerings',
    foreignKey: 'courseId',
});
CourseOffering.belongsTo(Course, {
    as: 'course',
    foreignKey: 'courseId',
});

// relatii offering si profesor principal
User.hasMany(CourseOffering, {
    as: 'courseOfferingsMain',
    foreignKey: 'mainProfessorId',
});
CourseOffering.belongsTo(User, {
    as: 'mainProfessor',
    foreignKey: 'mainProfessorId',
});

// relatii offering si CourseStaff
CourseOffering.hasMany(CourseStaff, {
    as: 'staffEntries',
    foreignKey: 'courseOfferingId',
});
CourseStaff.belongsTo(CourseOffering, {
    as: 'courseOffering',
    foreignKey: 'courseOfferingId',
});

// relatii user si CourseStaff
User.hasMany(CourseStaff, {
    as: 'staffCourseOfferings',
    foreignKey: 'userId',
});
CourseStaff.belongsTo(User, {
    as: 'user',
    foreignKey: 'userId',
});

// many-to-many offering si user prin CourseStaff
CourseOffering.belongsToMany(User, {
    through: CourseStaff,
    as: 'staff',
    foreignKey: 'courseOfferingId',
    otherKey: 'userId',
});
User.belongsToMany(CourseOffering, {
    through: CourseStaff,
    as: 'staffedCourseOfferings',
    foreignKey: 'userId',
    otherKey: 'courseOfferingId',
});

// relatii grupa si GroupMember si user
Group.hasMany(GroupMember, {
    as: 'memberEntries',
    foreignKey: 'groupId',
});
GroupMember.belongsTo(Group, {
    as: 'group',
    foreignKey: 'groupId',
});

User.hasMany(GroupMember, {
    as: 'groupMemberships',
    foreignKey: 'userId',
});
GroupMember.belongsTo(User, {
    as: 'user',
    foreignKey: 'userId',
});

Group.belongsToMany(User, {
    through: GroupMember,
    as: 'members',
    foreignKey: 'groupId',
    otherKey: 'userId',
});
User.belongsToMany(Group, {
    through: GroupMember,
    as: 'groups',
    foreignKey: 'userId',
    otherKey: 'groupId',
});

// relatii grupa si GroupCourseOffering si offering
Group.hasMany(GroupCourseOffering, {
    as: 'courseOfferingLinks',
    foreignKey: 'groupId',
});
GroupCourseOffering.belongsTo(Group, {
    as: 'group',
    foreignKey: 'groupId',
});

CourseOffering.hasMany(GroupCourseOffering, {
    as: 'groupLinks',
    foreignKey: 'courseOfferingId',
});
GroupCourseOffering.belongsTo(CourseOffering, {
    as: 'courseOffering',
    foreignKey: 'courseOfferingId',
});

// many-to-many grupa si offering
Group.belongsToMany(CourseOffering, {
    through: GroupCourseOffering,
    as: 'courseOfferings',
    foreignKey: 'groupId',
    otherKey: 'courseOfferingId',
});
CourseOffering.belongsToMany(Group, {
    through: GroupCourseOffering,
    as: 'groups',
    foreignKey: 'courseOfferingId',
    otherKey: 'groupId',
});

// user care a creat proiectul
User.hasMany(Project, {
    as: 'createdProjects',
    foreignKey: 'createdById',
});
Project.belongsTo(User, {
    as: 'createdBy',
    foreignKey: 'createdById',
});

// proiecte pe offering
CourseOffering.hasMany(Project, {
    as: 'projects',
    foreignKey: 'courseOfferingId',
});
Project.belongsTo(CourseOffering, {
    as: 'courseOffering',
    foreignKey: 'courseOfferingId',
});

// relatii grupa si proiect
Group.hasMany(Project, {
    as: 'projects',
    foreignKey: 'groupId',
});
Project.belongsTo(Group, {
    as: 'group',
    foreignKey: 'groupId',
});

// proiect, ProjectMember si user
Project.hasMany(ProjectMember, {
    as: 'memberEntries',
    foreignKey: 'projectId',
});
ProjectMember.belongsTo(Project, {
    as: 'project',
    foreignKey: 'projectId',
});

User.hasMany(ProjectMember, {
    as: 'projectMemberships',
    foreignKey: 'userId',
});
ProjectMember.belongsTo(User, {
    as: 'user',
    foreignKey: 'userId',
});

Project.belongsToMany(User, {
    through: ProjectMember,
    as: 'members',
    foreignKey: 'projectId',
    otherKey: 'userId',
});
User.belongsToMany(Project, {
    through: ProjectMember,
    as: 'projects',
    foreignKey: 'userId',
    otherKey: 'projectId',
});

// proiect si deliverable
Project.hasMany(Deliverable, {
    as: 'deliverables',
    foreignKey: 'projectId',
});
Deliverable.belongsTo(Project, {
    as: 'project',
    foreignKey: 'projectId',
});

// deliverable si DeliverableFile
Deliverable.hasMany(DeliverableFile, {
    as: 'files',
    foreignKey: 'deliverableId',
});
DeliverableFile.belongsTo(Deliverable, {
    as: 'deliverable',
    foreignKey: 'deliverableId',
});

// deliverable, JuryAssignment si user
Deliverable.hasMany(JuryAssignment, {
    as: 'juryAssignments',
    foreignKey: 'deliverableId',
});
JuryAssignment.belongsTo(Deliverable, {
    as: 'deliverable',
    foreignKey: 'deliverableId',
});

User.hasMany(JuryAssignment, {
    as: 'juryAssignments',
    foreignKey: 'jurorId',
});
JuryAssignment.belongsTo(User, {
    as: 'juror',
    foreignKey: 'jurorId',
});

// deliverable, Grade si user
Deliverable.hasMany(Grade, {
    as: 'grades',
    foreignKey: 'deliverableId',
});
Grade.belongsTo(Deliverable, {
    as: 'deliverable',
    foreignKey: 'deliverableId',
});

User.hasMany(Grade, {
    as: 'grades',
    foreignKey: 'jurorId',
});
Grade.belongsTo(User, {
    as: 'juror',
    foreignKey: 'jurorId',
});

// proiect si ProjectFinalGrade
Project.hasMany(ProjectFinalGrade, {
    as: 'finalGrades',
    foreignKey: 'projectId',
});
ProjectFinalGrade.belongsTo(Project, {
    as: 'project',
    foreignKey: 'projectId',
});

// deliverable si ProjectFinalGrade
Deliverable.hasMany(ProjectFinalGrade, {
    as: 'finalGrades',
    foreignKey: 'deliverableId',
});
ProjectFinalGrade.belongsTo(Deliverable, {
    as: 'deliverable',
    foreignKey: 'deliverableId',
});

module.exports = {
    sequelize,
    User,
    Course,
    CourseOffering,
    CourseStaff,
    Group,
    GroupMember,
    GroupCourseOffering,
    Project,
    ProjectMember,
    Deliverable,
    DeliverableFile,
    JuryAssignment,
    Grade,
    ProjectFinalGrade,
};
