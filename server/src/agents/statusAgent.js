import { SimulatedDepartmentAdapter } from '../workflow/SimulatedDepartmentAdapter.js';
import { HttpDepartmentAdapter } from '../workflow/HttpDepartmentAdapter.js';
import { env } from '../config/env.js';

const defaultAdapter = env.DEPARTMENT_API_URL
  ? new HttpDepartmentAdapter(env.DEPARTMENT_API_URL)
  : new SimulatedDepartmentAdapter();

/**
 * Status Tracking Agent interfaces with municipal department systems
 * to poll and advance issue statuses according to SLA timelines.
 */
export async function runStatusAgent(issue, adapter = defaultAdapter) {
  const statusUpdate = await adapter.fetchStatus(issue);
  return statusUpdate;
}
