import statusCodes from '../../constants/enums/statusCodes.js';
import { generateRecordExistsReponse, generateRecordNotExistsReponse, generateResponse } from '../../helpers/response.js';
import Student from '../../models/student.js';
import StudentShsEligibility from '../../models/student_shs_eligibility.js';

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
        .populate('student_shs_eligibility_id')
        .sort({ last_name: 1 })
        .lean();

    // Rename the populated part
    students.forEach((student) => {
        student.student_shs_eligibility = student.student_shs_eligibility_id;
        delete student.student_shs_eligibility_id;
    });

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
    const student = await Student.findById(id).populate('student_shs_eligibility_id').lean();
    if (!student) {
        c.status(statusCodes.NOT_FOUND);
        return c.json(generateRecordNotExistsReponse('Student'));
    }

    student.student_shs_eligibility = student.student_shs_eligibility_id;
    delete student.student_shs_eligibility_id;

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
        hs_completer,
        hs_gen_avg,
        jhs_completer,
        jhs_gen_avg,
        completion_date,
        school_name,
        school_address,
        pept_passer,
        pept_rating,
        als_ae_passer,
        als_ae_rating,
        others,
        assesment_date,
        clc_name_address,
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

    const newStudentShsEligibility = new StudentShsEligibility();
    newStudentShsEligibility.hs_completer = hs_completer === 'yes';
    newStudentShsEligibility.hs_gen_avg = hs_gen_avg;
    newStudentShsEligibility.jhs_completer = jhs_completer === 'yes';
    newStudentShsEligibility.jhs_gen_avg = jhs_gen_avg;
    newStudentShsEligibility.completion_date = completion_date;
    newStudentShsEligibility.school_name = school_name;
    newStudentShsEligibility.school_address = school_address;
    newStudentShsEligibility.pept_passer = pept_passer === 'yes';
    newStudentShsEligibility.pept_rating = pept_rating;
    newStudentShsEligibility.als_ae_passer = als_ae_passer === 'yes';
    newStudentShsEligibility.als_ae_rating = als_ae_rating;
    newStudentShsEligibility.others = others;
    newStudentShsEligibility.assesment_date = assesment_date;
    newStudentShsEligibility.clc_name_address = clc_name_address;
    newStudentShsEligibility.created_by = admin._id;

    const newStudent = new Student();
    newStudent.student_shs_eligibility_id = newStudentShsEligibility._id;
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
    await newStudentShsEligibility.save();

    const studentObj = newStudent.toObject();
    const studentShsEligibilityObj = newStudentShsEligibility.toObject();

    c.status(statusCodes.CREATED);
    return c.json(generateResponse(200, 'Success', {
        student: {
            ...studentObj,
            student_shs_eligibility: studentShsEligibilityObj,
        },
    }));
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
        hs_completer,
        hs_gen_avg,
        jhs_completer,
        jhs_gen_avg,
        completion_date,
        school_name,
        school_address,
        pept_passer,
        pept_rating,
        als_ae_passer,
        als_ae_rating,
        others,
        assesment_date,
        clc_name_address,
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

    // Find the SHS Eligibility
    const studentShsEligibility = await StudentShsEligibility
        .findById(student.student_shs_eligibility_id)
        || new StudentShsEligibility();

    student.student_shs_eligibility_id = studentShsEligibility._id;
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

    studentShsEligibility.hs_completer = hs_completer === 'yes';
    studentShsEligibility.hs_gen_avg = hs_gen_avg;
    studentShsEligibility.jhs_completer = jhs_completer === 'yes';
    studentShsEligibility.jhs_gen_avg = jhs_gen_avg;
    studentShsEligibility.completion_date = completion_date;
    studentShsEligibility.school_name = school_name;
    studentShsEligibility.school_address = school_address;
    studentShsEligibility.pept_passer = pept_passer === 'yes';
    studentShsEligibility.pept_rating = pept_rating;
    studentShsEligibility.als_ae_passer = als_ae_passer === 'yes';
    studentShsEligibility.als_ae_rating = als_ae_rating;
    studentShsEligibility.others = others;
    studentShsEligibility.assesment_date = assesment_date;
    studentShsEligibility.clc_name_address = clc_name_address;
    studentShsEligibility.updated_by = admin._id;

    await student.save();
    await studentShsEligibility.save();

    const studentObj = student.toObject();
    const studentShsEligibilityObj = studentShsEligibility.toObject();

    return c.json(generateResponse(200, 'Success', {
        student: {
            ...studentObj,
            student_shs_eligibility: studentShsEligibilityObj,
        },
    }));
};
