/**
 * Role-Based Access Control Middleware (Cross-Cutting)
 *
 * Roles hierarchy: ADMIN > COO > APPROVER > CHECKER > MAKER
 *
 * Usage:
 *   router.post('/approve', requireAuth(), rbac('APPROVER', 'COO', 'ADMIN'), handler);
 */

const ROLE_HIERARCHY = {
    ADMIN: 5,
    COO: 4,
    APPROVER: 3,
    CHECKER: 2,
    MAKER: 1,
};

/**
 * Express middleware: checks req.user.role against allowed roles.
 * Must be used AFTER authMiddleware() and requireAuth().
 *
 * @param {...string} allowedRoles - Roles that can access this route
 */
function rbac(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userRole = req.user.role;
        if (allowedRoles.includes(userRole)) {
            return next();
        }

        return res.status(403).json({
            error: 'Insufficient permissions',
            required_roles: allowedRoles,
            your_role: userRole,
        });
    };
}

/**
 * Check if a user role meets a minimum level.
 * @param {string} userRole - The user's role
 * @param {string} minimumRole - The minimum required role
 * @returns {boolean}
 */
function hasMinimumRole(userRole, minimumRole) {
    return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[minimumRole] || 0);
}

module.exports = { rbac, hasMinimumRole, ROLE_HIERARCHY };
