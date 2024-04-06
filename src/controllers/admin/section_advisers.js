import statusCodes from '../../constants/enums/statusCodes.js';
import { generateRecordExistsReponse, generateRecordNotExistsReponse, generateResponse } from '../../helpers/response.js';

import SectionAdviser from '../../models/section_adviser.js';

export const getSectionAdvisers = async (c) => {
    const {
        page = 1,
        limit = 10,
        section_id,
    } = c.req.query();
    const skip = limit * (page - 1);
    const query = {
        ...(section_id && { section_id }),
    };

    const total = await SectionAdviser.countDocuments(query);
    const sectionAdvisers = await SectionAdviser.find(query)
        .limit(limit)
        .skip(skip)
        .populate('teacher_id')
        .sort({ start_at: -1 })
        .lean();

    // eslint-disable-next-line arrow-parens
    sectionAdvisers.forEach(sectionAdviser => {
        sectionAdviser.teacher = sectionAdviser.teacher_id;
        delete sectionAdviser.teacher_id;
        delete sectionAdviser.teacher.password;
    });

    return c.json(generateResponse(statusCodes.OK, 'Success', {
        total,
        page,
        limit,
        count: sectionAdvisers.length,
        section_advisers: sectionAdvisers,
    }));
};

export const getSectionAdviserById = async (c) => {
    const id = c.req.param('sectionAdviserId');

    const sectionAdviser = await SectionAdviser.findById(id).populate('teacher_id').lean();
    if (!sectionAdviser) {
        c.status(statusCodes.NOT_FOUND);
        return c.json(generateRecordNotExistsReponse('Adviser'));
    }

    sectionAdviser.teacher = sectionAdviser.teacher_id;
    delete sectionAdviser.teacher_id;
    delete sectionAdviser.teacher.password;

    return c.json(generateResponse(statusCodes.OK, 'Success', { section_adviser: sectionAdviser }));
};

export const createSectionAdviser = async (c) => {
    const admin = c.get('admin');
    const { section_adviser: sectionAdviserBody } = await c.req.json();
    const {
        section_id,
        teacher_id,
        start_at,
        end_at,
        current_timestamp,
    } = sectionAdviserBody;

    // Check if record already exist
    const sectionAdviserExist = await SectionAdviser.exists({
        section_id,
        teacher_id,
        $or: [
            { end_at: { $gt: current_timestamp } },
            { end_at: { $exists: false } },
        ],
    });
    if (sectionAdviserExist) {
        c.status(statusCodes.CONFLICT);
        return c.json(generateRecordExistsReponse('Adviser'));
    }

    const newSectionAdviser = new SectionAdviser();
    newSectionAdviser.section_id = section_id;
    newSectionAdviser.teacher_id = teacher_id;
    newSectionAdviser.start_at = start_at;
    newSectionAdviser.end_at = end_at;
    newSectionAdviser.created_by = admin._id;

    await newSectionAdviser.save();

    c.status(statusCodes.CREATED);
    return c.json(generateResponse(statusCodes.OK, 'Success', { section_adviser: newSectionAdviser }));
};

export const updateSectionAdviserById = async (c) => {
    const id = c.req.param('sectionAdviserId');
    const admin = c.get('admin');
    const { section_adviser: sectionAdviserBody } = await c.req.json();
    const {
        section_id,
        teacher_id,
        start_at,
        end_at,
        current_timestamp,
    } = sectionAdviserBody;

    const sectionAdviser = await SectionAdviser.findById(id);
    if (!sectionAdviser) {
        c.status(statusCodes.NOT_FOUND);
        return c.json(generateRecordNotExistsReponse('Adviser'));
    }

    // Check if record already exist
    const sectionAdviserExist = await SectionAdviser.exists({
        _id: { $ne: id },
        section_id,
        teacher_id,
        $or: [
            { end_at: { $gt: current_timestamp } },
            { end_at: { $exists: false } },
        ],
    });
    if (sectionAdviserExist) {
        c.status(statusCodes.CONFLICT);
        return c.json(generateRecordExistsReponse('Adviser'));
    }

    sectionAdviser.section_id = section_id;
    sectionAdviser.teacher_id = teacher_id;
    sectionAdviser.start_at = start_at;
    sectionAdviser.end_at = end_at;
    sectionAdviser.updated_by = admin._id;

    await sectionAdviser.save();

    return c.json(generateResponse(statusCodes.OK, 'Success', { section_adviser: sectionAdviser }));
};
