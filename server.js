const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware
app.use(cors());
app.use(express.json());

// Crear tablas si no existen
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
    console.log('✓ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('Error inicializando base de datos:', error);
  }
}

// Rutas

// Crear o obtener usuario
app.post('/api/users', async (req, res) => {
  try {
    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Nombre y email requeridos' });
    }

    // Intentar obtener usuario existente
    let user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (user.rows.length > 0) {
      return res.json(user.rows[0]);
    }

    // Crear nuevo usuario
    user = await pool.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      [name, email]
    );
    
    res.status(201).json(user.rows[0]);
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ error: error.message });
  }
});

// Guardar cálculo
app.post('/api/calculations', async (req, res) => {
  try {
    const { user_id, expression, result } = req.body;
    
    if (!user_id || !expression || result === undefined) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    const calculation = await pool.query(
      'INSERT INTO calculations (user_id, expression, result) VALUES ($1, $2, $3) RETURNING *',
      [user_id, expression, result]
    );
    
    res.status(201).json(calculation.rows[0]);
  } catch (error) {
    console.error('Error guardando cálculo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener historial de cálculos de un usuario
app.get('/api/calculations/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    const calculations = await pool.query(
      'SELECT * FROM calculations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [user_id]
    );
    
    res.json(calculations.rows);
  } catch (error) {
    console.error('Error obteniendo cálculos:', error);
    res.status(500).json({ error: error.message });
  }
});

// Eliminar cálculo
app.delete('/api/calculations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM calculations WHERE id = $1', [id]);
    res.json({ message: 'Cálculo eliminado' });
  } catch (error) {
    console.error('Error eliminando cálculo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

const PORT = process.env.PORT || 5000;

// Inicializar base de datos y arrancar servidor
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  });
}).catch(error => {
  console.error('Error iniciando servidor:', error);
  process.exit(1);
});
