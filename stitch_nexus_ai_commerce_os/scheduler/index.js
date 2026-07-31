const cron = require('node-cron');
const {publish} = require('../utils/eventBus');
require('dotenv').config();
const axios = require('axios'); // untuk memanggil endpoint scrape

cron.schedule('0 * * * *', async () => {
  // Publikasi event internal
  await publish('scheduler_hourly', {timestamp: new Date().toISOString()});
  console.log('Scheduler event published at', new Date().toISOString());

  // Trigger scraping otomatis untuk memperoleh data riil
  try {
    const resp = await axios.post(`${process.env.BASE_URL || 'http://localhost:3000'}/api/marketplace/scrape`);
    console.log('Automated scrape triggered:', resp.data);
  } catch (err) {
    console.error('Error triggering automated scrape:', err.message);
  }
});

console.log('Scheduler service started, waiting for cron jobs...');
