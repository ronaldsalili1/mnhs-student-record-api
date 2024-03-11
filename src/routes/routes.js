// Admin Routes
import adminAdmins from './admin/admins.js';
import adminAuth from './admin/auth.js';

// App Routes
import teacherTests from './teacher/tests.js';

export default [
    // Admin Routes
    [
        adminAdmins,
        adminAuth,
    ],
    // Teacher Routes
    [
        teacherTests,
    ],
];
