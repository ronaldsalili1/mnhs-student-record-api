import bcrypt from 'bcrypt';

import Admin from '../../models/admin.js';
import { generateRecordExistsReponse, generateResponse, generateUnauthorizedReponse } from '../../helpers/response.js';

export const getAdmins = async (c) => {
    const { page = 1, limit = 10 } = c.req.query();
    const skip = limit * (page - 1);
    const query = {};

    const total = await Admin.countDocuments(query);
    const admins = await Admin.find(query)
        .limit(limit)
        .skip(skip)
        .sort({ email: 1 })
        .lean();

    for (const admin of admins) {
        delete admin.password;
    }

    c.status(200);
    return c.json(generateResponse(200, 'Success', {
        total,
        page,
        limit,
        count: admins.length,
        admins,
    }));
};

export const getAdminById = async (c) => {
    const id = c.req.param('adminId');

    const admin = await Admin.findById(id).lean();
    if (!admin) {
        c.status(401);
        return c.json(generateUnauthorizedReponse());
    }

    delete admin.password;

    c.status(200);
    return c.json(generateResponse(200, 'Success', { admin }));
};

export const createAdmin = async (c) => {
    const admin = c.get('admin');
    const { admin: adminBody } = await c.req.json();
    const {
        email,
        first_name,
        last_name,
        middle_name,
        suffix,
        roles,
    } = adminBody;

    const trimmedEmail = email.trim();
    const adminExist = await Admin.exists({ email: trimmedEmail });
    if (adminExist) {
        c.status(409);
        return c.json(generateRecordExistsReponse('Admin'));
    }

    const saltRounds = 10;
    // TODO: Refactor the password
    const password = await bcrypt.hash('password', saltRounds);

    const newAdmin = new Admin();
    newAdmin.email = email;
    newAdmin.password = password;
    newAdmin.status = 'enabled';
    newAdmin.last_name = last_name;
    newAdmin.first_name = first_name;
    newAdmin.middle_name = middle_name;
    newAdmin.suffix = suffix;
    newAdmin.roles = roles;
    newAdmin.created_by = admin._id;

    await newAdmin.save();

    const adminObject = newAdmin.toObject();
    delete adminObject.password;

    c.status(201);
    return c.json(generateResponse(200, 'Success', { admin: adminObject }));
};

export const updateAdminById = async (c) => {
    const admin = c.get('admin');
    const id = c.req.param('adminId');
    const { admin: adminBody } = await c.req.json();
    const {
        email,
        first_name,
        last_name,
        middle_name,
        suffix,
        roles,
        status,
    } = adminBody;

    const existingAdmin = await Admin.findById(id);

    existingAdmin.email = email;
    existingAdmin.status = 'enabled';
    existingAdmin.last_name = last_name;
    existingAdmin.first_name = first_name;
    existingAdmin.middle_name = middle_name;
    existingAdmin.suffix = suffix;
    existingAdmin.status = status;
    existingAdmin.roles = roles;
    existingAdmin.updated_by = admin._id;

    await existingAdmin.save();

    const adminObject = existingAdmin.toObject();
    delete adminObject.password;

    return c.json(generateResponse(200, 'Success', { admin: adminObject }));
};
