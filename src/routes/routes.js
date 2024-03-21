// Admin Routes
import adminAdmins from './admin/admins.js';
import adminAuth from './admin/auth.js';
import adminSchool from './admin/school.js';
import adminTeachers from './admin/teachers.js';
import adminSections from './admin/sections.js';

// Worker Routes
import workerNotifications from './worker/notifications.js';

export default [
    // Admin Routes
    [
        adminAdmins,
        adminAuth,
        adminSchool,
        adminTeachers,
        adminSections,
    ],

    // Worker Routes
    [
        workerNotifications,
    ],
];
