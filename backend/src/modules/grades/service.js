// src/modules/grades/service.js
const Grade = require('../../models/Grade');
const ProjectFinalGrade = require('../../models/ProjectFinalGrade');
const JuryAssignment = require('../../models/JuryAssignment');
const Deliverable = require('../../models/Deliverable');
const Project = require('../../models/Project');

class GradesService {
    // student juror da nota la un deliverable
    async submitGrade(deliverableId, jurorId, score, comment) {
        const deliverable = await Deliverable.findByPk(deliverableId);
        if (!deliverable) {
            throw new Error('Deliverable not found');
        }

        const assignment = await JuryAssignment.findOne({
            where: { deliverableId, jurorId }
        });
        if (!assignment) {
            throw new Error('User is not juror for this deliverable');
        }

        const existing = await Grade.findOne({
            where: { deliverableId, jurorId }
        });
        if (existing) {
            throw new Error('Grade already exists');
        }

        const numericScore = parseFloat(score);
        if (!Number.isFinite(numericScore) || numericScore < 1 || numericScore > 10) {
            throw new Error('Invalid score');
        }

        const grade = await Grade.create({
            deliverableId,
            jurorId,
            score: numericScore,
            comment: comment || null
        });

        return grade;
    }

    // notele pentru un deliverable pentru profesor fara jurorId
    async getGradesForDeliverableForProfessor(deliverableId) {
        const deliverable = await Deliverable.findByPk(deliverableId);
        if (!deliverable) {
            throw new Error('Deliverable not found');
        }

        const grades = await Grade.findAll({
            where: { deliverableId },
            order: [['createdAt', 'ASC']]
        });

        const result = grades.map(g => ({
            score: parseFloat(g.score),
            comment: g.comment,
            createdAt: g.createdAt
        }));

        return result;
    }

    // notele date de un user
    async getGradesForUser(jurorId) {
        const grades = await Grade.findAll({
            where: { jurorId },
            include: [
                {
                    model: Deliverable,
                    as: 'deliverable',
                    include: [
                        {
                            model: Project,
                            as: 'project'
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        return grades;
    }

    // recalculez nota finala pentru un deliverable
    async recalculateFinalForDeliverable(deliverableId) {
        const deliverable = await Deliverable.findByPk(deliverableId);
        if (!deliverable) {
            throw new Error('Deliverable not found');
        }

        const project = await Project.findByPk(deliverable.projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        const grades = await Grade.findAll({
            where: { deliverableId }
        });

        if (grades.length === 0) {
            throw new Error('No grades for deliverable');
        }

        const scores = grades
            .map(g => parseFloat(g.score))
            .filter(s => Number.isFinite(s))
            .sort((a, b) => a - b);

        let usedScores = scores;
        if (scores.length >= 3) {
            usedScores = scores.slice(1, scores.length - 1);
        }

        const sum = usedScores.reduce((acc, s) => acc + s, 0);
        const avg = sum / usedScores.length;
        const rounded = Math.round(avg * 100) / 100;

        let finalGrade = await ProjectFinalGrade.findOne({
            where: {
                projectId: project.id,
                deliverableId: deliverableId
            }
        });

        if (finalGrade) {
            finalGrade.finalScore = rounded;
            finalGrade.calculatedAt = new Date();
            await finalGrade.save();
        } else {
            finalGrade = await ProjectFinalGrade.create({
                projectId: project.id,
                deliverableId: deliverableId,
                finalScore: rounded
            });
        }

        return finalGrade;
    }

    // notele finale pentru un proiect
    async getFinalGradesForProject(projectId) {
        const project = await Project.findByPk(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        const finals = await ProjectFinalGrade.findAll({
            where: { projectId },
            order: [['calculatedAt', 'DESC']]
        });

        return finals;
    }
}

module.exports = { GradesService };
