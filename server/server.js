const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const authRoutes = require('./auth-routes');
const activitiesRoutes = require('./routes/activities');

const app = express();

app.use(cors());
app.use(express.json());

/*
  Serve uploaded PDF proof files.
*/
app.use(
  '/uploads',
  express.static(
    path.join(__dirname, 'uploads')
  )
);

app.use('/auth', authRoutes);
app.use('/activities', activitiesRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Towards Connected Campus backend is running!'
  });
});

app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT 1 AS connected'
    );

    res.json({
      message: 'MySQL connected successfully!',
      result: rows
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Database connection failed'
    });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});