const cron = require('node-cron');
const {publish} = require('../utils/eventBus');
require('dotenv').config();

cron.schedule('0 * * * *', async () => {
  await publish('scheduler_hourly', {timestamp: new Date().toISOString()});
  console.log('Scheduler event published at', new Date().toISOString());
});

console.log('Scheduler service started, waiting for cron jobs...');
