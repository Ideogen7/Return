// =============================================================================
// Reminder Events — Contrats d'événements pour la communication inter-modules
// =============================================================================
// Ces événements sont émis par le module Reminders (Sprint 5) et écoutés par
// le module Loans pour passer un prêt en NOT_RETURNED après épuisement des rappels.
//
// Architecture : EventEmitter2 + @OnEvent (Observer/Event-Driven pattern)
// Ref : copilot-instructions.md §Design Patterns
// =============================================================================

/**
 * Nom des événements reminder émis via EventEmitter2.
 */
export const REMINDER_EVENTS = {
  /** Émis quand tous les rappels d'un prêt ont été envoyés (5e rappel FINAL_OVERDUE) */
  ALL_EXHAUSTED: 'reminder.all-exhausted',
} as const;

/**
 * Payload émis quand tous les rappels d'un prêt sont épuisés.
 *
 * Le module Loans écoute cet événement pour passer le prêt en statut NOT_RETURNED.
 * Le module Reminder ne connaît pas les statuts de prêt — découplage strict.
 */
export interface AllRemindersExhaustedEvent {
  /** ID du prêt dont tous les rappels sont épuisés */
  loanId: string;

  /** ID de l'emprunteur associé au prêt */
  borrowerId: string;

  /** ID du prêteur (propriétaire du prêt) */
  lenderUserId: string;
}
