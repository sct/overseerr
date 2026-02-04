import { sortCrewPriority } from '@app/utils/creditHelpers';
import type { Crew } from '@server/models/common';
import { describe, expect, it } from 'vitest';

// Helper function to create a Crew member
const createCrew = (job: string, name: string, id = 1): Crew => ({
  id,
  creditId: `credit-${id}`,
  department: 'Production',
  job,
  name,
});

describe('sortCrewPriority', () => {
  describe('filtering', () => {
    it('should only include priority jobs', () => {
      const crew: Crew[] = [
        createCrew('Director', 'Steven Spielberg', 1),
        createCrew('Caterer', 'John Doe', 2),
        createCrew('Producer', 'Kathleen Kennedy', 3),
        createCrew('Best Boy', 'Jane Smith', 4),
      ];

      const result = sortCrewPriority(crew);

      expect(result).toHaveLength(2);
      expect(result.map((c) => c.job)).toEqual(['Director', 'Producer']);
    });

    it('should filter out non-priority jobs', () => {
      const crew: Crew[] = [
        createCrew('Grip', 'Person 1', 1),
        createCrew('Gaffer', 'Person 2', 2),
        createCrew('Camera Operator', 'Person 3', 3),
        createCrew('Sound Mixer', 'Person 4', 4),
      ];

      const result = sortCrewPriority(crew);

      expect(result).toHaveLength(0);
    });

    it('should include all priority job types', () => {
      const crew: Crew[] = [
        createCrew('Director', 'Person 1', 1),
        createCrew('Creator', 'Person 2', 2),
        createCrew('Screenplay', 'Person 3', 3),
        createCrew('Writer', 'Person 4', 4),
        createCrew('Composer', 'Person 5', 5),
        createCrew('Editor', 'Person 6', 6),
        createCrew('Producer', 'Person 7', 7),
        createCrew('Co-Producer', 'Person 8', 8),
        createCrew('Executive Producer', 'Person 9', 9),
        createCrew('Animation', 'Person 10', 10),
      ];

      const result = sortCrewPriority(crew);

      expect(result).toHaveLength(10);
    });
  });

  describe('sorting', () => {
    it('should sort by priority order (Director first)', () => {
      const crew: Crew[] = [
        createCrew('Producer', 'Person 1', 1),
        createCrew('Director', 'Person 2', 2),
        createCrew('Writer', 'Person 3', 3),
      ];

      const result = sortCrewPriority(crew);

      expect(result[0].job).toBe('Director');
      expect(result[1].job).toBe('Writer');
      expect(result[2].job).toBe('Producer');
    });

    it('should maintain correct priority order', () => {
      const crew: Crew[] = [
        createCrew('Animation', 'Person 1', 1),
        createCrew('Executive Producer', 'Person 2', 2),
        createCrew('Co-Producer', 'Person 3', 3),
        createCrew('Producer', 'Person 4', 4),
        createCrew('Editor', 'Person 5', 5),
        createCrew('Composer', 'Person 6', 6),
        createCrew('Writer', 'Person 7', 7),
        createCrew('Screenplay', 'Person 8', 8),
        createCrew('Creator', 'Person 9', 9),
        createCrew('Director', 'Person 10', 10),
      ];

      const result = sortCrewPriority(crew);

      // Expected order based on priorityJobs array
      const expectedOrder = [
        'Director',
        'Creator',
        'Screenplay',
        'Writer',
        'Composer',
        'Editor',
        'Producer',
        'Co-Producer',
        'Executive Producer',
        'Animation',
      ];

      expect(result.map((c) => c.job)).toEqual(expectedOrder);
    });

    it('should handle multiple people with same job', () => {
      const crew: Crew[] = [
        createCrew('Writer', 'Writer 1', 1),
        createCrew('Director', 'Director 1', 2),
        createCrew('Writer', 'Writer 2', 3),
        createCrew('Director', 'Director 2', 4),
      ];

      const result = sortCrewPriority(crew);

      // Directors should come before Writers
      expect(result[0].job).toBe('Director');
      expect(result[1].job).toBe('Director');
      expect(result[2].job).toBe('Writer');
      expect(result[3].job).toBe('Writer');
    });
  });

  describe('edge cases', () => {
    it('should return empty array for empty input', () => {
      const result = sortCrewPriority([]);
      expect(result).toEqual([]);
    });

    it('should return empty array when no priority jobs found', () => {
      const crew: Crew[] = [
        createCrew('Stunt Coordinator', 'Person 1', 1),
        createCrew('Makeup Artist', 'Person 2', 2),
      ];

      const result = sortCrewPriority(crew);
      expect(result).toEqual([]);
    });

    it('should handle single crew member', () => {
      const crew: Crew[] = [createCrew('Director', 'Christopher Nolan', 1)];

      const result = sortCrewPriority(crew);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Christopher Nolan');
    });

    it('should preserve all crew properties', () => {
      const crew: Crew[] = [
        {
          id: 123,
          creditId: 'credit-123',
          department: 'Directing',
          gender: 2,
          job: 'Director',
          name: 'Denis Villeneuve',
          profilePath: '/path/to/photo.jpg',
        },
      ];

      const result = sortCrewPriority(crew);

      expect(result[0]).toEqual(crew[0]);
    });

    it('should be case-sensitive (exact match only)', () => {
      const crew: Crew[] = [
        createCrew('director', 'Person 1', 1), // lowercase - should not match
        createCrew('DIRECTOR', 'Person 2', 2), // uppercase - should not match
        createCrew('Director', 'Person 3', 3), // correct case - should match
      ];

      const result = sortCrewPriority(crew);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Person 3');
    });
  });

  describe('real-world scenarios', () => {
    it('should sort typical movie crew', () => {
      const crew: Crew[] = [
        createCrew('Casting', 'Mary Vernieu', 1),
        createCrew('Director', 'Christopher Nolan', 2),
        createCrew('Producer', 'Emma Thomas', 3),
        createCrew('Screenplay', 'Christopher Nolan', 4),
        createCrew('Cinematography', 'Hoyte van Hoytema', 5),
        createCrew('Composer', 'Hans Zimmer', 6),
        createCrew('Editor', 'Jennifer Lame', 7),
        createCrew('Executive Producer', 'Thomas Hayslip', 8),
      ];

      const result = sortCrewPriority(crew);

      expect(result).toHaveLength(6);
      expect(result[0].job).toBe('Director');
      expect(result[1].job).toBe('Screenplay');
      expect(result[2].job).toBe('Composer');
      expect(result[3].job).toBe('Editor');
      expect(result[4].job).toBe('Producer');
      expect(result[5].job).toBe('Executive Producer');
    });

    it('should sort typical TV show crew', () => {
      const crew: Crew[] = [
        createCrew('Creator', 'Vince Gilligan', 1),
        createCrew('Director', 'Michelle MacLaren', 2),
        createCrew('Writer', 'Peter Gould', 3),
        createCrew('Executive Producer', 'Vince Gilligan', 4),
        createCrew('Composer', 'Dave Porter', 5),
      ];

      const result = sortCrewPriority(crew);

      expect(result).toHaveLength(5);
      expect(result[0].job).toBe('Director');
      expect(result[1].job).toBe('Creator');
      expect(result[2].job).toBe('Writer');
      expect(result[3].job).toBe('Composer');
      expect(result[4].job).toBe('Executive Producer');
    });

    it('should sort animated movie crew', () => {
      const crew: Crew[] = [
        createCrew('Director', 'Pete Docter', 1),
        createCrew('Animation', 'Victor Navone', 2),
        createCrew('Screenplay', 'Pete Docter', 3),
        createCrew('Producer', 'Jonas Rivera', 4),
        createCrew('Co-Producer', 'Mark Nielsen', 5),
      ];

      const result = sortCrewPriority(crew);

      expect(result).toHaveLength(5);
      // Animation should be last in priority
      expect(result[result.length - 1].job).toBe('Animation');
    });
  });
});
