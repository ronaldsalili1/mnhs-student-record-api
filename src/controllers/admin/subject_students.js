import statusCodes from '../../constants/enums/statusCodes.js';
import { generateRecordExistsReponse, generateRecordNotExistsReponse, generateResponse } from '../../helpers/response.js';
import SubjectStudent from '../../models/subject_student.js';
import Subject from '../../models/subject.js';
import Semester from '../../models/semester.js';
import Student from '../../models/student.js';

export const getSubjectStudents = async (c) => {
    const {
        page = 1,
        limit = 10,
        subject_id,
        semester_id,
        student_id,
    } = c.req.query();
    const skip = limit * (page - 1);

    // Check if there is an active semester
    const semester = await Semester.findOne({ status: 'active' }).lean();
    const query = {
        ...(semester && { semester_id: semester._id }),
        ...(subject_id && { subject_id }),
        ...(semester_id && { semester_id }),
        ...(student_id && { student_id }),
    };

    const total = await SubjectStudent.countDocuments(query);
    const subjectStudents = await SubjectStudent.find(query)
        .limit(limit)
        .skip(skip)
        .populate('student_id')
        .sort({ 'student_id.last_name': 1 })
        .lean();

    subjectStudents.forEach((subjectStudent) => {
        subjectStudent.student = subjectStudent.student_id;
        delete subjectStudent.student_id;
    });

    return c.json(generateResponse(statusCodes.OK, 'Success', {
        total,
        page,
        limit,
        count: subjectStudents.length,
        subject_students: subjectStudents,
    }));
};

export const getSubjectStudentById = async (c) => {
    const id = c.req.param('subjectStudentId');

    const subjectStudent = await SubjectStudent.findById(id).populate('student_id').lean();
    if (!subjectStudent) {
        c.status(statusCodes.NOT_FOUND);
        return c.json(generateRecordNotExistsReponse('Subject student'));
    }

    subjectStudent.student = subjectStudent.student_id;
    delete subjectStudent.student_id;

    return c.json(generateResponse(statusCodes.OK, 'Success', { subject_student: subjectStudent }));
};

export const createSubjectStudent = async (c) => {
    const admin = c.get('admin');
    const { subject_student: subjectStudentBody } = await c.req.json();
    const {
        subject_id,
        semester_id,
        student_id,
    } = subjectStudentBody;

    const subjectStudentExist = await SubjectStudent.exists({
        subject_id,
        semester_id,
        student_id,
    });
    if (subjectStudentExist) {
        c.status(statusCodes.CONFLICT);
        return c.json(generateRecordExistsReponse('Subject student'));
    }

    // Subject information
    const subject = await Subject.findById(subject_id).lean();
    if (!subject) {
        c.status(statusCodes.NOT_FOUND);
        return c.json(generateRecordNotExistsReponse('Subject'));
    }

    // Semester information
    const semester = await Semester.findById(semester_id).lean();
    if (!semester) {
        c.status(statusCodes.NOT_FOUND);
        return c.json(generateRecordNotExistsReponse('Semester'));
    }

    // Student information
    const student = await Student.findById(student_id).lean();
    if (!student) {
        c.status(statusCodes.NOT_FOUND);
        return c.json(generateRecordNotExistsReponse('Student'));
    }

    const newSubjectStudent = new SubjectStudent();
    newSubjectStudent.subject_id = subject_id;
    newSubjectStudent.semester_id = semester_id;
    newSubjectStudent.student_id = student_id;
    newSubjectStudent.subject_name_snapshot = subject.name;
    newSubjectStudent.subject_type_snapshot = subject.type;
    newSubjectStudent.sy_start_snapshot = semester.sy_start_year;
    newSubjectStudent.sy_end_snapshot = semester.sy_end_year;
    newSubjectStudent.semester_term_snapshot = semester.term;
    newSubjectStudent.created_by = admin._id;

    await newSubjectStudent.save();

    c.status(statusCodes.CREATED);
    return c.json(generateResponse(statusCodes.OK, 'Success', { subject_student: newSubjectStudent }));
};

export const updateSubjectStudentById = async (c) => {
    const admin = c.get('admin');
    const id = c.req.param('subjectStudentId');
    const { subject_student: subjectStudentBody } = await c.req.json();
    const {
        subject_id,
        semester_id,
        student_id,
    } = subjectStudentBody;

    const subjectStudent = await SubjectStudent.findById(id);
    if (!subjectStudent) {
        c.status(statusCodes.NOT_FOUND);
        return c.json(generateRecordNotExistsReponse('Subject student'));
    }

    const subjectStudentExist = await SubjectStudent.exists({
        _id: { $ne: id },
        subject_id,
        semester_id,
        student_id,
    });
    if (subjectStudentExist) {
        c.status(statusCodes.CONFLICT);
        return c.json(generateRecordExistsReponse('Subject student'));
    }

    // Subject information
    const subject = await Subject.findById(subject_id).lean();
    if (!subject) {
        c.status(statusCodes.NOT_FOUND);
        return c.json(generateRecordNotExistsReponse('Subject'));
    }

    // Semester information
    const semester = await Semester.findById(semester_id).lean();
    if (!semester) {
        c.status(statusCodes.NOT_FOUND);
        return c.json(generateRecordNotExistsReponse('Semester'));
    }

    // Student information
    const student = await Student.findById(student_id).lean();
    if (!student) {
        c.status(statusCodes.NOT_FOUND);
        return c.json(generateRecordNotExistsReponse('Student'));
    }

    subjectStudent.subject_id = subject_id;
    subjectStudent.semester_id = semester_id;
    subjectStudent.student_id = student_id;
    subjectStudent.subject_name_snapshot = subject.name;
    subjectStudent.subject_type_snapshot = subject.type;
    subjectStudent.sy_start_snapshot = semester.sy_start_year;
    subjectStudent.sy_end_snapshot = semester.sy_end_year;
    subjectStudent.semester_term_snapshot = semester.term;
    subjectStudent.updated_by = admin._id;

    await subjectStudent.save();

    return c.json(generateResponse(statusCodes.OK, 'Success', { subject_student: subjectStudent }));
};

export const deleteSubjectStudentById = async (c) => {
    const id = c.req.param('subjectStudentId');

    const subjectStudent = await SubjectStudent.findOneAndDelete(id);
    if (!subjectStudent) {
        c.status(statusCodes.NOT_FOUND);
        return c.json(generateRecordNotExistsReponse('Subject student'));
    }

    return c.json(generateResponse(statusCodes.OK, 'Success', { subject_student: subjectStudent }));
};
