const Group = require('../../models/Group');
const GroupMember = require('../../models/GroupMember');
const GroupCourseOffering = require('../../models/GroupCourseOffering');
const CourseOffering = require('../../models/CourseOffering');
const User = require('../../models/User');

class GroupsService {
    // creare grupa noua
    async createGroup(name, description) {
        const group = await Group.create({
            name,
            description: description || null,
        });

        return group;
    }

    // detalii grupa cu membri si offerings
    async getGroupById(id) {
        const group = await Group.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'members',
                    through: { attributes: [] }, // nu includ GroupMember
                },
                {
                    model: CourseOffering,
                    as: 'courseOfferings',
                    through: { attributes: [] }, // nu includ GroupCourseOffering
                },
            ],
        });

        if (!group) {
            throw new Error('Group not found');
        }

        return group;
    }

    // grupe pentru un offering
    async getGroupsForOffering(offeringId) {
        const offering = await CourseOffering.findByPk(offeringId);
        if (!offering) {
            throw new Error('Course offering not found');
        }

        const groups = await Group.findAll({
            include: [
                {
                    model: CourseOffering,
                    as: 'courseOfferings',
                    where: { id: offeringId },
                    through: { attributes: [] },
                },
            ],
        });

        return groups;
    }

    // adaugare membru in grupa
    async addMemberToGroup(groupId, userId) {
        const group = await Group.findByPk(groupId);
        if (!group) {
            throw new Error('Group not found');
        }

        const user = await User.findByPk(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // doar studenti pot fi membri
        if (user.role !== 'student') {
            throw new Error('Only students can be group members');
        }

        const existing = await GroupMember.findOne({
            where: { groupId, userId },
        });

        if (existing) {
            return existing; // deja membru
        }

        const membership = await GroupMember.create({
            groupId,
            userId,
        });

        return membership;
    }

    // stergere membru din grupa
    async removeMemberFromGroup(groupId, userId) {
        const deleted = await GroupMember.destroy({
            where: { groupId, userId },
        });

        if (!deleted) {
            throw new Error('Membership not found');
        }
    }

    // legare grupa la offering
    async linkGroupToOffering(groupId, offeringId) {
        const group = await Group.findByPk(groupId);
        if (!group) {
            throw new Error('Group not found');
        }

        const offering = await CourseOffering.findByPk(offeringId);
        if (!offering) {
            throw new Error('Course offering not found');
        }

        const existing = await GroupCourseOffering.findOne({
            where: { groupId, courseOfferingId: offeringId },
        });

        if (existing) {
            return existing;
        }

        const link = await GroupCourseOffering.create({
            groupId,
            courseOfferingId: offeringId,
        });

        return link;
    }

    // stergere legatura grupa offering
    async unlinkGroupFromOffering(groupId, offeringId) {
        const deleted = await GroupCourseOffering.destroy({
            where: { groupId, courseOfferingId: offeringId },
        });

        if (!deleted) {
            throw new Error('Link not found');
        }
    }
}

module.exports = { GroupsService };
