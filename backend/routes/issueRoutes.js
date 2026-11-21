const express = require('express');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Require JWT authentication for all issue endpoints
router.use(authenticateToken);

const ALLOWED_STATUSES = ['To Do', 'In Progress', 'Done'];
const ALLOWED_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

/**
 * Normalizes an issue ID from "BUG-12" or "12" to positive integer 12.
 */
function parseIssueId(rawId) {
  if (!rawId) return null;
  let str = String(rawId).trim();
  if (str.toUpperCase().startsWith('BUG-')) {
    str = str.substring(4);
  }
  const num = parseInt(str, 10);
  return isNaN(num) || num <= 0 ? null : num;
}

/**
 * Normalizes status strings (e.g. "Open" -> "To Do").
 */
function normalizeStatus(status) {
  if (!status || typeof status !== 'string') return null;
  const trimmed = status.trim();
  if (trimmed.toLowerCase() === 'open') return 'To Do';
  return trimmed;
}

/**
 * Helper to format an issue database row into standard API issue object.
 */
function formatIssueRow(row) {
  const assigneeInitials = row.assignee_name
    ? row.assignee_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'U';

  return {
    id: `BUG-${row.id}`,
    numericId: row.id,
    title: row.title,
    description: row.description || '',
    status: row.status,
    priority: row.priority,
    projectId: row.project_id,
    project: row.project_name || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    assignee: row.assignee_id
      ? {
          id: row.assignee_id,
          name: row.assignee_name,
          email: row.assignee_email,
          initials: assigneeInitials,
        }
      : null,
    reporter: {
      id: row.reporter_id,
      name: row.reporter_name,
      email: row.reporter_email,
    },
  };
}

/**
 * Verifies if a user is authorized for a given project.
 * Returns { authorized: boolean, projectExists: boolean }
 */
async function checkProjectAuthorization(projectId, userId, userRole) {
  const checkQuery = `
    SELECT p.id, p.owner_id
    FROM projects p
    WHERE p.id = $1;
  `;
  const res = await pool.query(checkQuery, [projectId]);
  if (res.rows.length === 0) {
    return { authorized: false, projectExists: false };
  }

  if (userRole === 'admin') {
    return { authorized: true, projectExists: true };
  }

  const project = res.rows[0];
  if (project.owner_id === userId) {
    return { authorized: true, projectExists: true };
  }

  const memberQuery = `
    SELECT 1 FROM project_members
    WHERE project_id = $1 AND user_id = $2;
  `;
  const memberRes = await pool.query(memberQuery, [projectId, userId]);
  return {
    authorized: memberRes.rows.length > 0,
    projectExists: true,
  };
}

/**
 * Verifies if an assignee is an authorized member/owner of the project.
 */
async function checkAssigneeAuthorized(projectId, assigneeId) {
  const checkQuery = `
    SELECT 1 FROM users u
    WHERE u.id = $1 AND (
      u.role = 'admin'
      OR EXISTS (SELECT 1 FROM projects p WHERE p.id = $2 AND p.owner_id = u.id)
      OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = $2 AND pm.user_id = u.id)
    );
  `;
  const res = await pool.query(checkQuery, [assigneeId, projectId]);
  return res.rows.length > 0;
}

/**
 * GET /api/issues
 * Lists issues authorized for the current user.
 * Supports filters: projectId, assignedToMe, status, priority, search.
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const userRole = req.user?.role || '';
    const { projectId, assignedToMe, status, priority, search } = req.query;

    const conditions = [
      `(
        p.owner_id = $1 
        OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = $1)
        OR $2 = 'admin'
      )`,
    ];
    const params = [userId, userRole];
    let paramIndex = 3;

    if (projectId) {
      const pid = parseInt(projectId, 10);
      if (!isNaN(pid) && pid > 0) {
        conditions.push(`i.project_id = $${paramIndex}`);
        params.push(pid);
        paramIndex++;
      }
    }

    if (assignedToMe === 'true' || assignedToMe === true) {
      conditions.push(`i.assignee_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    }

    if (status) {
      const normStatus = normalizeStatus(status);
      if (ALLOWED_STATUSES.includes(normStatus)) {
        conditions.push(`i.status = $${paramIndex}`);
        params.push(normStatus);
        paramIndex++;
      }
    }

    if (priority && ALLOWED_PRIORITIES.includes(priority)) {
      conditions.push(`i.priority = $${paramIndex}`);
      params.push(priority);
      paramIndex++;
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const term = `%${search.trim().toLowerCase()}%`;
      conditions.push(`(LOWER(i.title) LIKE $${paramIndex} OR LOWER(COALESCE(i.description, '')) LIKE $${paramIndex} OR CAST(i.id AS TEXT) LIKE $${paramIndex})`);
      params.push(term);
      paramIndex++;
    }

    const query = `
      SELECT 
        i.id,
        i.project_id,
        i.title,
        i.description,
        i.status,
        i.priority,
        i.assignee_id,
        i.reporter_id,
        i.created_at,
        i.updated_at,
        p.name AS project_name,
        u_assignee.name AS assignee_name,
        u_assignee.email AS assignee_email,
        u_reporter.name AS reporter_name,
        u_reporter.email AS reporter_email
      FROM issues i
      JOIN projects p ON p.id = i.project_id
      JOIN users u_reporter ON u_reporter.id = i.reporter_id
      LEFT JOIN users u_assignee ON u_assignee.id = i.assignee_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY i.created_at DESC;
    `;

    const result = await pool.query(query, params);
    const issues = result.rows.map(formatIssueRow);

    return res.status(200).json({
      success: true,
      issues,
    });
  } catch (error) {
    console.error('Error fetching issues:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve issues.',
    });
  }
});

/**
 * GET /api/issues/:id
 * Fetches one issue by ID.
 */
router.get('/:id', async (req, res) => {
  try {
    const issueId = parseIssueId(req.params.id);
    if (!issueId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid issue ID format.',
      });
    }

    const userId = req.user?.id || req.user?.userId;
    const userRole = req.user?.role || '';

    const query = `
      SELECT 
        i.id,
        i.project_id,
        i.title,
        i.description,
        i.status,
        i.priority,
        i.assignee_id,
        i.reporter_id,
        i.created_at,
        i.updated_at,
        p.name AS project_name,
        p.owner_id AS project_owner_id,
        u_assignee.name AS assignee_name,
        u_assignee.email AS assignee_email,
        u_reporter.name AS reporter_name,
        u_reporter.email AS reporter_email
      FROM issues i
      JOIN projects p ON p.id = i.project_id
      JOIN users u_reporter ON u_reporter.id = i.reporter_id
      LEFT JOIN users u_assignee ON u_assignee.id = i.assignee_id
      WHERE i.id = $1;
    `;

    const result = await pool.query(query, [issueId]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found.',
      });
    }

    const row = result.rows[0];

    // Check authorization for issue's project
    const authCheck = await checkProjectAuthorization(row.project_id, userId, userRole);
    if (!authCheck.authorized) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this issue.',
      });
    }

    return res.status(200).json({
      success: true,
      issue: formatIssueRow(row),
    });
  } catch (error) {
    console.error('Error fetching issue detail:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve issue details.',
    });
  }
});

/**
 * POST /api/issues
 * Creates a new issue in an authorized project.
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const userRole = req.user?.role || '';
    const { projectId, title, description, priority, status, assigneeId } = req.body;

    // Validate title
    if (!title || typeof title !== 'string' || title.trim().length < 2 || title.trim().length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Issue title is required and must be between 2 and 200 characters.',
      });
    }

    // Validate projectId
    const pid = parseInt(projectId, 10);
    if (isNaN(pid) || pid <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid project ID is required.',
      });
    }

    // Check project exists and user authorization
    const authCheck = await checkProjectAuthorization(pid, userId, userRole);
    if (!authCheck.projectExists) {
      return res.status(404).json({
        success: false,
        message: 'Specified project does not exist.',
      });
    }
    if (!authCheck.authorized) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to create issues in this project.',
      });
    }

    // Validate status
    const normStatus = normalizeStatus(status) || 'To Do';
    if (!ALLOWED_STATUSES.includes(normStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}`,
      });
    }

    // Validate priority
    const normPriority = priority || 'Medium';
    if (!ALLOWED_PRIORITIES.includes(normPriority)) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority. Allowed values: ${ALLOWED_PRIORITIES.join(', ')}`,
      });
    }

    // Validate description
    let cleanDesc = null;
    if (description !== undefined && description !== null) {
      if (typeof description !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Description must be a string.',
        });
      }
      if (description.length > 5000) {
        return res.status(400).json({
          success: false,
          message: 'Description cannot exceed 5000 characters.',
        });
      }
      cleanDesc = description.trim();
    }

    // Validate assigneeId
    let cleanAssigneeId = null;
    if (assigneeId !== undefined && assigneeId !== null && assigneeId !== '') {
      const parsedAssignee = parseInt(assigneeId, 10);
      if (isNaN(parsedAssignee) || parsedAssignee <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid assignee ID format.',
        });
      }

      const isAssigneeAuth = await checkAssigneeAuthorized(pid, parsedAssignee);
      if (!isAssigneeAuth) {
        return res.status(400).json({
          success: false,
          message: 'Assignee must be an authorized member or owner of the project.',
        });
      }
      cleanAssigneeId = parsedAssignee;
    }

    // Insert issue
    const insertQuery = `
      INSERT INTO issues (project_id, title, description, status, priority, assignee_id, reporter_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id;
    `;
    const insertRes = await pool.query(insertQuery, [
      pid,
      title.trim(),
      cleanDesc,
      normStatus,
      normPriority,
      cleanAssigneeId,
      userId,
    ]);

    const newIssueId = insertRes.rows[0].id;

    // Fetch the newly created issue with project, assignee, and reporter details
    const fetchQuery = `
      SELECT 
        i.id,
        i.project_id,
        i.title,
        i.description,
        i.status,
        i.priority,
        i.assignee_id,
        i.reporter_id,
        i.created_at,
        i.updated_at,
        p.name AS project_name,
        u_assignee.name AS assignee_name,
        u_assignee.email AS assignee_email,
        u_reporter.name AS reporter_name,
        u_reporter.email AS reporter_email
      FROM issues i
      JOIN projects p ON p.id = i.project_id
      JOIN users u_reporter ON u_reporter.id = i.reporter_id
      LEFT JOIN users u_assignee ON u_assignee.id = i.assignee_id
      WHERE i.id = $1;
    `;
    const createdRes = await pool.query(fetchQuery, [newIssueId]);
    const issue = formatIssueRow(createdRes.rows[0]);

    return res.status(201).json({
      success: true,
      message: 'Issue created successfully.',
      issue,
    });
  } catch (error) {
    console.error('Error creating issue:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to create issue. Please try again.',
    });
  }
});

/**
 * PATCH /api/issues/:id
 * Updates issue permitted fields: status, priority, title, description, assigneeId.
 */
router.patch('/:id', async (req, res) => {
  try {
    const issueId = parseIssueId(req.params.id);
    if (!issueId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid issue ID format.',
      });
    }

    const userId = req.user?.id || req.user?.userId;
    const userRole = req.user?.role || '';

    // Fetch current issue to check existence and project
    const currentRes = await pool.query('SELECT * FROM issues WHERE id = $1', [issueId]);
    if (currentRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found.',
      });
    }

    const currentIssue = currentRes.rows[0];

    // Check project authorization
    const authCheck = await checkProjectAuthorization(currentIssue.project_id, userId, userRole);
    if (!authCheck.authorized) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this issue.',
      });
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    // Status update
    if (req.body.status !== undefined) {
      const normStatus = normalizeStatus(req.body.status);
      if (!ALLOWED_STATUSES.includes(normStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}`,
        });
      }
      updates.push(`status = $${paramIndex}`);
      params.push(normStatus);
      paramIndex++;
    }

    // Priority update
    if (req.body.priority !== undefined) {
      if (!ALLOWED_PRIORITIES.includes(req.body.priority)) {
        return res.status(400).json({
          success: false,
          message: `Invalid priority. Allowed values: ${ALLOWED_PRIORITIES.join(', ')}`,
        });
      }
      updates.push(`priority = $${paramIndex}`);
      params.push(req.body.priority);
      paramIndex++;
    }

    // Title update
    if (req.body.title !== undefined) {
      if (
        typeof req.body.title !== 'string' ||
        req.body.title.trim().length < 2 ||
        req.body.title.trim().length > 200
      ) {
        return res.status(400).json({
          success: false,
          message: 'Title must be between 2 and 200 characters.',
        });
      }
      updates.push(`title = $${paramIndex}`);
      params.push(req.body.title.trim());
      paramIndex++;
    }

    // Description update
    if (req.body.description !== undefined) {
      if (req.body.description === null || req.body.description === '') {
        updates.push(`description = NULL`);
      } else {
        if (typeof req.body.description !== 'string' || req.body.description.length > 5000) {
          return res.status(400).json({
            success: false,
            message: 'Description must be a string up to 5000 characters.',
          });
        }
        updates.push(`description = $${paramIndex}`);
        params.push(req.body.description.trim());
        paramIndex++;
      }
    }

    // Assignee update
    if (req.body.assigneeId !== undefined) {
      if (req.body.assigneeId === null || req.body.assigneeId === '' || req.body.assigneeId === 0) {
        updates.push(`assignee_id = NULL`);
      } else {
        const parsedAssignee = parseInt(req.body.assigneeId, 10);
        if (isNaN(parsedAssignee) || parsedAssignee <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid assignee ID format.',
          });
        }
        const isAssigneeAuth = await checkAssigneeAuthorized(currentIssue.project_id, parsedAssignee);
        if (!isAssigneeAuth) {
          return res.status(400).json({
            success: false,
            message: 'Assignee must be an authorized member or owner of the project.',
          });
        }
        updates.push(`assignee_id = $${paramIndex}`);
        params.push(parsedAssignee);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided to update.',
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    params.push(issueId);
    const updateQuery = `
      UPDATE issues
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id;
    `;

    await pool.query(updateQuery, params);

    // Fetch updated issue
    const fetchQuery = `
      SELECT 
        i.id,
        i.project_id,
        i.title,
        i.description,
        i.status,
        i.priority,
        i.assignee_id,
        i.reporter_id,
        i.created_at,
        i.updated_at,
        p.name AS project_name,
        u_assignee.name AS assignee_name,
        u_assignee.email AS assignee_email,
        u_reporter.name AS reporter_name,
        u_reporter.email AS reporter_email
      FROM issues i
      JOIN projects p ON p.id = i.project_id
      JOIN users u_reporter ON u_reporter.id = i.reporter_id
      LEFT JOIN users u_assignee ON u_assignee.id = i.assignee_id
      WHERE i.id = $1;
    `;
    const updatedRes = await pool.query(fetchQuery, [issueId]);
    const issue = formatIssueRow(updatedRes.rows[0]);

    return res.status(200).json({
      success: true,
      message: 'Issue updated successfully.',
      issue,
    });
  } catch (error) {
    console.error('Error updating issue:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update issue.',
    });
  }
});

/**
 * GET /api/issues/:id/comments
 * Fetches all comments for an authorized issue.
 */
router.get('/:id/comments', async (req, res) => {
  try {
    const issueId = parseIssueId(req.params.id);
    if (!issueId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid issue ID format.',
      });
    }

    const userId = req.user?.id || req.user?.userId;
    const userRole = req.user?.role || '';

    // Verify issue existence and project authorization
    const issueRes = await pool.query('SELECT project_id FROM issues WHERE id = $1', [issueId]);
    if (issueRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found.',
      });
    }

    const authCheck = await checkProjectAuthorization(issueRes.rows[0].project_id, userId, userRole);
    if (!authCheck.authorized) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view comments for this issue.',
      });
    }

    const query = `
      SELECT 
        c.id,
        c.issue_id,
        c.user_id,
        c.content,
        c.created_at,
        u.name AS user_name,
        u.email AS user_email
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.issue_id = $1
      ORDER BY c.created_at ASC;
    `;

    const result = await pool.query(query, [issueId]);

    const comments = result.rows.map((row) => ({
      id: row.id,
      issueId: `BUG-${row.issue_id}`,
      text: row.content,
      content: row.content,
      createdAt: row.created_at,
      author: {
        id: row.user_id,
        name: row.user_name,
        email: row.user_email,
        initials: row.user_name
          ? row.user_name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase()
          : 'U',
      },
    }));

    return res.status(200).json({
      success: true,
      comments,
    });
  } catch (error) {
    console.error('Error fetching comments:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve comments.',
    });
  }
});

/**
 * POST /api/issues/:id/comments
 * Adds a comment to an authorized issue.
 */
router.post('/:id/comments', async (req, res) => {
  try {
    const issueId = parseIssueId(req.params.id);
    if (!issueId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid issue ID format.',
      });
    }

    const userId = req.user?.id || req.user?.userId;
    const userRole = req.user?.role || '';
    const content = req.body.content || req.body.text;

    if (!content || typeof content !== 'string' || content.trim().length === 0 || content.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required and must not exceed 2000 characters.',
      });
    }

    // Verify issue existence and authorization
    const issueRes = await pool.query('SELECT project_id FROM issues WHERE id = $1', [issueId]);
    if (issueRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found.',
      });
    }

    const authCheck = await checkProjectAuthorization(issueRes.rows[0].project_id, userId, userRole);
    if (!authCheck.authorized) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to comment on this issue.',
      });
    }

    const insertQuery = `
      INSERT INTO comments (issue_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING id, created_at;
    `;
    const insertRes = await pool.query(insertQuery, [issueId, userId, content.trim()]);
    const newComment = insertRes.rows[0];

    // Fetch user details for comment response
    const userRes = await pool.query('SELECT name, email FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];

    const comment = {
      id: newComment.id,
      issueId: `BUG-${issueId}`,
      text: content.trim(),
      content: content.trim(),
      createdAt: newComment.created_at,
      author: {
        id: userId,
        name: user ? user.name : 'User',
        email: user ? user.email : '',
        initials: user && user.name
          ? user.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase()
          : 'U',
      },
    };

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully.',
      comment,
    });
  } catch (error) {
    console.error('Error posting comment:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to post comment.',
    });
  }
});

module.exports = router;
