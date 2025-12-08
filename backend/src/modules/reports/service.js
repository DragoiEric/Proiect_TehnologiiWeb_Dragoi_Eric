// src/modules/reports/service.js
const { Op } = require('sequelize');
const CourseOffering = require('../../models/CourseOffering');
const Course = require('../../models/Course');
const Project = require('../../models/Project');
const Deliverable = require('../../models/Deliverable');
const ProjectFinalGrade = require('../../models/ProjectFinalGrade');
const Grade = require('../../models/Grade');
const JuryAssignment = require('../../models/JuryAssignment');
const Group = require('../../models/Group');

class ReportsService {
    // summary pentru un course offering
    async getCourseOfferingSummary(offeringId) {
        const offering = await CourseOffering.findByPk(offeringId, {
            include: [
                {
                    model: Course,
                    as: 'course'
                }
            ]
        });

        if (!offering) {
            throw new Error('Course offering not found');
        }

        const projects = await Project.findAll({
            where: { courseOfferingId: offeringId },
            include: [
                {
                    model: Deliverable,
                    as: 'deliverables'
                },
                {
                    model: ProjectFinalGrade,
                    as: 'finalGrades'
                }
            ],
            order: [['createdAt', 'ASC']]
        });

        const projectSummaries = projects.map(p => {
            const finals = p.finalGrades || [];
            const scores = finals
                .map(f => parseFloat(f.finalScore))
                .filter(s => Number.isFinite(s));

            const sum = scores.reduce((acc, s) => acc + s, 0);
            const avg = scores.length > 0 ? Math.round((sum / scores.length) * 100) / 100 : null;

            const deliverableCount = (p.deliverables || []).length;

            return {
                id: p.id,
                title: p.title,
                deliverableCount,
                finalGradesCount: finals.length,
                averageFinalScore: avg
            };
        });

        const allAvgScores = projectSummaries
            .map(p => p.averageFinalScore)
            .filter(s => s !== null && Number.isFinite(s));

        const globalSum = allAvgScores.reduce((acc, s) => acc + s, 0);
        const globalAvg =
            allAvgScores.length > 0
                ? Math.round((globalSum / allAvgScores.length) * 100) / 100
                : null;

        const summary = {
            offering: {
                id: offering.id,
                academicYear: offering.academicYear,
                semester: offering.semester,
                course: offering.course
                    ? {
                          id: offering.course.id,
                          code: offering.course.code,
                          name: offering.course.name
                      }
                    : null
            },
            stats: {
                projectCount: projectSummaries.length,
                projectsWithFinalGrades: projectSummaries.filter(
                    p => p.finalGradesCount > 0
                ).length,
                averageOfProjectAverages: globalAvg
            },
            projects: projectSummaries
        };

        return summary;
    }

    // summary pentru un proiect
    async getProjectSummary(projectId) {
        const project = await Project.findByPk(projectId, {
            include: [
                {
                    model: Group,
                    as: 'group'
                },
                {
                    model: CourseOffering,
                    as: 'courseOffering',
                    include: [
                        {
                            model: Course,
                            as: 'course'
                        }
                    ]
                },
                {
                    model: ProjectFinalGrade,
                    as: 'finalGrades'
                },
                {
                    model: Deliverable,
                    as: 'deliverables',
                    include: [
                        {
                            model: Grade,
                            as: 'grades'
                        },
                        {
                            model: JuryAssignment,
                            as: 'juryAssignments'
                        }
                    ]
                }
            ]
        });

        if (!project) {
            throw new Error('Project not found');
        }

        const finalGrades = project.finalGrades || [];
        const finalScores = finalGrades
            .map(f => parseFloat(f.finalScore))
            .filter(s => Number.isFinite(s));

        const finalBest =
            finalScores.length > 0
                ? Math.max.apply(null, finalScores)
                : null;

        const deliverableSummaries = (project.deliverables || []).map(d => {
            const grades = d.grades || [];
            const scores = grades
                .map(g => parseFloat(g.score))
                .filter(s => Number.isFinite(s))
                .sort((a, b) => a - b);

            const gradeCount = scores.length;
            const minScore = gradeCount > 0 ? scores[0] : null;
            const maxScore = gradeCount > 0 ? scores[gradeCount - 1] : null;

            let avgScore = null;
            if (gradeCount > 0) {
                const sum = scores.reduce((acc, s) => acc + s, 0);
                avgScore = Math.round((sum / gradeCount) * 100) / 100;
            }

            const jurorCount = (d.juryAssignments || []).length;

            return {
                id: d.id,
                title: d.title,
                dueDate: d.dueDate,
                gradeCount,
                minScore,
                maxScore,
                averageScore: avgScore,
                jurorCount
            };
        });

        const summary = {
            project: {
                id: project.id,
                title: project.title,
                description: project.description,
                createdAt: project.createdAt
            },
            courseOffering: project.courseOffering
                ? {
                      id: project.courseOffering.id,
                      academicYear: project.courseOffering.academicYear,
                      semester: project.courseOffering.semester,
                      course: project.courseOffering.course
                          ? {
                                id: project.courseOffering.course.id,
                                code: project.courseOffering.course.code,
                                name: project.courseOffering.course.name
                            }
                          : null
                  }
                : null,
            group: project.group
                ? {
                      id: project.group.id,
                      name: project.group.name
                  }
                : null,
            finalGrades: finalGrades.map(f => ({
                id: f.id,
                deliverableId: f.deliverableId,
                finalScore: parseFloat(f.finalScore),
                calculatedAt: f.calculatedAt
            })),
            bestFinalScore: finalBest,
            deliverables: deliverableSummaries
        };

        return summary;
    }
}

module.exports = { ReportsService };
