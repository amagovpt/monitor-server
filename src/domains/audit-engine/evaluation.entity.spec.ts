import { Evaluation, PublishStatus } from './evaluation/entities/evaluation.entity';

describe('Evaluation entity (unit)', () => {
  describe('PublishStatus', () => {
    it('has exactly the STAGED and PUBLISHED states, stored as their names', () => {
      expect(PublishStatus.STAGED).toBe('STAGED');
      expect(PublishStatus.PUBLISHED).toBe('PUBLISHED');
      expect(Object.values(PublishStatus).sort()).toEqual(['PUBLISHED', 'STAGED']);
    });
  });

  describe('isFrozen', () => {
    it('is false for an evaluation that was never frozen (frozenAt is null)', () => {
      const e = new Evaluation();
      e.frozenAt = null;

      expect(e.isFrozen).toBe(false);
    });

    it('is true once frozenAt holds a date', () => {
      const e = new Evaluation();
      e.frozenAt = new Date('2026-01-01T00:00:00Z');

      expect(e.isFrozen).toBe(true);
    });

    it('becomes false again when frozenAt is cleared', () => {
      const e = new Evaluation();
      e.frozenAt = new Date();
      expect(e.isFrozen).toBe(true);

      e.frozenAt = null;

      expect(e.isFrozen).toBe(false);
    });

    // A brand-new evaluation has not been frozen. The getter must not report it as frozen just
    // because frozenAt has not been assigned yet (undefined).
    it('is false for a newly created evaluation whose frozenAt was never set', () => {
      expect(new Evaluation().isFrozen).toBe(false);
    });

    it('is false for a partial object where frozenAt was not selected (undefined)', () => {
      const e = Object.assign(new Evaluation(), { id: 1 });

      expect(e.isFrozen).toBe(false);
    });

    it('follows the date, not just its presence: freezing at the epoch counts as frozen', () => {
      const e = new Evaluation();
      e.frozenAt = new Date(0);

      expect(e.isFrozen).toBe(true);
    });
  });
});
