const Project = require('../../models/Project');
const ProjectMember = require('../../models/ProjectMember');
const User = require('../../models/User');
const Group = require('../../models/Group');
const CourseOffering = require('../../models/CourseOffering');
const Deliverable = require('../../models/Deliverable');
const ProjectFinalGrade = require('../../models/ProjectFinalGrade');

class ProjectsService {
    // creare proiect nou
    async createProject(title, description, courseOfferingId, groupId, creatorUser) {
        let courseOffering = null;
        if (courseOfferingId) {
            courseOffering = await CourseOffering.findByPk(courseOfferingId);
            if (!courseOffering) {
                throw new Error('Course offering not found');
            }
        }

        let group = null;
        if (groupId) {
            group = await Group.findByPk(groupId);
            if (!group) {
                throw new Error('Group not found');
            }
        }

        const project = await Project.create({
            title,
            description: description || null,
            createdById: creatorUser.id,
            courseOfferingId: courseOffering ? courseOffering.id : null,
            groupId: group ? group.id : null,
        });

        // creatorul devine leader pe proiect
        await ProjectMember.create({
            projectId: project.id,
            userId: creatorUser.id,
            isLeader: true,
        });

        return project;
    }

    // proiect cu detalii
    async getProjectById(id) {
        const project = await Project.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'members',
                    through: { attributes: ['isLeader'] },
                },
                {
                    model: Group,
                    as: 'group',
                },
                {
                    model: CourseOffering,
                    as: 'courseOffering',
                },
                {
                    model: Deliverable,
                    as: 'deliverables',
                },
                {
                    model: ProjectFinalGrade,
                    as: 'finalGrades',
                },
            ],
        });

        if (!project) {
            throw new Error('Project not found');
        }

        return project;
    }

    // toate proiectele pentru un offering de curs
    async getProjectsByOffering(offeringId) {
        const offering = await CourseOffering.findByPk(offeringId);
        if (!offering) {
            throw new Error('Course offering not found');
        }

        const projects = await Project.findAll({
            where: { courseOfferingId: offeringId },
            order: [['createdAt', 'ASC']],
        });

        return projects;
    }

    // toate proiectele pentru o grupa
    async getProjectsByGroup(groupId) {
        const group = await Group.findByPk(groupId);
        if (!group) {
            throw new Error('Group not found');
        }

        const projects = await Project.findAll({
            where: { groupId },
            order: [['createdAt', 'ASC']],
        });

        return projects;
    }

    // proiectele in care este un user
    async getProjectsForUser(userId) {
        const projects = await Project.findAll({
            include: [
                {
                    model: User,
                    as: 'members',
                    where: { id: userId },
                    through: { attributes: ['isLeader'] },
                },
            ],
            order: [['createdAt', 'ASC']],
        });

        return projects;
    }

    // verific daca userul poate gestiona membrii
    async _checkCanManageMembers(project, actingUser) {
        if (actingUser.role === 'professor') {
            return;
        }

        const membership = await ProjectMember.findOne({
            where: {
                projectId: project.id,
                userId: actingUser.id,
            },
        });

        if (!membership || !membership.isLeader) {
            throw new Error('Not allowed to manage project members');
        }
    }

    // adaug membru in proiect
    async addMember(projectId, userId, actingUser) {
        const project = await Project.findByPk(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        await this._checkCanManageMembers(project, actingUser);

        const user = await User.findByPk(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const existing = await ProjectMember.findOne({
            where: { projectId, userId },
        });

        if (existing) {
            return existing;
        }

        const membership = await ProjectMember.create({
            projectId,
            userId,
            isLeader: false,
        });

        return membership;
    }

    // schimb daca un membru este leader
    async updateMemberRole(projectId, userId, isLeader, actingUser) {
        const project = await Project.findByPk(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        await this._checkCanManageMembers(project, actingUser);

        const membership = await ProjectMember.findOne({
            where: { projectId, userId },
        });

        if (!membership) {
            throw new Error('Membership not found');
        }

        membership.isLeader = !!isLeader;
        await membership.save();

        return membership;
    }

    // sterg membru din proiect
    async removeMember(projectId, userId, actingUser) {
        const project = await Project.findByPk(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        await this._checkCanManageMembers(project, actingUser);

        const membership = await ProjectMember.findOne({
            where: { projectId, userId },
        });

        if (!membership) {
            throw new Error('Membership not found');
        }

        const isLeader = membership.isLeader;

        if (isLeader) {
            const otherLeaders = await ProjectMember.count({
                where: {
                    projectId,
                    userId,
                    isLeader: true,
                },
            });

            if (otherLeaders === 0) {
                throw new Error('Cannot remove the only leader of the project');
            }
        }

        await membership.destroy();
    }
}

module.exports = { ProjectsService };
