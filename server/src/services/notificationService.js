import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { ConsoleEmailAdapter } from '../adapters/ConsoleEmailAdapter.js';
import { ResendEmailAdapter } from '../adapters/ResendEmailAdapter.js';
import { logger } from '../utils/logger.js';

const emailAdapter =
  env.EMAIL_ADAPTER === 'resend' ? new ResendEmailAdapter() : new ConsoleEmailAdapter();

/**
 * Creates in-app notifications and sends emails for linked reporters of an issue.
 */
export async function notifyReportersForIssue({
  issueId,
  title,
  message,
  emailSubject,
  emailBody,
}) {
  try {
    // 1. Fetch all reports linked to this issue along with their user profile
    const { data: reports, error } = await supabaseAdmin
      .from('reports')
      .select('id, user_id, profiles(id, full_name, email_notifications)')
      .eq('issue_id', issueId);

    if (error) {
      logger.error({ error: error.message, issueId }, 'Failed to fetch linked reporters for notification');
      return;
    }

    if (!reports || reports.length === 0) {
      return;
    }

    // Deduplicate by user_id
    const userMap = new Map();
    for (const report of reports) {
      if (!userMap.has(report.user_id)) {
        userMap.set(report.user_id, {
          userId: report.user_id,
          reportId: report.id,
          profile: report.profiles,
        });
      }
    }

    const inAppRows = [];

    for (const { userId, reportId, profile } of userMap.values()) {
      inAppRows.push({
        user_id: userId,
        issue_id: issueId,
        report_id: reportId,
        channel: 'in_app',
        title,
        message,
        is_read: false,
        delivered_at: new Date().toISOString(),
      });

      // Send email if user profile has email_notifications true
      if (profile?.email_notifications !== false) {
        // Query user email via Supabase Admin Auth
        supabaseAdmin.auth.admin.getUserById(userId).then(({ data: userData }) => {
          if (userData?.user?.email) {
            const recipientName = profile?.full_name || 'Citizen';
            const personalizedBody = `Dear ${recipientName},\n\n${emailBody}`;
            emailAdapter.send({
              to: userData.user.email,
              subject: emailSubject,
              text: personalizedBody,
            }).catch((err) => {
              logger.warn({ error: err.message, userId }, 'Email notification delivery failed');
            });
          }
        }).catch(() => {});
      }
    }

    // Insert all in-app notifications
    if (inAppRows.length > 0) {
      const { error: notifErr } = await supabaseAdmin
        .from('notifications')
        .insert(inAppRows);

      if (notifErr) {
        logger.error({ error: notifErr.message }, 'Failed to insert notifications in database');
      } else {
        logger.info({ issueId, count: inAppRows.length }, 'Dispatched in-app notifications to reporters');
      }
    }
  } catch (err) {
    logger.error({ error: err.message, issueId }, 'Error dispatching issue notifications');
  }
}
