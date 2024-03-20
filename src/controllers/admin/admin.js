import bcrypt from 'bcrypt';

import statusCodes from '../../constants/enums/statusCodes.js';
import Admin from '../../models/admin.js';
import { generateRecordExistsReponse, generateRecordNotExistsReponse, generateResponse, generateUnauthorizedReponse } from '../../helpers/response.js';
import { generateRandomString } from '../../helpers/general.js';
import { publish } from '../../helpers/rabbitmq.js';

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

    return c.json(generateResponse(statusCodes.OK, 'Success', {
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
        c.status(statusCodes.NOT_FOUND);
        return c.json(generateRecordNotExistsReponse('Admin'));
    }

    delete admin.password;

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
        c.status(statusCodes.CONFLICT);
        return c.json(generateRecordExistsReponse('Admin'));
    }

    const saltRounds = 10;

    let password;
    if (process.env.NODE_ENV === 'development') {
        password = await bcrypt.hash('password', saltRounds);
    } else {
        const plainPassword = generateRandomString(6);
        password = await bcrypt.hash(plainPassword, saltRounds);

        try {
            await publish('spawn_notification', {
                type: 'account_creation',
                to: email,
                password: plainPassword,
                first_name,
                last_name,
            });
        } catch (error) {
            return c.json(generateResponse(statusCodes.BAD_REQUEST, 'Unable to send account creation notification'));
        }
    }

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

    c.status(statusCodes.CREATED);
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
        current_password,
        new_password_1,
        new_password_2,
    } = adminBody;

    const existingAdmin = await Admin.findById(id);
    if (!existingAdmin) {
        c.status(statusCodes.NOT_FOUND);
        return c.json(generateRecordNotExistsReponse('Admin'));
    }

    if (
        (current_password && current_password !== '')
        || (new_password_1 && new_password_1 !== '')
        || (new_password_2 && new_password_2 !== '')
    ) {
        // Check if current password is valid
        const passwordMatched = await bcrypt.compare(current_password, existingAdmin.password);
        if (!passwordMatched) {
            c.status(statusCodes.FORBIDDEN);
            return c.json(generateResponse(403, 'Current password is incorrect'));
        }

        // Check if new_password_1 and new_password_1 matched
        if (new_password_1 !== new_password_2) {
            c.status(statusCodes.FORBIDDEN);
            return c.json(generateResponse(403, 'The new password and the confirm password did not match'));
        }

        // Hash new password
        const saltRounds = 10;
        const newPassword = await bcrypt.hash(new_password_1, saltRounds);

        existingAdmin.password = newPassword;
    }

    existingAdmin.email = email;
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
