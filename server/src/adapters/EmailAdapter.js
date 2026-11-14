/**
 * Abstract Base Class for Email Adapters.
 */
export class EmailAdapter {
  /**
   * Sends an email notification.
   * @param {{ to: string, subject: string, text: string, html?: string }} options
   * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
   */
  async send(options) {
    throw new Error('EmailAdapter.send() must be implemented by subclass');
  }
}
