require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sequelize = require('./config/db');
const tenantRoutes = require('./routes/tenantRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const metricsRoutes = require('./routes/metricsRoutes');
const authRoutes = require('./routes/authRoutes');
const exportRoutes = require('./routes/exportRoutes');
const shopifyRoutes = require('./routes/shopifyRoutes');

const app = express();
const PORT = process.env.PORT || 4000;
// capture raw body for webhook signature verification
app.use(bodyParser.json({
  limit: '5mb',
  verify: (req, res, buf, encoding) => {
    req.rawBody = buf;
  }
}));
app.use(cors());
// regular urlencoded if needed
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/shopify', shopifyRoutes);
app.use('/api/orders', require('./routes/ordersRoutes'));
app.get('/', (req, res) => res.send('Xeno FDE - Backend up'));
(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');
    await sequelize.sync({ alter: true });
    const server = app.listen(PORT, () => {
      console.log(`Server listening on ${PORT}`);
    });
    process.on('SIGINT', () => {
      console.log('SIGINT received — shutting down');
      server.close(() => process.exit(0));
    });
    process.on('uncaughtException', (err) => {
      console.error('Uncaught exception:', err);
    });
    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled rejection:', reason);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();

