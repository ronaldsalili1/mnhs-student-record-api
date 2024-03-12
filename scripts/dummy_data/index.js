/* eslint-disable no-await-in-loop */
import bcrypt from 'bcrypt';

// Models
import Admin from '../../src/models/admin.js';

// Data
import admins from './data/admins.js';

import initializeMongo from '../../src/bin/mongo.js';

const initializeData = async () => {
    await initializeMongo();

    // Admins
    console.log('Inserting Admins');
    for (const admin of admins) {
        const adminExist = await Admin.exists({ _id: admin._id });
        if (adminExist) {
            continue;
        }

        const saltRounds = 10;
        const password = await bcrypt.hash(admin.password, saltRounds);

        const newAdmin = new Admin();
        newAdmin._id = admin._id;
        newAdmin.email = admin.email;
        newAdmin.password = password;
        newAdmin.status = admin.status;
        newAdmin.first_name = admin.first_name;
        newAdmin.last_name = admin.last_name;
        newAdmin.roles = admin.roles;

        await newAdmin.save();
    }
    console.log('Done Inserting Admins');

    process.exit();
};

initializeData();
