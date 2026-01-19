require('dotenv').config();

const express = require('express');
const cors = require('cors');

const {sequelize} = require('./config/database');
require('./models'); // loads associations

// Routes
const authRoutes = require('./routes/auth.routes');

// Middlewares
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

/* ======================
   GLOBAL MIDDLEWARES
====================== */
app.use(cors());
app.use(express.json());

/* ======================
   ROUTES
====================== */
app.use('/api/auth', authRoutes);

/* ======================
   ERROR HANDLER
====================== */
app.use(errorMiddleware);

/* ======================
   BOOTSTRAP SERVER
====================== */
const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    await sequelize.sync(); // no force
    console.log('Database synced');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
})();
