import { describe, it, expect } from 'vitest';
import {
  isValidStatusTransition,
  assertValidStatusTransition,
} from '../utils/statusMachine.js';

describe('Issue Status Machine', () => {
  it('allows valid forward lifecycle transitions', () => {
    expect(isValidStatusTransition('submitted', 'triaged')).toBe(true);
    expect(isValidStatusTransition('triaged', 'assigned')).toBe(true);
    expect(isValidStatusTransition('assigned', 'in_progress')).toBe(true);
    expect(isValidStatusTransition('in_progress', 'resolved')).toBe(true);
    expect(isValidStatusTransition('resolved', 'closed')).toBe(true);
  });

  it('allows rejection from early active states', () => {
    expect(isValidStatusTransition('submitted', 'rejected')).toBe(true);
    expect(isValidStatusTransition('triaged', 'rejected')).toBe(true);
    expect(isValidStatusTransition('assigned', 'rejected')).toBe(true);
    expect(isValidStatusTransition('in_progress', 'rejected')).toBe(true);
  });

  it('allows reopening only from resolved state', () => {
    expect(isValidStatusTransition('resolved', 'reopened')).toBe(true);
    expect(isValidStatusTransition('closed', 'reopened')).toBe(false);
    expect(isValidStatusTransition('in_progress', 'reopened')).toBe(false);
    expect(isValidStatusTransition('submitted', 'reopened')).toBe(false);
  });

  it('allows progression from reopened state back to assigned or in_progress', () => {
    expect(isValidStatusTransition('reopened', 'assigned')).toBe(true);
    expect(isValidStatusTransition('reopened', 'in_progress')).toBe(true);
    expect(isValidStatusTransition('reopened', 'rejected')).toBe(true);
    expect(isValidStatusTransition('reopened', 'closed')).toBe(false);
  });

  it('treats closed and rejected as terminal states', () => {
    expect(isValidStatusTransition('closed', 'in_progress')).toBe(false);
    expect(isValidStatusTransition('closed', 'resolved')).toBe(false);
    expect(isValidStatusTransition('rejected', 'in_progress')).toBe(false);
    expect(isValidStatusTransition('rejected', 'triaged')).toBe(false);
  });

  it('assertValidStatusTransition throws 409 error on illegal jump', () => {
    expect(() => assertValidStatusTransition('submitted', 'resolved')).toThrow();
    try {
      assertValidStatusTransition('submitted', 'resolved');
    } catch (err) {
      expect(err.statusCode).toBe(409);
      expect(err.code).toBe('INVALID_STATUS_TRANSITION');
    }
  });
});
