const amqp = require('amqplib');

let channel = null;

async function init() {
  const conn = await amqp.connect(process.env.EVENT_BUS_URL || 'amqp://guest:guest@eventbus:5672/');
  channel = await conn.createChannel();
}

async function publish(queue, msg) {
  if (!channel) await init();
  await channel.assertQueue(queue, { durable: true });
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(msg)), { persistent: true });
}

async function consume(queue, handler) {
  if (!channel) await init();
  await channel.assertQueue(queue, { durable: true });
  channel.consume(queue, async (msg) => {
    if (msg !== null) {
      const content = JSON.parse(msg.content.toString());
      await handler(content);
      channel.ack(msg);
    }
  });
}

module.exports = { publish, consume, init };
