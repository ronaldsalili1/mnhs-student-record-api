import statusCodes from '../../constants/enums/statusCodes.js';
import { generateRecordExistsReponse, generateRecordNotExistsReponse, generateResponse } from '../../helpers/response.js';

import Semester from '../../models/semester.js';

export const getSemesters = async (c) => {
    const {
        page = 1,
        limit = 10,
    } = c.req.query();
    const skip = limit * (page - 1);
    const query = {};

    const total = await Semester.countDocuments(query);
    const semesters = await Semester.find(query)
        .limit(limit)
        .skip(skip)
        .sort({ sy_start_year: -1, term: -1 })
        .lean();

    return c.json(generateResponse(statusCodes.OK, 'Success', {
        total,
        page,
        limit,
        count: semesters.length,
        semesters,
    }));
};

export const getSemesterById = async (c) => {
    const id = c.req.param('semesterId');

    const semester = await Semester.findById(id).lean();
    if (!semester) {
        c.status(statusCodes.NOT_FOUND);
        return c.json(generateRecordNotExistsReponse('Semester'));
    }

    return c.json(generateResponse(200, 'Success', { semester }));
};

export const createSemester = async (c) => {
    const admin = c.get('admin');
    const { semester: semesterBody } = await c.req.json();
    const {
        sy_start_year,
        sy_end_year,
        term,
        status,
    } = semesterBody;

    // Check if semester already exist
    const semesterExist = await Semester.exists({ sy_start_year, sy_end_year, term });
    if (semesterExist) {
        c.status(statusCodes.CONFLICT);
        return c.json(generateRecordExistsReponse('Semester'));
    }

    // Check status. Only one "active" semester is allowed
    if (status === 'active') {
        const currentSemesterExist = await Semester.exists({ status: 'active' });
        if (currentSemesterExist) {
            c.status(statusCodes.CONFLICT);
            return c.json(generateRecordExistsReponse('Semester with status "active"'));
        }
    }

    const newSemester = new Semester();
    newSemester.sy_start_year = sy_start_year;
    newSemester.sy_end_year = sy_end_year;
    newSemester.term = term;
    newSemester.status = status;
    newSemester.created_by = admin._id;

    await newSemester.save();

    c.status(statusCodes.CREATED);
    return c.json(generateResponse(200, 'Success', { semester: newSemester }));
};

export const updateSemesterById = async (c) => {
    const id = c.req.param('semesterId');
    const admin = c.get('admin');
    const { semester: semesterBody } = await c.req.json();
    const {
        sy_start_year,
        sy_end_year,
        term,
        status,
    } = semesterBody;

    const semester = await Semester.findById(id);
    if (!semester) {
        c.status(statusCodes.NOT_FOUND);
        return c.json(generateRecordNotExistsReponse('Semester'));
    }

    // Check if semester already exist
    const semesterExist = await Semester.exists({
        _id: { $ne: id },
        sy_start_year,
        sy_end_year,
        term,
    });
    if (semesterExist) {
        c.status(statusCodes.CONFLICT);
        return c.json(generateRecordExistsReponse('Semester'));
    }

    // Check status. Only one "active" semester is allowed
    if (status === 'active') {
        const currentSemesterExist = await Semester.exists({ _id: { $ne: id }, status: 'active' });
        if (currentSemesterExist) {
            c.status(statusCodes.CONFLICT);
            return c.json(generateRecordExistsReponse('Semester with status "active"'));
        }
    }

    semester.sy_start_year = sy_start_year;
    semester.sy_end_year = sy_end_year;
    semester.term = term;
    semester.status = status;
    semester.updated_by = admin._id;

    await semester.save();

    return c.json(generateResponse(200, 'Success', { semester }));
};

// Special endpoint
export const getSemesterOptions = async (c) => {
    const semesters = await Semester.find().sort({ sy_start_year: -1, term: -1 }).lean();

    return c.json(generateResponse(200, 'Success', { semesters }));
};
