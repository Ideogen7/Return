// =============================================================================
// User Events — Contrats d'événements pour la communication inter-modules
// =============================================================================
// Ces événements sont émis par le module Auth et écoutés par d'autres modules
// (Borrowers, Notifications...) pour réagir aux actions utilisateur.
//
// Architecture : EventEmitter2 + @OnEvent (Observer/Event-Driven pattern)
// Ref : copilot-instructions.md §Design Patterns
// =============================================================================

/**
 * Nom des événements user émis via EventEmitter2.
 *
 * Usage :
 * ```ts
 * this.eventEmitter.emit(USER_EVENTS.REGISTERED, payload);
 * ```
 */
export const USER_EVENTS = {
  /** Émis quand un nouvel utilisateur s'inscrit */
  REGISTERED: 'user.registered',

  /** Émis quand un utilisateur se connecte */
  LOGGED_IN: 'user.logged-in',
} as const;

/**
 * Payload émis lors de l'inscription d'un nouvel utilisateur.
 *
 * Le module Borrowers écoute cet événement pour associer les Borrower existants
 * (créés par d'autres prêteurs) au nouveau User via correspondance d'email.
 *
 * Ref : Sprint 4.5, INTEG-001
 */
export interface UserRegisteredEvent {
  /** ID du nouvel utilisateur créé */
  userId: string;

  /** Email du nouvel utilisateur */
  email: string;
}
