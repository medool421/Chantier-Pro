require('dotenv').config();
const app = require('./app');
const { testConnection,  syncDatabase} = require('./config/database');

// Port du serveur
const PORT = process.env.PORT || 5000;

// Fonction pour démarrer le serveur
const startServer = async () => {
  try {
    // 1. Tester la connexion à la base de données
    await testConnection();
    await syncDatabase();
    // 2. Démarrer le serveur Express
    const server = app.listen(PORT, () => {
      console.log(`                                             
   🚀 ChantierPro API Server                   
                                              
   📡 Server running on port: ${PORT}            
   🌍 Environment: ${process.env.NODE_ENV}                
   📅 Started at: ${new Date().toLocaleString()} 
      `);
      
      console.log(`✅ Server ready at http://localhost:${PORT}`);
      console.log(`✅ API available at http://localhost:${PORT}/api/${process.env.API_VERSION || 'v1'}`);
      console.log(`✅ Health check at http://localhost:${PORT}/health\n`);
    });
    
    // Gestion de l'arrêt gracieux du serveur
    const gracefulShutdown = (signal) => {
      console.log(`\n⚠️  ${signal} signal received: closing HTTP server`);
      server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
      });
      
      // Si le serveur ne se ferme pas en 10 secondes, forcer l'arrêt
      setTimeout(() => {
        console.error('❌ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };
    
    // Écouter les signaux d'arrêt
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Gestion des erreurs non catchées
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Démarrer le serveur
startServer();