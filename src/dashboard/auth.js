import { Router } from 'express';

const DASHBOARD_PASSWORD = 'Beast1987!?';

/**
 * Middleware: require authenticated session for protected routes
 */
export function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}

/**
 * Create auth router with login/logout/status endpoints
 */
export function createAuthRouter() {
  const router = Router();

  // POST /api/auth/login
  router.post('/login', (req, res) => {
    const { password } = req.body;
    if (password === DASHBOARD_PASSWORD) {
      req.session.authenticated = true;
      res.json({ success: true });
    } else {
      res.status(401).json({ error: 'Invalid password' });
    }
  });

  // POST /api/auth/logout
  router.post('/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // GET /api/auth/status
  router.get('/status', (req, res) => {
    res.json({ authenticated: !!(req.session && req.session.authenticated) });
  });

  return router;
}
