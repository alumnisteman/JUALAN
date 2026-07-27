const axios = require('axios');

/**
 * Simpan notifikasi ke database dan kirim ke channel yang dipilih.
 * @param {string|ObjectId} userId
 * @param {Object} notification - { type, title, message, data }
 * @param {string[]} channels - ['push','email','whatsapp','telegram']
 * @param {Object} userSettings - notificationSettings dari User model
 * @param {Object} [io] - Socket.io instance (opsional, untuk push real-time)
 */
async function sendNotification(userId, notification, channels = ['push'], userSettings = {}, io = null) {
  try {
    const Notification = require('../models/Notification');
    const results = { success: [], failed: [] };

    // Simpan ke database jika belum (bisa juga dipanggil dari route yang sudah save)
    let savedNotif = notification;
    if (!notification._id) {
      savedNotif = await Notification.create({
        userId,
        type: notification.type || 'system',
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        channels
      });
    }

    if (channels.includes('push')) {
      // Push ditangani via WebSocket di route, atau via io yang dikirim ke sini
      if (io) {
        io.to(`user-${userId}`).emit('notification:new', savedNotif);
      }
      results.success.push('push');
    }

    if (channels.includes('email') && userSettings?.email) {
      try {
        await sendEmail(userId, savedNotif);
        results.success.push('email');
      } catch (error) {
        results.failed.push({ channel: 'email', error: error.message });
      }
    }

    if (channels.includes('whatsapp') && userSettings?.whatsapp) {
      try {
        await sendWhatsApp(userId, savedNotif);
        results.success.push('whatsapp');
      } catch (error) {
        results.failed.push({ channel: 'whatsapp', error: error.message });
      }
    }

    if (channels.includes('telegram') && userSettings?.telegram) {
      try {
        await sendTelegram(userId, savedNotif);
        results.success.push('telegram');
      } catch (error) {
        results.failed.push({ channel: 'telegram', error: error.message });
      }
    }

    return { notification: savedNotif, results };
  } catch (error) {
    console.error('Notification send error:', error);
    throw error;
  }
}

/**
 * Kirim notifikasi ke banyak user sekaligus.
 */
async function sendBulkNotification(userIds, notification, channels = ['push'], io = null) {
  try {
    const User = require('../models/User');
    const results = { total: userIds.length, sent: 0, failed: 0 };

    for (const userId of userIds) {
      try {
        const user = await User.findById(userId).select('notificationSettings');
        await sendNotification(userId, notification, channels, user.notificationSettings, io);
        results.sent++;
      } catch (error) {
        results.failed++;
        console.error(`Failed to send notification to user ${userId}:`, error.message);
      }
    }

    return results;
  } catch (error) {
    console.error('Bulk notification error:', error);
    throw error;
  }
}

// ─── Channel Implementations ─────────────────────────────────────────────────

/**
 * Kirim email menggunakan Nodemailer (SMTP).
 * Requires: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS env vars.
 */
async function sendEmail(userId, notification) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log(`[Email] SMTP not configured – skip email to user ${userId}`);
    return;
  }
  try {
    const nodemailer = require('nodemailer');
    const User = require('../models/User');
    const user = await User.findById(userId).select('email name');

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: `"ResellerHub AI" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: notification.title,
      text: notification.message,
      html: `<p>${notification.message}</p>`
    });

    console.log(`[Email] Sent to ${user.email}: ${notification.title}`);
  } catch (error) {
    console.error('[Email] Send error:', error.message);
    throw error;
  }
}

/**
 * Kirim pesan WhatsApp menggunakan WhatsApp Business API (Cloud API).
 * Requires: WHATSAPP_API_KEY (token), WHATSAPP_PHONE_NUMBER_ID env vars.
 */
async function sendWhatsApp(userId, notification) {
  if (!process.env.WHATSAPP_API_KEY || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
    console.log(`[WhatsApp] API not configured – skip WhatsApp to user ${userId}`);
    return;
  }
  try {
    const User = require('../models/User');
    const user = await User.findById(userId).select('phone');

    if (!user.phone) {
      console.log(`[WhatsApp] User ${userId} has no phone number`);
      return;
    }

    // Format phone number: remove +, spaces, etc.
    const phone = user.phone.replace(/\D/g, '');

    await axios.post(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: `*${notification.title}*\n\n${notification.message}` }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`[WhatsApp] Sent to ${phone}: ${notification.title}`);
  } catch (error) {
    console.error('[WhatsApp] Send error:', error.message);
    throw error;
  }
}

/**
 * Kirim pesan Telegram menggunakan Telegram Bot API.
 * Requires: TELEGRAM_BOT_TOKEN env var.
 * User harus menyimpan chat_id mereka (disimpan di User model jika ada).
 */
async function sendTelegram(userId, notification) {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.log(`[Telegram] Bot token not configured – skip Telegram to user ${userId}`);
    return;
  }
  try {
    const User = require('../models/User');
    const user = await User.findById(userId).select('telegramChatId');

    if (!user.telegramChatId) {
      console.log(`[Telegram] User ${userId} has no Telegram chat ID`);
      return;
    }

    const text = `*${notification.title}*\n\n${notification.message}`;

    await axios.post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: user.telegramChatId,
        text,
        parse_mode: 'Markdown'
      }
    );

    console.log(`[Telegram] Sent to chat ${user.telegramChatId}: ${notification.title}`);
  } catch (error) {
    console.error('[Telegram] Send error:', error.message);
    throw error;
  }
}

module.exports = {
  sendNotification,
  sendBulkNotification
};
