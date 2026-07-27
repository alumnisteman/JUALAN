const axios = require('axios');

// Send notification to user
async function sendNotification(userId, notification, channels, userSettings) {
  try {
    const results = { success: [], failed: [] };

    if (channels.includes('push') && userSettings?.push) {
      // WebSocket push is handled in the route
      results.success.push('push');
    }

    if (channels.includes('email') && userSettings?.email) {
      try {
        await sendEmail(userId, notification);
        results.success.push('email');
      } catch (error) {
        results.failed.push({ channel: 'email', error: error.message });
      }
    }

    if (channels.includes('whatsapp') && userSettings?.whatsapp) {
      try {
        await sendWhatsApp(userId, notification);
        results.success.push('whatsapp');
      } catch (error) {
        results.failed.push({ channel: 'whatsapp', error: error.message });
      }
    }

    if (channels.includes('telegram') && userSettings?.telegram) {
      try {
        await sendTelegram(userId, notification);
        results.success.push('telegram');
      } catch (error) {
        results.failed.push({ channel: 'telegram', error: error.message });
      }
    }

    return results;
  } catch (error) {
    console.error('Notification send error:', error);
    throw error;
  }
}

// Send bulk notification
async function sendBulkNotification(userIds, notification, channels) {
  try {
    const User = require('../models/User');
    const results = { total: userIds.length, sent: 0, failed: 0 };

    for (const userId of userIds) {
      try {
        const user = await User.findById(userId).select('notificationSettings');
        await sendNotification(userId, notification, channels, user.notificationSettings);
        results.sent++;
      } catch (error) {
        results.failed++;
      }
    }

    return results;
  } catch (error) {
    console.error('Bulk notification error:', error);
    throw error;
  }
}

// Send email (placeholder - implement actual email service)
async function sendEmail(userId, notification) {
  console.log(`Sending email to user ${userId}:`, notification);
  // Actual implementation would use nodemailer or similar
  return { success: true };
}

// Send WhatsApp (placeholder - implement actual WhatsApp API)
async function sendWhatsApp(userId, notification) {
  console.log(`Sending WhatsApp to user ${userId}:`, notification);
  // Actual implementation would use WhatsApp Business API
  return { success: true };
}

// Send Telegram (placeholder - implement actual Telegram Bot API)
async function sendTelegram(userId, notification) {
  console.log(`Sending Telegram to user ${userId}:`, notification);
  // Actual implementation would use Telegram Bot API
  return { success: true };
}

module.exports = {
  sendNotification,
  sendBulkNotification
};
