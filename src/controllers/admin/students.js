import statusCodes from '../../constants/enums/statusCodes.js';
import { generateRecordExistsReponse, generateRecordNotExistsReponse, generateResponse } from '../../helpers/response.js';
import Student from '../../models/student.js';

export const getStudents = async (c) => {
    const {
        page = 1,
        limit = 10,
        sex,
        keyword,
    } = c.req.query();
    const skip = limit * (page - 1);
    const query = {
        ...(sex && { sex }),
        ...(keyword && {
            $or: [
                { first_name: { $regex: keyword, $options: 'i' } },
                { last_name: { $regex: keyword, $options: 'i' } },
                { middle_name: { $regex: keyword, $options: 'i' } },
                { suffix: { $regex: keyword, $options: 'i' } },
                { lrn: { $regex: keyword, $options: 'i' } },
            ],
        }),
    };

    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
        .limit(limit)
        .skip(skip)
        .sort({ last_name: 1 })
        .lean();

    return c.json(generateResponse(statusCodes.OK, 'Success', {
        total,
        page,
        limit,
        count: students.length,
        students,
    }));
};

export const getStudentById = async (c) => {
    const id = c.req.param('studentId');

    // Find student
    const student = await Student.findById(id).lean();
    if (!student) {
        c.status(statusCodes.NOT_FOUND);
        return c.json(generateRecordNotExistsReponse('Student'));
    }

    return c.json(generateResponse(200, 'Success', { student }));
};

export const createStudent = async (c) => {
    const admin = c.get('admin');
    const { student: studentBody } = await c.req.json();
    const {
        email,
        guardian_email,
        last_name,
        first_name,
        middle_name,
        suffix,
        lrn,
        birthdate,
        sex,
        shs_admission_date,
        strand,
        track,
    } = studentBody;

    // Check if email already used by other student
    if (email) {
        const studentEmailExist = await Student.exists({ email });
        if (studentEmailExist) {
            c.status(statusCodes.CONFLICT);
            return c.json(generateRecordExistsReponse('Student with the same email'));
        }
    }

    // Check if LRN is already used
    const studentLrnExist = await Student.exists({ lrn });
    if (studentLrnExist) {
        c.status(statusCodes.CONFLICT);
        return c.json(generateRecordExistsReponse('Student with the same LRN'));
    }

    const newStudent = new Student();
    newStudent.email = email;
    newStudent.guardian_email = guardian_email;
    newStudent.last_name = last_name;
    newStudent.first_name = first_name;
    newStudent.middle_name = middle_name;
    newStudent.suffix = suffix;
    newStudent.lrn = lrn;
    newStudent.birthdate = birthdate;
    newStudent.sex = sex;
    newStudent.shs_admission_date = shs_admission_date;
    newStudent.strand = strand;
    newStudent.track = track;
    newStudent.created_by = admin._id;

    await newStudent.save();

    c.status(statusCodes.CREATED);
    return c.json(generateResponse(200, 'Success', { student: newStudent }));
};

export const updateStudentById = async (c) => {
    const admin = c.get('admin');
    const id = c.req.param('studentId');
    const { student: studentBody } = await c.req.json();
    const {
        email,
        guardian_email,
        last_name,
        first_name,
        middle_name,
        suffix,
        lrn,
        birthdate,
        sex,
        shs_admission_date,
        strand,
        track,
    } = studentBody;

    // Check if email already used by other student
    if (email) {
        const studentEmailExist = await Student.exists({ _id: { $ne: id }, email });
        if (studentEmailExist) {
            c.status(statusCodes.CONFLICT);
            return c.json(generateRecordExistsReponse('Student with the same email'));
        }
    }

    // Check if LRN is already used
    const studentLrnExist = await Student.exists({ _id: { $ne: id }, lrn });
    if (studentLrnExist) {
        c.status(statusCodes.CONFLICT);
        return c.json(generateRecordExistsReponse('Student with the same LRN'));
    }

    // Find student
    const student = await Student.findById(id);
    if (!student) {
        c.status(statusCodes.NOT_FOUND);
        return c.json(generateRecordNotExistsReponse('Student'));
    }

    student.email = email;
    student.guardian_email = guardian_email;
    student.last_name = last_name;
    student.first_name = first_name;
    student.middle_name = middle_name;
    student.suffix = suffix;
    student.lrn = lrn;
    student.birthdate = birthdate;
    student.sex = sex;
    student.shs_admission_date = shs_admission_date;
    student.strand = strand;
    student.track = track;
    student.updated_by = admin._id;

    await student.save();

    return c.json(generateResponse(200, 'Success', { student }));
};

// Special endpoint
export const getStudentOptions = async (c) => {
    const students = await Student.find().sort({ last_name: 1 }).lean();

    return c.json(generateResponse(200, 'Success', { students }));
};
