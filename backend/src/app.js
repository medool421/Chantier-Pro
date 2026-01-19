const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();


// Import des middlewares personnalisés
// const errorMiddleware = require('./middlewares/error.middleware');

// Initialisation de l'application Express
const app = express();

// Import des routes
const routes = require('./routes');
// ============================================
// MIDDLEWARES DE SÉCURITÉ
// ============================================

// Helmet : Sécurise les headers HTTP
// app.use(helmet());

// CORS : Autoriser les requêtes cross-origin
// const corsOptions = {
//   origin: process.env.CORS_ORIGIN || 'http://localhost:19006',
//   credentials: true,
//   optionsSuccessStatus: 200,
// };
// app.use(cors(corsOptions));

// Rate Limiting : Limiter le nombre de requêtes par IP
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requêtes max
//   message: {
//     success: false,
//     message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use('/api/', limiter);

// ============================================
// MIDDLEWARES DE PARSING
// ============================================

// Parser le body en JSON (limite à 10mb)
// app.use(express.json({ limit: '10mb' }));

// // Parser les données URL-encoded
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// MIDDLEWARES DE LOGGING
// ============================================

// // Morgan : Logger les requêtes HTTP (seulement en développement)
// if (process.env.NODE_ENV === 'development') {
//   app.use(morgan('dev'));
// } else {
//   app.use(morgan('combined'));
// }

// ============================================
// MIDDLEWARES D'OPTIMISATION
// ============================================

// Compression : Compresser les réponses HTTP
// app.use(compression());

// ============================================
// ROUTES
// ============================================

// Route de santé (health check)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Routes principales de l'API
app.use(`/api/${process.env.API_VERSION || 'v1'}`, routes);

// Route 404 - Non trouvée
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} non trouvée`,
  });
});

// ============================================
// GESTION DES ERREURS
// ============================================

// Middleware de gestion globale des erreurs
// app.use(errorMiddleware);

module.exports = app;