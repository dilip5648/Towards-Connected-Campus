const express = require('express');
const path = require('path');
const multer = require('multer');
const db = require('../db');
const {
  requireAuth,
  requireRole
} = require('../middleware/auth');

const router = express.Router();

const allowedCategories = [
  'hackathon',
  'certification',
  'nss_ncc',
  'sports',
  'workshop',
  'other'
];

/*
  PDF upload configuration
*/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(
      null,
      path.join(__dirname, '..', 'uploads')
    );
  },

  filename: (req, file, cb) => {
    const uniqueName =
      `${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`;

    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(
        new Error('Only PDF files are allowed')
      );
    }

    cb(null, true);
  }
});

/*
  STUDENT
  Submit a new activity
  Supports either:
  - proof URL
  - PDF proof
*/
router.post(
  '/',
  requireAuth,
  requireRole('student'),
  upload.single('proof_file'),
  async (req, res) => {
    try {
      const {
        category,
        title,
        organizer,
        activity_date,
        description,
        proof_url
      } = req.body;

      if (!category || !title) {
        return res.status(400).json({
          message: 'Category and title are required'
        });
      }

      if (!allowedCategories.includes(category)) {
        return res.status(400).json({
          message: 'Invalid activity category'
        });
      }

      if (proof_url && req.file) {
        return res.status(400).json({
          message:
            'Please provide either a proof link or a PDF, not both'
        });
      }

      const proofType = req.file
        ? 'pdf'
        : 'link';

      const proofFile = req.file
        ? `/uploads/${req.file.filename}`
        : null;

      await db.query(
        `INSERT INTO activities
        (
          bec,
          category,
          title,
          organizer,
          activity_date,
          description,
          proof_url,
          proof_type,
          proof_file,
          status,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
        [
          req.user.bec,
          category,
          title,
          organizer || null,
          activity_date || null,
          description || null,
          proof_url || null,
          proofType,
          proofFile
        ]
      );

      return res.status(201).json({
        message: 'Activity submitted successfully'
      });
    } catch (error) {
      console.error(
        'Submit activity error:',
        error
      );

      return res.status(500).json({
        message:
          error.message ||
          'Failed to submit activity'
      });
    }
  }
);

/*
  STUDENT
  Get own activities
*/
router.get(
  '/me',
  requireAuth,
  requireRole('student'),
  async (req, res) => {
    try {
      const [rows] = await db.query(
        `SELECT
          id,
          bec,
          category,
          title,
          organizer,
          activity_date,
          description,
          proof_url,
          proof_type,
          proof_file,
          status,
          verified_by,
          verified_at,
          rejection_reason,
          created_at
        FROM activities
        WHERE bec = ?
        ORDER BY created_at DESC`,
        [req.user.bec]
      );

      return res.json(rows);
    } catch (error) {
      console.error(
        'Get own activities error:',
        error
      );

      return res.status(500).json({
        message:
          'Failed to fetch activities'
      });
    }
  }
);

/*
  STUDENT
  Get activity statistics
*/
router.get(
  '/stats/me',
  requireAuth,
  requireRole('student'),
  async (req, res) => {
    try {
      const [rows] = await db.query(
        `SELECT
          COUNT(*) AS total,
          COALESCE(
            SUM(
              CASE
                WHEN status = 'pending'
                THEN 1
                ELSE 0
              END
            ),
            0
          ) AS pending,
          COALESCE(
            SUM(
              CASE
                WHEN status = 'verified'
                THEN 1
                ELSE 0
              END
            ),
            0
          ) AS verified,
          COALESCE(
            SUM(
              CASE
                WHEN status = 'rejected'
                THEN 1
                ELSE 0
              END
            ),
            0
          ) AS rejected
        FROM activities
        WHERE bec = ?`,
        [req.user.bec]
      );

      const stats = rows[0];

      return res.json({
        total: Number(stats.total || 0),
        pending: Number(stats.pending || 0),
        verified: Number(stats.verified || 0),
        rejected: Number(stats.rejected || 0)
      });
    } catch (error) {
      console.error(
        'Get activity statistics error:',
        error
      );

      return res.status(500).json({
        message:
          'Failed to fetch activity statistics'
      });
    }
  }
);

/*
  TEACHER / HOD
  Get pending activities
*/
router.get(
  '/pending',
  requireAuth,
  requireRole('teacher', 'hod'),
  async (req, res) => {
    try {
      const [rows] = await db.query(
        `SELECT
          a.id,
          a.bec,
          s.name,
          s.department,
          a.category,
          a.title,
          a.organizer,
          a.activity_date,
          a.description,
          a.proof_url,
          a.proof_type,
          a.proof_file,
          a.status,
          a.created_at
        FROM activities a
        LEFT JOIN students s
          ON a.bec = s.bec
        WHERE a.status = 'pending'
        ORDER BY a.created_at DESC`
      );

      return res.json(rows);
    } catch (error) {
      console.error(
        'Get pending activities error:',
        error
      );

      return res.status(500).json({
        message:
          'Failed to fetch pending activities'
      });
    }
  }
);

/*
  TEACHER / HOD
  Verify or reject an activity
*/
router.post(
  '/:id/verify',
  requireAuth,
  requireRole('teacher', 'hod'),
  async (req, res) => {
    try {
      const activityId =
        Number(req.params.id);

      const {
        decision,
        rejection_reason
      } = req.body;

      if (!Number.isInteger(activityId)) {
        return res.status(400).json({
          message:
            'Invalid activity ID'
        });
      }

      if (
        !['verified', 'rejected']
          .includes(decision)
      ) {
        return res.status(400).json({
          message:
            'Decision must be verified or rejected'
        });
      }

      if (
        decision === 'rejected' &&
        !rejection_reason
      ) {
        return res.status(400).json({
          message:
            'Rejection reason is required'
        });
      }

      const [result] = await db.query(
        `UPDATE activities
        SET
          status = ?,
          verified_by = ?,
          verified_at = NOW(),
          rejection_reason = ?
        WHERE id = ?
          AND status = 'pending'`,
        [
          decision,
          req.user.bec,
          decision === 'rejected'
            ? rejection_reason
            : null,
          activityId
        ]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message:
            'Pending activity not found or already processed'
        });
      }

      return res.json({
        message:
          `Activity ${decision} successfully`
      });
    } catch (error) {
      console.error(
        'Verification error:',
        error
      );

      return res.status(500).json({
        message:
          'Failed to update activity'
      });
    }
  }
);

/*
  TEACHER / HOD / PO
  Get verified activities for a BEC
*/
router.get(
  '/verified/:bec',
  requireAuth,
  requireRole(
    'teacher',
    'hod',
    'po'
  ),
  async (req, res) => {
    try {
      const [rows] = await db.query(
        `SELECT
          id,
          bec,
          category,
          title,
          organizer,
          activity_date,
          description,
          proof_url,
          proof_type,
          proof_file,
          status,
          verified_by,
          verified_at,
          created_at
        FROM activities
        WHERE bec = ?
          AND status = 'verified'
        ORDER BY
          activity_date DESC,
          created_at DESC`,
        [req.params.bec]
      );

      return res.json(rows);
    } catch (error) {
      console.error(
        'Get verified activities error:',
        error
      );

      return res.status(500).json({
        message:
          'Failed to fetch verified activities'
      });
    }
  }
);

module.exports = router;