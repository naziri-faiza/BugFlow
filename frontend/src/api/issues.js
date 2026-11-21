import { apiClient } from './client';

/**
 * Fetches all authorized issues with optional query filters.
 * @param {Object} [params] - Optional filters: { projectId, assignedToMe, status, priority, search }
 */
export async function fetchIssues(params = {}) {
  const response = await apiClient.get('/api/issues', { params });
  return response.data;
}

/**
 * Fetches a single authorized issue by ID.
 * Accepts numeric ID or "BUG-X" string.
 * @param {string|number} id
 */
export async function fetchIssueById(id) {
  const response = await apiClient.get(`/api/issues/${id}`);
  return response.data;
}

/**
 * Creates a new issue in an authorized project.
 * @param {Object} issueData - { projectId, title, description, priority, status, assigneeId }
 */
export async function createIssue(issueData) {
  const response = await apiClient.post('/api/issues', issueData);
  return response.data;
}

/**
 * Updates permitted fields of an issue.
 * @param {string|number} id
 * @param {Object} updates - { status, priority, title, description, assigneeId }
 */
export async function updateIssue(id, updates) {
  const response = await apiClient.patch(`/api/issues/${id}`, updates);
  return response.data;
}

/**
 * Fetches comments for an authorized issue.
 * @param {string|number} issueId
 */
export async function fetchIssueComments(issueId) {
  const response = await apiClient.get(`/api/issues/${issueId}/comments`);
  return response.data;
}

/**
 * Adds a new comment to an authorized issue.
 * @param {string|number} issueId
 * @param {Object} commentData - { content }
 */
export async function createIssueComment(issueId, commentData) {
  const response = await apiClient.post(`/api/issues/${issueId}/comments`, commentData);
  return response.data;
}
