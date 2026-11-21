import { apiClient } from './client.js';

/**
 * Fetch all projects the authenticated user can access.
 */
export async function fetchProjects() {
  const response = await apiClient.get('/api/projects');
  return response.data;
}

/**
 * Fetch a single project by ID with members and issues.
 */
export async function fetchProjectById(id) {
  const response = await apiClient.get(`/api/projects/${id}`);
  return response.data;
}

/**
 * Create a new project.
 * Body: { name, description }
 */
export async function createProject({ name, description }) {
  const response = await apiClient.post('/api/projects', {
    name,
    description,
  });
  return response.data;
}
