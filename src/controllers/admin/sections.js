import statusCodes from '../../constants/enums/statusCodes.js';
import { generateRecordExistsReponse, generateRecordNotExistsReponse, generateResponse } from '../../helpers/response.js';

import Section from '../../models/section.js';

export const getSections = async (c) => {
    const {
        page = 1,
        limit = 10,
        teacher_id,
        grade_level,
        keyword,
    } = c.req.query();
    const skip = limit * (page - 1);
    const query = {
        ...(teacher_id && { teacher_id }),
        ...(grade_level && { grade_level }),
        ...(keyword && {
            $or: [
                { name: { $regex: keyword, $options: 'i' } },
            ],
        }),
    };

    const total = await Section.countDocuments(query);
    const sections = await Section.find(query)
        .limit(limit)
        .skip(skip)
        .sort({ name: 1 })
        .populate('teacher_id')
        .lean();

    // Change the name teacher_id to teacher
    sections.forEach((section) => {
        section.teacher = section.teacher_id;
        delete section.teacher_id;

        // Remove the password hash
        delete section.teacher.password;
    });

    return c.json(generateResponse(statusCodes.OK, 'Success', {
        total,
        page,
        limit,
        count: sections.length,
        sections,
    }));
};

export const getSectionById = async (c) => {
    const id = c.req.param('sectionId');

    const section = await Section.findById(id).lean();
    if (!section) {
        c.status(statusCodes.NOT_FOUND);
        return c.json(generateRecordNotExistsReponse('Section'));
    }

    return c.json(generateResponse(200, 'Success', { section }));
};

export const createSection = async (c) => {
    const admin = c.get('admin');
    const { section: sectionBody } = await c.req.json();
    const {
        grade_level,
        name,
        teacher_id,
    } = sectionBody;

    const parsedName = name.trim().toLowerCase();
    const sectionExist = await Section.exists({ name: parsedName });
    if (sectionExist) {
        c.status(statusCodes.CONFLICT);
        return c.json(generateRecordExistsReponse('Section with the same name'));
    }

    const newSection = new Section();
    newSection.grade_level = grade_level;
    newSection.name = name;
    newSection.teacher_id = teacher_id;
    newSection.created_by = admin._id;

    await newSection.save();

    c.status(statusCodes.CREATED);
    return c.json(generateResponse(200, 'Success', { section: newSection }));
};

export const updateSectionById = async (c) => {
    const id = c.req.param('sectionId');
    const admin = c.get('admin');
    const { section: sectionBody } = await c.req.json();
    const {
        grade_level,
        name,
        teacher_id,
    } = sectionBody;

    const section = await Section.findById(id);
    if (!section) {
        c.status(statusCodes.NOT_FOUND);
        return c.json(generateRecordNotExistsReponse('Section'));
    }

    const parsedName = name.trim().toLowerCase();
    const sectionExist = await Section.findOne({
        _id: { $ne: id },
        name: parsedName,
    });
    if (sectionExist) {
        c.status(statusCodes.CONFLICT);
        return c.json(generateRecordExistsReponse('Section with the same name'));
    }

    section.grade_level = grade_level;
    section.name = name;
    section.teacher_id = teacher_id;
    section.updated_by = admin._id;

    await section.save();

    return c.json(generateResponse(200, 'Success', { section }));
};
