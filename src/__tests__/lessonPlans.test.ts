import {
  BUILT_IN_LESSONS,
  calculateLessonCompletion,
  LessonPlan,
  LessonProgress,
} from '../services/lessonPlans';

describe('Lesson Plans Service', () => {
  describe('BUILT_IN_LESSONS', () => {
    it('should have at least 5 built-in lessons', () => {
      expect(BUILT_IN_LESSONS.length).toBeGreaterThanOrEqual(5);
    });

    it('should have unique IDs', () => {
      const ids = BUILT_IN_LESSONS.map(l => l.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have all required fields', () => {
      BUILT_IN_LESSONS.forEach(lesson => {
        expect(lesson.id).toBeTruthy();
        expect(lesson.name).toBeTruthy();
        expect(lesson.description).toBeTruthy();
        expect(lesson.icon).toBeTruthy();
        expect(lesson.color).toBeTruthy();
        expect(['beginner', 'intermediate', 'advanced']).toContain(lesson.difficulty);
        expect(lesson.estimatedTime).toBeTruthy();
        expect(lesson.steps.length).toBeGreaterThan(0);
        expect(lesson.isBuiltIn).toBe(true);
      });
    });

    it('should have valid steps in each lesson', () => {
      BUILT_IN_LESSONS.forEach(lesson => {
        lesson.steps.forEach(step => {
          expect(step.id).toBeTruthy();
          expect(step.title).toBeTruthy();
          expect(step.description).toBeTruthy();
          expect(['notes', 'chords', 'intervals', 'scales', 'progressions']).toContain(step.type);
          expect(step.items.length).toBeGreaterThan(0);
          expect(step.targetAccuracy).toBeGreaterThan(0);
          expect(step.targetAccuracy).toBeLessThanOrEqual(100);
          expect(step.minAttempts).toBeGreaterThan(0);
        });
      });
    });

    it('should have difficulty levels distributed', () => {
      const difficulties = BUILT_IN_LESSONS.map(l => l.difficulty);
      expect(difficulties).toContain('beginner');
      expect(difficulties).toContain('intermediate');
      expect(difficulties).toContain('advanced');
    });
  });

  describe('calculateLessonCompletion', () => {
    const mockLesson: LessonPlan = {
      id: 'test-lesson',
      name: 'Test Lesson',
      description: 'A test lesson',
      icon: '📚',
      color: '#FF0000',
      difficulty: 'beginner',
      estimatedTime: '1 week',
      isBuiltIn: true,
      createdAt: new Date().toISOString(),
      steps: [
        {
          id: 'step-1',
          type: 'notes',
          title: 'Step 1',
          description: 'First step',
          items: ['C', 'D'],
          targetAccuracy: 80,
          minAttempts: 10,
        },
        {
          id: 'step-2',
          type: 'notes',
          title: 'Step 2',
          description: 'Second step',
          items: ['E', 'F'],
          targetAccuracy: 80,
          minAttempts: 10,
        },
        {
          id: 'step-3',
          type: 'notes',
          title: 'Step 3',
          description: 'Third step',
          items: ['G', 'A'],
          targetAccuracy: 80,
          minAttempts: 10,
        },
        {
          id: 'step-4',
          type: 'notes',
          title: 'Step 4',
          description: 'Fourth step',
          items: ['B', 'C'],
          targetAccuracy: 80,
          minAttempts: 10,
        },
      ],
    };

    it('should return 0 for null progress', () => {
      const result = calculateLessonCompletion(mockLesson, null);
      expect(result).toBe(0);
    });

    it('should return 0 for empty progress', () => {
      const progress: LessonProgress = {
        lessonId: 'test-lesson',
        currentStepIndex: 0,
        stepProgress: {},
        startedAt: new Date().toISOString(),
      };
      const result = calculateLessonCompletion(mockLesson, progress);
      expect(result).toBe(0);
    });

    it('should return 25 for 1 of 4 steps completed', () => {
      const progress: LessonProgress = {
        lessonId: 'test-lesson',
        currentStepIndex: 1,
        stepProgress: {
          'step-1': {
            attempts: 10,
            correctAnswers: 9,
            completed: true,
            completedAt: new Date().toISOString(),
          },
        },
        startedAt: new Date().toISOString(),
      };
      const result = calculateLessonCompletion(mockLesson, progress);
      expect(result).toBe(25);
    });

    it('should return 50 for 2 of 4 steps completed', () => {
      const progress: LessonProgress = {
        lessonId: 'test-lesson',
        currentStepIndex: 2,
        stepProgress: {
          'step-1': { attempts: 10, correctAnswers: 9, completed: true },
          'step-2': { attempts: 10, correctAnswers: 8, completed: true },
        },
        startedAt: new Date().toISOString(),
      };
      const result = calculateLessonCompletion(mockLesson, progress);
      expect(result).toBe(50);
    });

    it('should return 100 for all steps completed', () => {
      const progress: LessonProgress = {
        lessonId: 'test-lesson',
        currentStepIndex: 3,
        stepProgress: {
          'step-1': { attempts: 10, correctAnswers: 9, completed: true },
          'step-2': { attempts: 10, correctAnswers: 8, completed: true },
          'step-3': { attempts: 10, correctAnswers: 9, completed: true },
          'step-4': { attempts: 10, correctAnswers: 10, completed: true },
        },
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };
      const result = calculateLessonCompletion(mockLesson, progress);
      expect(result).toBe(100);
    });

    it('should not count incomplete steps', () => {
      const progress: LessonProgress = {
        lessonId: 'test-lesson',
        currentStepIndex: 1,
        stepProgress: {
          'step-1': { attempts: 10, correctAnswers: 9, completed: true },
          'step-2': { attempts: 5, correctAnswers: 3, completed: false }, // Not completed
        },
        startedAt: new Date().toISOString(),
      };
      const result = calculateLessonCompletion(mockLesson, progress);
      expect(result).toBe(25); // Only step-1 is completed
    });
  });
});
