import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  logger,
  createModuleLogger,
  getLoggerConfig,
  updateLoggerConfig,
  LogLevel,
  performanceTimer,
  logIf,
} from '../logger'

describe('Logger System', () => {
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleDebugSpy.mockRestore()
    consoleInfoSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  describe('基本功能', () => {
    it('應該正確輸出 debug 日誌', () => {
      updateLoggerConfig({ level: LogLevel.DEBUG })
      logger.debug('測試訊息', { data: 'test' })
      expect(consoleDebugSpy).toHaveBeenCalled()
    })

    it('應該正確輸出 info 日誌', () => {
      updateLoggerConfig({ level: LogLevel.INFO })
      logger.info('資訊訊息')
      expect(consoleInfoSpy).toHaveBeenCalled()
    })

    it('應該正確輸出 warn 日誌', () => {
      updateLoggerConfig({ level: LogLevel.WARN })
      logger.warn('警告訊息')
      expect(consoleWarnSpy).toHaveBeenCalled()
    })

    it('應該正確輸出 error 日誌', () => {
      updateLoggerConfig({ level: LogLevel.ERROR })
      const error = new Error('測試錯誤')
      logger.error('錯誤訊息', error)
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('日誌等級控制', () => {
    it('當等級為 ERROR 時，應該只輸出 error', () => {
      updateLoggerConfig({ level: LogLevel.ERROR })

      logger.debug('debug')
      logger.info('info')
      logger.warn('warn')
      logger.error('error')

      expect(consoleDebugSpy).not.toHaveBeenCalled()
      expect(consoleInfoSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).not.toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('當等級為 SILENT 時，應該不輸出任何日誌', () => {
      updateLoggerConfig({ level: LogLevel.SILENT })

      logger.debug('debug')
      logger.info('info')
      logger.warn('warn')
      logger.error('error')

      expect(consoleDebugSpy).not.toHaveBeenCalled()
      expect(consoleInfoSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).not.toHaveBeenCalled()
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it('當等級為 DEBUG 時，應該輸出所有日誌', () => {
      updateLoggerConfig({ level: LogLevel.DEBUG })

      logger.debug('debug')
      logger.info('info')
      logger.warn('warn')
      logger.error('error')

      expect(consoleDebugSpy).toHaveBeenCalled()
      expect(consoleInfoSpy).toHaveBeenCalled()
      expect(consoleWarnSpy).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('模組 Logger', () => {
    it('應該建立具有模組上下文的 Logger', () => {
      updateLoggerConfig({ level: LogLevel.DEBUG })
      const moduleLog = createModuleLogger('TestModule', 'SubModule')

      moduleLog.debug('測試')

      expect(consoleDebugSpy).toHaveBeenCalled()
      const callArgs = consoleDebugSpy.mock.calls[0][0] as string
      expect(callArgs).toContain('[TestModule:SubModule]')
    })

    it('應該支援僅模組名稱的 Logger', () => {
      updateLoggerConfig({ level: LogLevel.DEBUG })
      const moduleLog = createModuleLogger('TestModule')

      moduleLog.debug('測試')

      expect(consoleDebugSpy).toHaveBeenCalled()
      const callArgs = consoleDebugSpy.mock.calls[0][0] as string
      expect(callArgs).toContain('[TestModule]')
      expect(callArgs).not.toContain('SubModule')
    })
  })

  describe('路由調試功能', () => {
    it('當啟用路由調試時，應該輸出 routerDebug', () => {
      updateLoggerConfig({ level: LogLevel.DEBUG, enableRouterDebug: true })
      const log = createModuleLogger('Router')

      log.routerDebug('路由測試')

      expect(consoleDebugSpy).toHaveBeenCalled()
    })

    it('當關閉路由調試時，應該不輸出 routerDebug', () => {
      updateLoggerConfig({ level: LogLevel.DEBUG, enableRouterDebug: false })
      const log = createModuleLogger('Router')

      log.routerDebug('路由測試')

      expect(consoleDebugSpy).not.toHaveBeenCalled()
    })
  })

  describe('工具函數', () => {
    it('logIf 應該根據條件輸出日誌', () => {
      updateLoggerConfig({ level: LogLevel.DEBUG })

      logIf(true, 'debug', '應該輸出')
      expect(consoleDebugSpy).toHaveBeenCalled()

      consoleDebugSpy.mockClear()

      logIf(false, 'debug', '不應輸出')
      expect(consoleDebugSpy).not.toHaveBeenCalled()
    })

    it('performanceTimer 應該返回停止計時函數', () => {
      const stopTimer = performanceTimer('測試操作')

      // 應該返回一個函數
      expect(typeof stopTimer).toBe('function')

      // 呼叫停止計時函數不應拋出錯誤
      expect(() => stopTimer()).not.toThrow()
    })
  })

  describe('配置管理', () => {
    it('getLoggerConfig 應該返回當前配置', () => {
      const config = getLoggerConfig()

      expect(config).toHaveProperty('level')
      expect(config).toHaveProperty('enableRouterDebug')
      expect(config).toHaveProperty('enableModulePrefix')
      expect(config).toHaveProperty('enableTimestamp')
    })

    it('updateLoggerConfig 應該更新配置', () => {
      const originalConfig = getLoggerConfig()

      updateLoggerConfig({ level: LogLevel.WARN })

      const newConfig = getLoggerConfig()
      expect(newConfig.level).toBe(LogLevel.WARN)
      expect(newConfig.level).not.toBe(originalConfig.level)
    })
  })

  describe('訊息格式化', () => {
    it('debug 訊息應包含 🔍 圖示', () => {
      updateLoggerConfig({ level: LogLevel.DEBUG })
      logger.debug('測試')

      const callArgs = consoleDebugSpy.mock.calls[0][0] as string
      expect(callArgs).toContain('🔍')
    })

    it('info 訊息應包含 🔧 圖示', () => {
      updateLoggerConfig({ level: LogLevel.INFO })
      logger.info('測試')

      const callArgs = consoleInfoSpy.mock.calls[0][0] as string
      expect(callArgs).toContain('🔧')
    })

    it('warn 訊息應包含 ⚠️ 圖示', () => {
      updateLoggerConfig({ level: LogLevel.WARN })
      logger.warn('測試')

      const callArgs = consoleWarnSpy.mock.calls[0][0] as string
      expect(callArgs).toContain('⚠️')
    })

    it('error 訊息應包含 ❌ 圖示', () => {
      updateLoggerConfig({ level: LogLevel.ERROR })
      logger.error('測試')

      const callArgs = consoleErrorSpy.mock.calls[0][0] as string
      expect(callArgs).toContain('❌')
    })
  })
})
