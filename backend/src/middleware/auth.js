const jwt = require('jsonwebtoken'); 

// middleware acces doar rol professor
function requireProfessor(req, res, next) {
    if (!req.user || req.user.role !== 'professor') {
        return res.status(403).json({ error: 'Acces permis doar profesorilor' });
    }
    next();
}

// middleware autentificare cu token JWT
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Autentificare necesară' });
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const id = payload.userId ?? payload.id; // <- IMPORTANT
    if (!id) {
      return res.status(401).json({ error: 'Token valid dar fără user id' });
    }

    req.user = {
      id,
      role: payload.role,
    };

    return next();
  } catch (err) {
    console.error('JWT verify error:', err);
    return res.status(401).json({ error: 'Token invalid sau expirat' });
  }
}


module.exports = { requireProfessor, requireAuth };
