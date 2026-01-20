/**
 * Wrapper pour gérer les erreurs dans les fonctions async
 * Évite d'avoir à écrire try-catch dans chaque contrôleur
 * 
 * @param {Function} fn - Fonction async à wrapper
 * @returns {Function} - Fonction qui gère automatiquement les erreurs
 */
export const catchAsync = (fn) => {
  return (req, res, next) => {
    // Exécuter la fonction et capturer les erreurs
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};