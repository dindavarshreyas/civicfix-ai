import { EmailAdapter } from './EmailAdapter.js';
import { logger } from '../utils/logger.js';

export class ConsoleEmailAdapter extends EmailAdapter {
  async send({ to, subject, text, html }) {
    logger.info(
      {
        to,
        subject,
        preview: text?.slice(0, 120),
      },
      '📧 [MOCK EMAIL DELIVERED via ConsoleEmailAdapter]'
    );
    return {
      success: true,
      messageId: `console-msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };
  }
}
