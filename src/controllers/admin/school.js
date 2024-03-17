import { generateRecordExistsReponse, generateRecordNotExistsReponse, generateResponse } from '../../helpers/response.js';
import School from '../../models/school.js';

export const getSchool = async (c) => {
    const school = await School.findOne().lean();

    c.status(200);
    return c.json(generateResponse(200, 'Success', { school }));
};

export const createSchool = async (c) => {
    const admin = c.get('admin');
    const { school: schoolBody } = await c.req.json();
    const {
        name,
        school_id,
    } = schoolBody;

    const school = await School.findOne().lean();
    if (school) {
        c.status(409);
        return c.json(generateRecordExistsReponse('School'));
    }

    const newSchool = new School();
    newSchool.name = name;
    newSchool.school_id = school_id;
    newSchool.created_by = admin._id;

    await newSchool.save();

    c.status(201);
    return c.json(generateResponse(200, 'Success', { school: newSchool }));
};

export const updateSchool = async (c) => {
    const admin = c.get('admin');
    const { school: schoolBody } = await c.req.json();
    const {
        name,
        school_id,
    } = schoolBody;

    const school = await School.findOne();
    if (!school) {
        c.status(404);
        return c.json(generateRecordNotExistsReponse('School'));
    }

    school.name = name;
    school.school_id = school_id;
    school.updated_by = admin._id;

    await school.save();

    c.status(200);
    return c.json(generateResponse(200, 'Success', { school }));
};
