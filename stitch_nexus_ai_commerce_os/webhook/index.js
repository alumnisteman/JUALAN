const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const {publish} = require('../utils/eventBus');

const app = express();
app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
  const payload = req.body;
  await publish('webhook_events', payload);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Webhook service listening on port ${PORT}`));
