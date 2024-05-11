import { Hono } from 'hono';
import dayjs from 'dayjs';
import { zValidator } from '@hono/zod-validator';

// Models
import Subject from '../../models/subject.js';
import Section from '../../models/section.js';
import SectionSubject from '../../models/section_subject.js';
import SectionAdviser from '../../models/section_adviser.js';
import SubjectStudent from '../../models/subject_student.js';

import statusCodes from '../../constants/statusCodes.js';
import { generateRecordNotExistsReponse, generateResponse } from '../../helpers/response.js';
import checkTeacherToken from '../../middlewares/checkTeacherToken.js';
import {
    getSubjectListSchema,
    getSubjectByIdSchema,
    getSubjectOptionsSchema,
    createSectionSubjects,
    deleteSectionSubjectByIdSchema,
} from '../../schema/teacher/subjects.js';
import validate from '../../helpers/validator.js';
import checkActiveSemester from '../../middlewares/checkActiveSemester.js';

const app = new Hono().basePath('/subjects');

app.use('*', checkTeacherToken);

app.get(
    '/',
    zValidator('query', getSubjectListSchema, validate),
    checkActiveSemester,
    async (c) => {
        const teacher = c.get('teacher');
        const { page, limit } = c.req.valid('query');
        const now = dayjs().startOf('day').toDate();

        const sectionAdviserQuery = {
            teacher_id: teacher._id,
            start_at: { $lte: now },
            $or: [
                { end_at: null },
                { end_at: { $exists: false } },
                { end_at: { $gt: now } },
            ],
        };
        // Get the current section of the teacher
        const sectionAdvisers = await SectionAdviser.find(sectionAdviserQuery).lean();

        const semester = c.get('semester');
        if (!semester) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateResponse(
                statusCodes.NOT_FOUND,
                'There is no active semester at the moment',
            ));
        }

        const query = {
            section_id: {
                $in: sectionAdvisers.map((sectionAdviser) => sectionAdviser.section_id),
            },
            semester_id: semester._id,
        };
        const total = await SectionSubject.countDocuments(query);
        const sectionSubjects = await SectionSubject.find(query).lean();

        const skip = limit * (page - 1);
        const subjects = await Subject.find({
            _id: { $in: sectionSubjects.map((sectionSubject) => sectionSubject.subject_id) },
        })
            .limit(limit)
            .skip(skip)
            .sort({ name: 1 })
            .lean();

        subjects.forEach((subject) => {
            // eslint-disable-next-line arrow-body-style
            const sectionSubject = sectionSubjects.find((sectionSubject) => {
                return sectionSubject.subject_id.toString() === subject._id.toString();
            });

            subject.section_subject_id = sectionSubject._id;
        });
        return c.json(generateResponse(statusCodes.OK, 'Success', {
            total,
            page,
            limit,
            count: subjects.length,
            subjects,
        }));
    },
);

app.get(
    '/options',
    zValidator('query', getSubjectOptionsSchema, validate),
    async (c) => {
        const {
            keyword,
            page,
            limit,
            type,
            exclude,
        } = c.req.valid('query');

        const skip = limit * (page - 1);
        const query = {
            ...(type && { type }),
            ...(keyword && { name: { $regex: keyword, $options: 'i' } }),
            ...(exclude && {
                _id: {
                    $nin: JSON.parse(exclude),
                },
            }),
        };
        const subjects = await Subject.find(query)
            .limit(limit)
            .skip(skip)
            .sort({ name: 1 })
            .lean();

        return c.json(generateResponse(statusCodes.OK, 'Success', { subjects }));
    },
);

app.get(
    '/:subjectId',
    zValidator('param', getSubjectByIdSchema, validate),
    async (c) => {
        const { subjectId } = c.req.valid('param');

        const subject = await Subject.findById(subjectId).lean();
        if (!subject) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Subject'));
        }

        return c.json(generateResponse(statusCodes.OK, 'Success', { subject }));
    },
);

// POST ENDPOINTS
app.post(
    '/',
    zValidator('json', createSectionSubjects, validate),
    checkActiveSemester,
    async (c) => {
        const teacher = c.get('teacher');
        const { section_subjects: sectionSubjectsBody } = c.req.valid('json');
        const {
            section_id,
            subject_ids,
        } = sectionSubjectsBody;

        // Check for duplicates
        const semester = c.get('semester');
        if (!semester) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateResponse(
                statusCodes.NOT_FOUND,
                'There is no active semester at the moment',
            ));
        }

        // Check if section exist
        const sectionExist = await Section.exists({ _id: section_id });
        if (!sectionExist) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Section'));
        }

        // Check if a subject to be saved is already in the section
        const sectionSubjectExist = await SectionSubject.exists({
            section_id,
            semester_id: semester._id,
            subject_id: { $in: subject_ids || [] },
        }).lean();
        if (sectionSubjectExist) {
            c.status(statusCodes.CONFLICT);
            return c.json(generateResponse(409, 'Subject already exist in this section'));
        }

        const sectionSubjects = subject_ids.map((subjectId) => ({
            section_id,
            semester_id: semester._id,
            subject_id: subjectId,
            created_by: teacher._id,
        }));

        await SectionSubject.insertMany(sectionSubjects);

        c.status(statusCodes.CREATED);
        return c.json(generateResponse(statusCodes.OK, 'Success'));
    },
);

// DELETE ENDPOINTS
app.delete(
    '/:sectionSubjectId',
    zValidator('param', deleteSectionSubjectByIdSchema, validate),
    checkActiveSemester,
    async (c) => {
        const { sectionSubjectId } = c.req.valid('param');

        // Check for duplicates
        const semester = c.get('semester');
        if (!semester) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateResponse(
                statusCodes.NOT_FOUND,
                'There is no active semester at the moment',
            ));
        }

        const sectionSubject = await SectionSubject.findById(sectionSubjectId);
        if (!sectionSubject) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Section Subject'));
        }

        const subjectStudentCount = await SubjectStudent.countDocuments({
            subject_id: sectionSubject.subject_id,
            semester_id: semester._id,
        });
        if (subjectStudentCount > 0) {
            c.status(statusCodes.FORBIDDEN);
            return c.json(generateResponse(statusCodes.FORBIDDEN, 'Subject cannot be deleted because there is a student currently enrolled in it'));
        }

        await sectionSubject.deleteOne();

        return c.json(generateResponse(statusCodes.OK, 'Success', { section_subject: sectionSubject }));
    },
);

export default app;
