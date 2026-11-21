const express = require('express');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// All project routes require valid JWT authentication
router.use(authenticateToken);

/**
 * GET /api/projects
 * Returns all projects that the authenticated user owns or is a member of.
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const userRole = req.user?.role || '';

    const query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.owner_id,
        p.created_at,
        u.name AS owner_name,
        u.email AS owner_email,
        CASE 
          WHEN p.owner_id = $1 THEN 'owner'
          ELSE COALESCE(pm_user.role, 'member')
        END AS user_role,
        (SELECT COUNT(*)::int FROM issues WHERE project_id = p.id) AS issue_count,
        (SELECT COUNT(*)::int FROM issues WHERE project_id = p.id AND (status = 'Done' OR status = 'Resolved')) AS done_count,
        (SELECT COUNT(*)::int FROM project_members WHERE project_id = p.id) AS member_count
      FROM projects p
      JOIN users u ON u.id = p.owner_id
      LEFT JOIN project_members pm_user ON pm_user.project_id = p.id AND pm_user.user_id = $1
      WHERE p.owner_id = $1 
         OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = $1)
         OR $2 = 'admin'
      ORDER BY p.created_at DESC;
    `;

    const result = await pool.query(query, [userId, userRole]);

    const projects = result.rows.map((row) => {
      const issueCount = row.issue_count || 0;
      const doneCount = row.done_count || 0;
      const progress = issueCount > 0 ? Math.round((doneCount / issueCount) * 100) : 0;
      const ownerInitials = row.owner_name
        ? row.owner_name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase()
        : 'U';

      return {
        id: row.id,
        name: row.name,
        description: row.description || '',
        ownerId: row.owner_id,
        createdAt: row.created_at,
        status: 'Active',
        issueCount,
        progress,
        userRole: row.user_role,
        memberCount: row.member_count || 1,
        lead: {
          id: row.owner_id,
          name: row.owner_name,
          email: row.owner_email,
          initials: ownerInitials,
        },
      };
    });

    return res.status(200).json({
      success: true,
      projects,
    });
  } catch (error) {
    console.error('Error fetching projects:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve projects.',
    });
  }
});

/**
 * GET /api/projects/:id
 * Returns a single project by ID with members and issues if user is authorized.
 */
router.get('/:id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId) || projectId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format.',
      });
    }

    const userId = req.user?.id || req.user?.userId;
    const userRole = req.user?.role || '';

    // Fetch project and verify ownership or membership
    const projectQuery = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.owner_id,
        p.created_at,
        u.name AS owner_name,
        u.email AS owner_email,
        CASE 
          WHEN p.owner_id = $1 THEN 'owner'
          ELSE COALESCE(pm_user.role, 'member')
        END AS user_role,
        (SELECT COUNT(*)::int FROM issues WHERE project_id = p.id) AS issue_count,
        (SELECT COUNT(*)::int FROM issues WHERE project_id = p.id AND (status = 'Done' OR status = 'Resolved')) AS done_count,
        (SELECT COUNT(*)::int FROM project_members WHERE project_id = p.id) AS member_count
      FROM projects p
      JOIN users u ON u.id = p.owner_id
      LEFT JOIN project_members pm_user ON pm_user.project_id = p.id AND pm_user.user_id = $1
      WHERE p.id = $2;
    `;

    const projectResult = await pool.query(projectQuery, [userId, projectId]);

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    const row = projectResult.rows[0];

    // Check authorization: user must be owner, project member, or admin
    const isOwner = row.owner_id === userId;
    const isMember = row.user_role !== 'member' || isOwner;
    const isAdmin = userRole === 'admin';

    // Verify if explicit member record exists if not owner or admin
    if (!isOwner && !isAdmin) {
      const memberCheck = await pool.query(
        'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, userId]
      );
      if (memberCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not a member of this project.',
        });
      }
    }

    // Fetch members
    const membersQuery = `
      SELECT u.id, u.name, u.email, pm.role
      FROM project_members pm
      JOIN users u ON u.id = pm.user_id
      WHERE pm.project_id = $1
      ORDER BY u.name;
    `;
    const membersResult = await pool.query(membersQuery, [projectId]);

    // Fetch issues
    const issuesQuery = `
      SELECT 
        i.id,
        i.title,
        i.description,
        i.status,
        i.priority,
        i.created_at,
        i.assignee_id,
        u.name AS assignee_name,
        u.email AS assignee_email
      FROM issues i
      LEFT JOIN users u ON u.id = i.assignee_id
      WHERE i.project_id = $1
      ORDER BY i.created_at DESC;
    `;
    const issuesResult = await pool.query(issuesQuery, [projectId]);

    const issueCount = row.issue_count || 0;
    const doneCount = row.done_count || 0;
    const progress = issueCount > 0 ? Math.round((doneCount / issueCount) * 100) : 0;
    const ownerInitials = row.owner_name
      ? row.owner_name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase()
      : 'U';

    const project = {
      id: row.id,
      name: row.name,
      description: row.description || '',
      ownerId: row.owner_id,
      createdAt: row.created_at,
      status: 'Active',
      key: `PRJ-${row.id}`,
      issueCount,
      progress,
      userRole: row.user_role,
      memberCount: membersResult.rows.length,
      lead: {
        id: row.owner_id,
        name: row.owner_name,
        email: row.owner_email,
        initials: ownerInitials,
      },
      members: membersResult.rows.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
        initials: m.name
          ? m.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase()
          : 'U',
      })),
      issues: issuesResult.rows.map((i) => ({
        id: `BUG-${i.id}`,
        numericId: i.id,
        title: i.title,
        description: i.description || '',
        status: i.status,
        priority: i.priority,
        createdAt: i.created_at,
        assignee: i.assignee_id
          ? {
              id: i.assignee_id,
              name: i.assignee_name,
              email: i.assignee_email,
            }
          : null,
      })),
    };

    return res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    console.error('Error fetching project details:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve project details.',
    });
  }
});

/**
 * POST /api/projects
 * Creates a new project owned by the authenticated user and registers owner membership.
 */
router.post('/', async (req, res) => {
  const { name, description } = req.body;

  if (
    !name ||
    typeof name !== 'string' ||
    name.trim().length < 2 ||
    name.trim().length > 100
  ) {
    return res.status(400).json({
      success: false,
      message: 'Project name is required and must be between 2 and 100 characters.',
    });
  }

  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Project description must be a text string.',
      });
    }
    if (description.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Project description cannot exceed 1000 characters.',
      });
    }
  }

  const cleanName = name.trim();
  const cleanDescription = description ? description.trim() : null;
  const userId = req.user?.id || req.user?.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Invalid user authentication context.',
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Insert project
    const projectInsertQuery = `
      INSERT INTO projects (name, description, owner_id)
      VALUES ($1, $2, $3)
      RETURNING id, name, description, owner_id, created_at;
    `;
    const projectRes = await client.query(projectInsertQuery, [
      cleanName,
      cleanDescription,
      userId,
    ]);
    const newProject = projectRes.rows[0];

    // Add creator to project_members as owner
    const memberInsertQuery = `
      INSERT INTO project_members (project_id, user_id, role)
      VALUES ($1, $2, 'owner')
      ON CONFLICT (project_id, user_id) DO NOTHING;
    `;
    await client.query(memberInsertQuery, [newProject.id, userId]);

    await client.query('COMMIT');

    // Fetch user details for clean lead object
    const userRes = await client.query(
      'SELECT name, email FROM users WHERE id = $1',
      [userId]
    );
    const userRow = userRes.rows[0] || {};
    const initials = userRow.name
      ? userRow.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase()
      : 'U';

    return res.status(201).json({
      success: true,
      message: 'Project created successfully!',
      project: {
        id: newProject.id,
        name: newProject.name,
        description: newProject.description || '',
        ownerId: newProject.owner_id,
        createdAt: newProject.created_at,
        status: 'Active',
        key: `PRJ-${newProject.id}`,
        issueCount: 0,
        progress: 0,
        userRole: 'owner',
        memberCount: 1,
        lead: {
          id: userId,
          name: userRow.name,
          email: userRow.email,
          initials,
        },
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating project:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to create project. Please try again.',
    });
  } finally {
    client.release();
  }
});

module.exports = router;
