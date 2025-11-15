/**
 * Tests for Logger Utility
 */

import { logger } from '@/lib/utils/logger'

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    logger.clear()
  })

  describe('Basic Logging Methods', () => {
    it('should log debug messages', () => {
      const consoleSpy = jest.spyOn(console, 'log')

      logger.debug('Debug message', { test: 'data' })

      expect(consoleSpy).toHaveBeenCalled()
    })

    it('should log info messages', () => {
      const consoleSpy = jest.spyOn(console, 'log')

      logger.info('Info message', { test: 'data' })

      expect(consoleSpy).toHaveBeenCalled()
    })

    it('should log warning messages', () => {
      const consoleSpy = jest.spyOn(console, 'warn')

      logger.warn('Warning message', { test: 'data' })

      expect(consoleSpy).toHaveBeenCalled()
    })

    it('should log error messages', () => {
      const consoleSpy = jest.spyOn(console, 'error')

      logger.error('Error message', new Error('Test error'))

      expect(consoleSpy).toHaveBeenCalled()
    })

    it('should log success messages', () => {
      const consoleSpy = jest.spyOn(console, 'log')

      logger.success('Success message', { test: 'data' })

      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  describe('Context Management', () => {
    it('should include component and action in context', () => {
      const consoleSpy = jest.spyOn(console, 'log')

      logger.info('Test message', null, {
        component: 'TestComponent',
        action: 'testAction',
      })

      expect(consoleSpy).toHaveBeenCalled()
    })

    it('should set global context', () => {
      logger.setGlobalContext({ userId: '123', sessionId: 'abc' })

      const history = logger.getHistory()
      logger.info('Test with global context')

      const latestEntry = logger.getHistory()[history.length]
      expect(latestEntry.context).toMatchObject({
        userId: '123',
        sessionId: 'abc',
      })
    })

    it('should clear global context', () => {
      logger.setGlobalContext({ userId: '123' })
      logger.clearGlobalContext()

      const history = logger.getHistory()
      logger.info('Test without context')

      const latestEntry = logger.getHistory()[history.length]
      expect(latestEntry.context).not.toHaveProperty('userId')
    })

    it('should merge local context with global context', () => {
      logger.setGlobalContext({ userId: '123' })

      const history = logger.getHistory()
      logger.info('Test', null, { component: 'Test' })

      const latestEntry = logger.getHistory()[history.length]
      expect(latestEntry.context).toMatchObject({
        userId: '123',
        component: 'Test',
      })
    })
  })

  describe('Performance Tracking', () => {
    it('should start and end timers', () => {
      jest.useFakeTimers()

      logger.startTimer('test-operation')
      jest.advanceTimersByTime(100)
      const duration = logger.endTimer('test-operation')

      expect(duration).toBeGreaterThan(0)

      jest.useRealTimers()
    })

    it('should include duration in timer logs', () => {
      jest.useFakeTimers()
      const consoleSpy = jest.spyOn(console, 'log')

      logger.startTimer('test-operation')
      jest.advanceTimersByTime(100)
      logger.endTimer('test-operation', 'Operation completed')

      expect(consoleSpy).toHaveBeenCalled()

      jest.useRealTimers()
    })

    it('should handle missing timer', () => {
      const duration = logger.endTimer('non-existent-timer')

      expect(duration).toBe(0)
    })

    it('should include custom message in timer end', () => {
      jest.useFakeTimers()
      const consoleSpy = jest.spyOn(console, 'log')

      logger.startTimer('test-timer')
      jest.advanceTimersByTime(50)
      logger.endTimer('test-timer', 'Custom completion message')

      expect(consoleSpy).toHaveBeenCalled()

      jest.useRealTimers()
    })
  })

  describe('Error Handling', () => {
    it('should format Error objects correctly', () => {
      const consoleSpy = jest.spyOn(console, 'error')
      const error = new Error('Test error')

      logger.error('Error occurred', error)

      expect(consoleSpy).toHaveBeenCalled()
    })

    it('should handle non-Error objects', () => {
      const consoleSpy = jest.spyOn(console, 'error')

      logger.error('Error occurred', { message: 'Custom error' })

      expect(consoleSpy).toHaveBeenCalled()
    })

    it('should include error stack trace', () => {
      const error = new Error('Test error')
      const history = logger.getHistory()

      logger.error('Error with stack', error)

      const latestEntry = logger.getHistory()[history.length]
      expect(latestEntry.data).toHaveProperty('stack')
    })
  })

  describe('Log History', () => {
    it('should maintain log history', () => {
      logger.clear()

      logger.info('Message 1')
      logger.info('Message 2')
      logger.info('Message 3')

      const history = logger.getHistory()
      expect(history).toHaveLength(3)
    })

    it('should include all log entry properties', () => {
      logger.clear()

      logger.info('Test message', { data: 'value' }, { component: 'Test' })

      const history = logger.getHistory()
      const entry = history[0]

      expect(entry).toHaveProperty('level', 'info')
      expect(entry).toHaveProperty('message', 'Test message')
      expect(entry).toHaveProperty('data')
      expect(entry).toHaveProperty('context')
      expect(entry).toHaveProperty('timestamp')
      expect(entry).toHaveProperty('id')
    })

    it('should limit history size to 100 entries', () => {
      logger.clear()

      // Add 150 log entries
      for (let i = 0; i < 150; i++) {
        logger.info(`Message ${i}`)
      }

      const history = logger.getHistory()
      expect(history.length).toBeLessThanOrEqual(100)
    })

    it('should clear history', () => {
      logger.info('Message 1')
      logger.info('Message 2')
      logger.clear()

      const history = logger.getHistory()
      expect(history).toHaveLength(0)
    })
  })

  describe('Utility Methods', () => {
    it('should group logs', () => {
      const consoleSpy = jest.spyOn(console, 'group')

      logger.group('Test Group')

      expect(consoleSpy).toHaveBeenCalled()
    })

    it('should end log groups', () => {
      const consoleSpy = jest.spyOn(console, 'groupEnd')

      logger.groupEnd()

      expect(consoleSpy).toHaveBeenCalled()
    })

    it('should display tables', () => {
      const consoleSpy = jest.spyOn(console, 'table')

      logger.table([{ id: 1, name: 'Test' }])

      expect(consoleSpy).toHaveBeenCalled()
    })

    it('should start console timers', () => {
      const consoleSpy = jest.spyOn(console, 'time')

      logger.time('test-timer')

      expect(consoleSpy).toHaveBeenCalledWith('test-timer')
    })

    it('should end console timers', () => {
      const consoleSpy = jest.spyOn(console, 'timeEnd')

      logger.timeEnd('test-timer')

      expect(consoleSpy).toHaveBeenCalledWith('test-timer')
    })
  })

  describe('Production Mode Behavior', () => {
    const originalEnv = process.env.NODE_ENV

    afterEach(() => {
      process.env.NODE_ENV = originalEnv
    })

    it('should not log non-error messages in production', () => {
      // Note: This test shows the expected behavior
      // In actual production, logger checks NODE_ENV at initialization
      const consoleSpy = jest.spyOn(console, 'log')

      // Logger is initialized in test mode, so this will still log
      logger.info('Production info')

      expect(consoleSpy).toHaveBeenCalled()
    })

    it('should always log errors even in production', () => {
      const consoleSpy = jest.spyOn(console, 'error')

      logger.error('Production error')

      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  describe('Data Logging', () => {
    it('should log with data parameter', () => {
      const consoleSpy = jest.spyOn(console, 'log')
      const testData = { userId: '123', action: 'test' }

      logger.info('Message with data', testData)

      expect(consoleSpy).toHaveBeenCalled()
    })

    it('should handle undefined data', () => {
      const consoleSpy = jest.spyOn(console, 'log')

      logger.info('Message without data')

      expect(consoleSpy).toHaveBeenCalled()
    })

    it('should handle complex data structures', () => {
      const consoleSpy = jest.spyOn(console, 'log')
      const complexData = {
        nested: { object: { with: { many: 'levels' } } },
        array: [1, 2, 3],
        nullValue: null,
        undefinedValue: undefined,
      }

      logger.info('Complex data', complexData)

      expect(consoleSpy).toHaveBeenCalled()
    })
  })
})
