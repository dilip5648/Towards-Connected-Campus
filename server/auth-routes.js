const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

/*
  REGISTER
  Public registration creates student accounts only.
*/
router.post('/register', async (req, res) => {
  try {
    const {
      bec,
      name,
      department,
      password
    } = req.body;

    if (!bec || !name || !password) {
      return res.status(400).json({
        message: 'BEC, name, and password are required'
      });
    }

    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE bec = ?',
      [bec]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: 'User with this BEC already exists'
      });
    }

    const passwordHash = await bcrypt.hash(
      password,
      10
    );

    await db.query(
      `INSERT INTO users
      (
        bec,
        name,
        department,
        password_hash,
        role,
        created_at
      )
      VALUES (?, ?, ?, ?, 'student', NOW())`,
      [
        bec,
        name,
        department || null,
        passwordHash
      ]
    );

    return res.status(201).json({
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Registration failed'
    });
  }
});

/*
  LOGIN
*/
router.post('/login', async (req, res) => {
  try {
    const {
      bec,
      password
    } = req.body;

    if (!bec || !password) {
      return res.status(400).json({
        message: 'BEC and password are required'
      });
    }

    const [users] = await db.query(
      `SELECT
        id,
        bec,
        name,
        department,
        password_hash,
        role
      FROM users
      WHERE bec = ?`,
      [bec]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: 'Invalid BEC or password'
      });
    }

    const user = users[0];

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Invalid BEC or password'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        bec: user.bec,
        name: user.name,
        department: user.department,
        role: user.role
      },
      JWT_SECRET,
      {
        expiresIn: '8h'
      }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        bec: user.bec,
        name: user.name,
        department: user.department,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Login failed'
    });
  }
});

module.exports = router;