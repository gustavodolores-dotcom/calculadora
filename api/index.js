import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Inicializar base de datos
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS calculations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        expression VARCHAR(255) NOT NULL,
        result DECIMAL(15, 8) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_calculations_user_id ON calculations(user_id);
      CREATE INDEX IF NOT EXISTS idx_calculations_created_at ON calculations(created_at);
    `);
  } catch (error) {
    console.error('Error inicializando DB:', error);
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  
  await initDatabase();

  // Health check
  if (pathname === '/api/health') {
    return res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
  }

  // Crear o obtener usuario
  if (pathname === '/api/users' && req.method === 'POST') {
    try {
      const { name, email } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({ error: 'Nombre y email requeridos' });
      }

      let user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      
      if (user.rows.length > 0) {
        return res.status(200).json(user.rows[0]);
      }

      user = await pool.query(
        'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
        [name, email]
      );
      
      return res.status(201).json(user.rows[0]);
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Guardar cálculo
  if (pathname === '/api/calculations' && req.method === 'POST') {
    try {
      const { user_id, expression, result } = req.body;
      
      if (!user_id || !expression || result === undefined) {
        return res.status(400).json({ error: 'Datos incompletos' });
      }

      const calculation = await pool.query(
        'INSERT INTO calculations (user_id, expression, result) VALUES ($1, $2, $3) RETURNING *',
        [user_id, expression, result]
      );
      
      return res.status(201).json(calculation.rows[0]);
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Obtener historial
  if (pathname.startsWith('/api/calculations/') && req.method === 'GET') {
    try {
      const user_id = pathname.split('/').pop();
      
      const calculations = await pool.query(
        'SELECT * FROM calculations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
        [user_id]
      );
      
      return res.status(200).json(calculations.rows);
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Eliminar cálculo
  if (pathname.startsWith('/api/calculations/') && req.method === 'DELETE') {
    try {
      const id = pathname.split('/').pop();
      
      await pool.query('DELETE FROM calculations WHERE id = $1', [id]);
      return res.status(200).json({ message: 'Cálculo eliminado' });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  res.status(404).json({ error: 'Endpoint no encontrado' });
}
