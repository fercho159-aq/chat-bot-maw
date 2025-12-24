const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// PostgreSQL connection
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_hWR7yQga0wub@ep-empty-pine-a4xpry1f-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: {
        rejectUnauthorized: false
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API: Get all unique session IDs
app.get('/api/sessions', async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT DISTINCT session_id, 
             COUNT(*) as message_count,
             MIN(id) as first_message_id
      FROM n8n_chat_histories 
      GROUP BY session_id 
      ORDER BY first_message_id DESC
    `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

// API: Get all messages for a specific session
app.get('/api/messages/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const result = await pool.query(
            'SELECT id, session_id, message FROM n8n_chat_histories WHERE session_id = $1 ORDER BY id ASC',
            [sessionId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// API: Get all messages (for initial load or when no session selected)
app.get('/api/messages', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, session_id, message FROM n8n_chat_histories ORDER BY id ASC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
