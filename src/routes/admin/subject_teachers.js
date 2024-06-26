import { Hono } from 'hono';

// Models
import Subject from '../../models/subject.js';
import SubjectTeacher from '../../models/subject_teacher.js';

import checkAdminToken from '../../middlewares/checkAdminToken.js';
import { generateRecordExistsReponse, generateRecordNotExistsReponse, generateResponse } from '../../helpers/response.js';
import statusCodes from '../../constants/statusCodes.js';

const app = new Hono().basePath('/subject-teachers');

app.use('*', checkAdminToken);

// GET ENDPOINTS
app.get('/', async (c) => {
    const {
        page = 1,
        limit = 10,
        teacher_id,
        subject_id,
        sort_by = 'subject',
    } = c.req.query();
    const skip = limit * (page - 1);
    const query = {
        ...(teacher_id && { teacher_id }),
        ...(subject_id && { subject_id }),
    };

    const total = await SubjectTeacher.countDocuments(query);
    const subjectTeachers = await SubjectTeacher.find(query)
        .limit(limit)
        .skip(skip)
        .populate('subject_id')
        .populate('teacher_id')
        .sort({
            ...(sort_by === 'subject' && { 'subject_id.name': 1 }),
            ...(sort_by === 'teacher' && { 'teacher_id.last_name': 1 }),
        })
        .lean();

    // Parse data
    // eslint-disable-next-line arrow-parens
    subjectTeachers.forEach(subjectTeacher => {
        subjectTeacher.subject = subjectTeacher.subject_id;
        delete subjectTeacher.subject_id;

        subjectTeacher.teacher = subjectTeacher.teacher_id;
        delete subjectTeacher.teacher_id;
        delete subjectTeacher.teacher.password;
    });

    return c.json(generateResponse(statusCodes.OK, 'Success', {
        total,
        page,
        limit,
        count: subjectTeachers.length,
        subject_teachers: subjectTeachers,
    }));
});
app.get('/:subjectTeacherId', async (c) => {
    const id = c.req.param('subjectTeacherId');

    const subjectTeacher = await SubjectTeacher.findById(id)
        .populate('subject_id')
        .populate('teacher_id')
        .lean();
    if (!subjectTeacher) {
        c.status(statusCodes.NOT_FOUND);
        return c.json(generateRecordNotExistsReponse('Subject teacher'));
    }

    // Parse data
    subjectTeacher.subject = subjectTeacher.subject_id;
    delete subjectTeacher.subject_id;

    subjectTeacher.teacher = subjectTeacher.teacher_id;
    delete subjectTeacher.teacher_id;
    delete subjectTeacher.teacher.password;

    return c.json(generateResponse(statusCodes.OK, 'Success', { subject_teacher: subjectTeacher }));
});

// POST ENDPOINTS
app.post('/', async (c) => {
    const admin = c.get('admin');
    const { subject_teacher: subjectTeacherBody } = await c.req.json();
    const {
        subject_id,
        teacher_id,
        start_at,
        end_at,
        current_timestamp,
    } = subjectTeacherBody;

    // Find subject
    const subject = await Subject.findById(subject_id).lean();
    if (!subject) {
        c.status(statusCodes.NOT_FOUND);
        return c.json(generateRecordNotExistsReponse('Subject'));
    }

    // Check if record already exist
    const subjectTeacherExist = await SubjectTeacher.exists({
        subject_id,
        teacher_id,
        $or: [
            { end_at: { $gt: current_timestamp } },
            { end_at: { $exists: false } },
        ],
    });
    if (subjectTeacherExist) {
        c.status(statusCodes.CONFLICT);
        return c.json(generateRecordExistsReponse('Subject teacher'));
    }

    const newSubjectTeacher = new SubjectTeacher();
    newSubjectTeacher.subject_id = subject_id;
    newSubjectTeacher.teacher_id = teacher_id;
    newSubjectTeacher.start_at = start_at;
    newSubjectTeacher.subject_name_snapshot = subject.name;
    newSubjectTeacher.subject_type_snapshot = subject.type;
    newSubjectTeacher.end_at = end_at;
    newSubjectTeacher.created_by = admin._id;

    await newSubjectTeacher.save();

    c.status(statusCodes.CREATED);
    return c.json(generateResponse(statusCodes.OK, 'Success', { subject_teacher: newSubjectTeacher }));
});

// PATCH ENDPOINTS
app.patch('/:subjectTeacherId', async (c) => {
    const id = c.req.param('subjectTeacherId');
    const admin = c.get('admin');
    const { subject_teacher: subjectTeacherBody } = await c.req.json();
    const {
        subject_id,
        teacher_id,
        start_at,
        end_at,
        current_timestamp,
    } = subjectTeacherBody;

    const subjectTeacher = await SubjectTeacher.findById(id);
    if (!subjectTeacher) {
        c.status(statusCodes.NOT_FOUND);
        return c.json(generateRecordNotExistsReponse('Subject teacher'));
    }

    // Check if record already exist
    const subjectTeacherExist = await SubjectTeacher.exists({
        _id: { $ne: id },
        subject_id,
        teacher_id,
        $or: [
            { end_at: { $gt: current_timestamp } },
            { end_at: { $exists: false } },
        ],
    });
    if (subjectTeacherExist) {
        c.status(statusCodes.CONFLICT);
        return c.json(generateRecordExistsReponse('Subject teacher'));
    }

    subjectTeacher.subject_id = subject_id;
    subjectTeacher.teacher_id = teacher_id;
    subjectTeacher.start_at = start_at;
    subjectTeacher.end_at = end_at;
    subjectTeacher.updated_by = admin._id;

    await subjectTeacher.save();

    return c.json(generateResponse(statusCodes.OK, 'Success', { subjectTeacher }));
});

export default app;
