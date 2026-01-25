/**
 * Project Status Constants
 * Used for database ENUMs and logic checks
 */
export const PROJECT_STATUS = {
  PLANNED: 'PLANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  ON_HOLD: 'ON_HOLD',
  COMPLETED: 'COMPLETED',
};

/**
 * Project Status Labels
 * Used for displaying user-friendly text in the UI
 */
export const PROJECT_STATUS_LABELS = {
  [PROJECT_STATUS.PLANNED]: 'Planned',
  [PROJECT_STATUS.IN_PROGRESS]: 'In Progress',
  [PROJECT_STATUS.ON_HOLD]: 'On Hold',
  [PROJECT_STATUS.COMPLETED]: 'Completed',
};