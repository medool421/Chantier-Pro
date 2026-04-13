require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');

const { sequelize } = require('./config/database');
require('./models'); // load models & associations

// Routes
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const reportRoutes = require('./routes/report.routes');
const fileRoutes = require('./routes/file.routes');
const teamRoutes = require('./routes/team.routes');
const testRoutes = require('./routes/test.routes');
const notificationRoutes = require('./routes/notification.routes');
const invitationRoutes = require('./routes/invitation.routes');


// Middlewares
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

/* ======================
   GLOBAL MIDDLEWARES
   ====================== */
   app.use(express.json());
   app.use(cors());

/* ======================
   STATIC FILES (UPLOADS)
====================== */
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/* ======================
   ROUTES
====================== */
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/test', testRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/invitations', invitationRoutes);


/* ======================
   HEALTH CHECK
====================== */
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Bienvenue sur l'API ChantierPro",
    version: process.env.API_VERSION || 'v1',
    status: 'online',
  });
});

/* ======================
   ERROR HANDLER (LAST)
====================== */
app.use(errorMiddleware);

/* ======================
   SERVER START
====================== */
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  (async () => {
    try {
      await sequelize.authenticate();
      console.log('✅ Database connected');

      await sequelize.sync({ alter: true });
      console.log('✅ Database synced');

      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
      });
    } catch (err) {
      console.error('❌ Startup error:', err);
      process.exit(1);
    }
  })();
}

module.exports = app;