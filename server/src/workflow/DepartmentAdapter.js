/**
 * Base DepartmentAdapter class.
 * Provides the pluggable interface for municipal department workflow integrations.
 */
export class DepartmentAdapter {
  /**
   * Submits a structured complaint to the department system.
   * @param {object} issue 
   * @returns {Promise<{ externalRef: string }>}
   */
  async submitComplaint(issue) {
    throw new Error('DepartmentAdapter.submitComplaint() must be implemented by subclass');
  }

  /**
   * Fetches latest external status of an issue.
   * @param {object} issue 
   * @returns {Promise<{ status: string, note: string, at: string } | null>}
   */
  async fetchStatus(issue) {
    throw new Error('DepartmentAdapter.fetchStatus() must be implemented by subclass');
  }
}
