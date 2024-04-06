import statusCodes from '../../constants/enums/statusCodes.js';
import { generateRecordExistsReponse, generateRecordNotExistsReponse, generateResponse } from '../../helpers/response.js';

import Subject from '../../models/subject.js';

export const getSubjects = async (c) => {
    const {
        page = 1,
        limit = 10,
        type,
        keyword,
    } = c.req.query();
    const skip = limit * (page - 1);
    const query = {
        ...(type && { type }),
        ...(keyword && {
            $or: [
                { name: { $regex: keyword, $options: 'i' } },
            ],
        }),
    };

    const total = await Subject.countDocuments(query);
    const subjects = await Subject.find(query)
        .limit(limit)
        .skip(skip)
        .sort({ name: 1 })
        .lean();

    return c.json(generateResponse(statusCodes.OK, 'Success', {
        total,
        page,
        limit,
        count: subjects.length,
        subjects,
    }));
};

export const getSubjectById = async (c) => {
    const id = c.req.param('subjectId');

    const subject = await Subject.findById(id).lean();
    if (!subject) {
        c.status(statusCodes.NOT_FOUND);
        return c.json(generateRecordNotExistsReponse('Subject'));
    }

    return c.json(generateResponse(statusCodes.OK, 'Success', { subject }));
};

export const createSubject = async (c) => {
    const admin = c.get('admin');
    const { subject: subjectBody } = await c.req.json();
    const {
        name,
        type,
    } = subjectBody;

    const parsedName = name.trim().toLowerCase();
    const subjectExist = await Subject.exists({ name: parsedName });
    if (subjectExist) {
        c.status(statusCodes.CONFLICT);
        return c.json(generateRecordExistsReponse('Subject with the same name'));
    }

    const newSubject = new Subject();
    newSubject.name = name;
    newSubject.type = type;
    newSubject.created_by = admin._id;

    await newSubject.save();

    c.status(statusCodes.CREATED);
    return c.json(generateResponse(statusCodes.OK, 'Success', { subject: newSubject }));
};

export const updateSubjectById = async (c) => {
    const id = c.req.param('subjectId');
    const admin = c.get('admin');
    const { subject: subjectBody } = await c.req.json();
    const {
        name,
        type,
    } = subjectBody;

    const subject = await Subject.findById(id);
    if (!subject) {
        c.status(statusCodes.NOT_FOUND);
        return c.json(generateRecordNotExistsReponse('Subject'));
    }

    const parsedName = name.trim().toLowerCase();
    const subjectExist = await Subject.findOne({
        _id: { $ne: id },
        name: parsedName,
    });
    if (subjectExist) {
        c.status(statusCodes.CONFLICT);
        return c.json(generateRecordExistsReponse('Subject with the same name'));
    }

    subject.name = name;
    subject.type = type;
    subject.updated_by = admin._id;

    await subject.save();

    return c.json(generateResponse(statusCodes.OK, 'Success', { subject }));
};

// Special endpoint
export const getSubjectOptions = async (c) => {
    const subjects = await Subject.find().sort({ name: 1 }).lean();

    return c.json(generateResponse(statusCodes.OK, 'Success', { subjects }));
};
