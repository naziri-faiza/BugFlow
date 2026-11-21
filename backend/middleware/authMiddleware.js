const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate JWT token.
 * Expects Authorization header in the form "Bearer <token>".
 */
function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Authorization header missing' });
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ success: false, message: 'Invalid Authorization header format' });
    }
    const token = parts[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      // Server misconfiguration – do not expose secret value
      console.error('JWT secret is not configured');
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }
    const payload = jwt.verify(token, secret);
    const userId = payload.userId !== undefined ? payload.userId : payload.id;
    // Attach verified user info to request for downstream handlers
    req.user = {
      id: userId,
      userId: userId,
      role: payload.role,
    };
    next();
  } catch (err) {
    // jwt.verify throws on invalid/expired token
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

/**
 * Optional role‑based authorisation middleware.
 * Usage: router.get('/admin', authenticateToken, authorizeRoles('admin'), handler);
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
    }
    next();
  };
}

module.exports = { authenticateToken, authorizeRoles };
