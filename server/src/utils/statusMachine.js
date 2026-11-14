import { ALLOWED_STATUS_TRANSITIONS } from '../config/constants.js';

/**
 * Checks if a status transition from currentStatus to nextStatus is allowed.
 * @param {string} currentStatus 
 * @param {string} nextStatus 
 * @returns {boolean}
 */
export function isValidStatusTransition(currentStatus, nextStatus) {
  if (!currentStatus || !nextStatus) return false;
  if (currentStatus === nextStatus) return true; // Idempotent updates

  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus];
  if (!allowed) return false;

  return allowed.includes(nextStatus);
}

/**
 * Asserts that the transition is valid, throwing an error with code 409 if invalid.
 */
export function assertValidStatusTransition(currentStatus, nextStatus) {
  if (!isValidStatusTransition(currentStatus, nextStatus)) {
    const error = new Error(`Cannot transition issue status from '${currentStatus}' to '${nextStatus}'`);
    error.statusCode = 409;
    error.code = 'INVALID_STATUS_TRANSITION';
    throw error;
  }
}
