require('dotenv').config();
const express = require('express');
const cors = require('cors');

const eventTypesRoutes = require('./routes/eventTypes.routes.js');
const availabilityRoutes = require('./routes/availability.routes.js');
const publicRoutes = require('./routes/public.routes.js');
const meetingsRoutes = require('./routes/meetings.routes.js');
const errorHandler = require('./middlewares/errorHandler.js');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*' }));
app.use(express.json());

// Routes
app.use('/api/event-types', eventTypesRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/meetings', meetingsRoutes);
app.use('/api/public', publicRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n  ┌────────────────────────────────────────────┐`);
  console.log(`  │  🗓️  Calendly Clone API Server              │`);
  console.log(`  │  Running on http://localhost:${PORT}          │`);
  console.log(`  │  Environment: ${process.env.NODE_ENV || 'development'}                │`);
  console.log(`  └────────────────────────────────────────────┘\n`);
});
