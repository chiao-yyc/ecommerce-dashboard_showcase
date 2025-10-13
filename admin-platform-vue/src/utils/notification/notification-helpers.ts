import type {
  NotificationTemplate,
  NotificationCategory,
  NotificationTypeValue,
  CompletionStrategy,
  RelatedEntityType,
} from '@/types'
import { logger } from '@/utils/error-handler'

/**
 * 通知系統 - 模板輔助函數
 *
 * @description 從資料庫模板中動態獲取通知屬性的業務邏輯輔助函數
 * @usage 組件中查詢通知分類、完成策略、實體類型等模板屬性
 * @environment 生產環境 + 開發環境
 *
 * 這些函數替代了原本的靜態映射，改為從資料庫模板動態獲取屬性
 */

/**
 * 從模板清單中取得指定類型的模板
 */
export function getTemplateByType(
  templates: NotificationTemplate[],
  type: NotificationTypeValue,
): NotificationTemplate | undefined {
  try {
    logger.debug('NotificationHelper', `Searching template for: ${type}`)

    const template = templates.find((t) => t.type === type)

    if (!template) {
      logger.warn('NotificationHelper', `Template not found: ${type}`, {
        availableTypes: templates.map((t) => t.type),
      })
      return undefined
    }

    logger.info('NotificationHelper', `Template found: ${type}`)
    return template
  } catch (error) {
    logger.error(
      'NotificationHelper',
      'Template search failed',
      error as Error,
      {
        type,
        templatesCount: templates.length,
      },
    )
    return undefined
  }
}

/**
 * 從模板中取得通知的分類
 */
export function getNotificationCategoryFromTemplate(
  templates: NotificationTemplate[],
  type: NotificationTypeValue,
): NotificationCategory | undefined {
  try {
    logger.debug('NotificationHelper', `Getting category for: ${type}`)

    const template = getTemplateByType(templates, type)
    const category = template?.category

    if (category) {
      logger.info(
        'NotificationHelper',
        `Category found: ${type} -> ${category}`,
      )
    } else {
      logger.warn('NotificationHelper', `No category found for: ${type}`, {
        templateExists: !!template,
      })
    }

    return category
  } catch (error) {
    logger.error(
      'NotificationHelper',
      'Category lookup failed',
      error as Error,
      { type },
    )
    return undefined
  }
}

/**
 * 從模板中取得通知的完成策略
 */
export function getCompletionStrategyFromTemplate(
  templates: NotificationTemplate[],
  type: NotificationTypeValue,
): CompletionStrategy | undefined {
  try {
    logger.debug(
      'NotificationHelper',
      `Getting completion strategy for: ${type}`,
    )

    const template = getTemplateByType(templates, type)
    const strategy = template?.completionStrategy

    if (strategy) {
      logger.info(
        'NotificationHelper',
        `Completion strategy found: ${type} -> ${strategy}`,
      )
    } else {
      logger.warn(
        'NotificationHelper',
        `No completion strategy found for: ${type}`,
        {
          templateExists: !!template,
        },
      )
    }

    return strategy
  } catch (error) {
    logger.error(
      'NotificationHelper',
      'Completion strategy lookup failed',
      error as Error,
      { type },
    )
    return undefined
  }
}

/**
 * 從模板中取得通知的必要實體類型
 */
export function getRequiredEntityTypeFromTemplate(
  templates: NotificationTemplate[],
  type: NotificationTypeValue,
): RelatedEntityType | undefined {
  try {
    logger.debug(
      'NotificationHelper',
      `Getting required entity type for: ${type}`,
    )

    const template = getTemplateByType(templates, type)
    const entityType = template?.requiredEntityType as RelatedEntityType

    if (entityType) {
      logger.info(
        'NotificationHelper',
        `Required entity type found: ${type} -> ${entityType}`,
      )
    } else {
      logger.warn(
        'NotificationHelper',
        `No required entity type found for: ${type}`,
        {
          templateExists: !!template,
        },
      )
    }

    return entityType
  } catch (error) {
    logger.error(
      'NotificationHelper',
      'Entity type lookup failed',
      error as Error,
      { type },
    )
    return undefined
  }
}

/**
 * 檢查通知是否為任務型（從模板）
 */
export function isActionableNotificationFromTemplate(
  templates: NotificationTemplate[],
  type: NotificationTypeValue,
): boolean {
  try {
    const category = getNotificationCategoryFromTemplate(templates, type)
    const isActionable = category === 'actionable'

    logger.debug(
      'NotificationHelper',
      `Actionable check: ${type} -> ${isActionable}`,
      { category },
    )
    return isActionable
  } catch (error) {
    logger.error(
      'NotificationHelper',
      'Actionable check failed',
      error as Error,
      { type },
    )
    return false
  }
}

/**
 * 檢查通知是否為資訊型（從模板）
 */
export function isInformationalNotificationFromTemplate(
  templates: NotificationTemplate[],
  type: NotificationTypeValue,
): boolean {
  try {
    const category = getNotificationCategoryFromTemplate(templates, type)
    const isInformational = category === 'informational'

    logger.debug(
      'NotificationHelper',
      `Informational check: ${type} -> ${isInformational}`,
      { category },
    )
    return isInformational
  } catch (error) {
    logger.error(
      'NotificationHelper',
      'Informational check failed',
      error as Error,
      { type },
    )
    return false
  }
}

/**
 * 檢查是否支援自動完成（從模板）
 */
export function supportsAutoCompletionFromTemplate(
  templates: NotificationTemplate[],
  type: NotificationTypeValue,
): boolean {
  try {
    const strategy = getCompletionStrategyFromTemplate(templates, type)
    const supportsAuto = strategy === 'auto'

    logger.debug(
      'NotificationHelper',
      `Auto completion check: ${type} -> ${supportsAuto}`,
      { strategy },
    )
    return supportsAuto
  } catch (error) {
    logger.error(
      'NotificationHelper',
      'Auto completion check failed',
      error as Error,
      { type },
    )
    return false
  }
}

/**
 * 檢查是否支援智能建議（從模板）
 */
export function supportsSuggestedCompletionFromTemplate(
  templates: NotificationTemplate[],
  type: NotificationTypeValue,
): boolean {
  try {
    const strategy = getCompletionStrategyFromTemplate(templates, type)
    const supportsSuggested = strategy === 'suggested'

    logger.debug(
      'NotificationHelper',
      `Suggested completion check: ${type} -> ${supportsSuggested}`,
      { strategy },
    )
    return supportsSuggested
  } catch (error) {
    logger.error(
      'NotificationHelper',
      'Suggested completion check failed',
      error as Error,
      { type },
    )
    return false
  }
}

/**
 * 檢查是否僅支援手動完成（從模板）
 */
export function isManualCompletionOnlyFromTemplate(
  templates: NotificationTemplate[],
  type: NotificationTypeValue,
): boolean {
  try {
    const strategy = getCompletionStrategyFromTemplate(templates, type)
    const isManualOnly = strategy === 'manual'

    logger.debug(
      'NotificationHelper',
      `Manual completion check: ${type} -> ${isManualOnly}`,
      { strategy },
    )
    return isManualOnly
  } catch (error) {
    logger.error(
      'NotificationHelper',
      'Manual completion check failed',
      error as Error,
      { type },
    )
    return false
  }
}

/**
 * 型別安全的驗證函數（從模板）
 * 檢查指定的通知類型是否與實體類型匹配
 */
export function validateNotificationEntityFromTemplate(
  templates: NotificationTemplate[],
  type: NotificationTypeValue,
  entityType?: RelatedEntityType,
): boolean {
  try {
    logger.debug('NotificationHelper', `Validating entity type for: ${type}`, {
      entityType,
    })

    const requiredType = getRequiredEntityTypeFromTemplate(templates, type)
    const isValid = requiredType === entityType

    if (isValid) {
      logger.info('NotificationHelper', `Entity validation passed: ${type}`, {
        entityType,
        requiredType,
      })
    } else {
      logger.warn('NotificationHelper', `Entity validation failed: ${type}`, {
        provided: entityType,
        required: requiredType,
      })
    }

    return isValid
  } catch (error) {
    logger.error(
      'NotificationHelper',
      'Entity validation failed',
      error as Error,
      { type, entityType },
    )
    return false
  }
}

/**
 * 取得所有任務型通知類型（從模板）
 */
export function getActionableNotificationTypesFromTemplate(
  templates: NotificationTemplate[],
): string[] {
  try {
    logger.debug('NotificationHelper', 'Getting actionable notification types')

    const actionableTypes = templates
      .filter((template) => template.category === 'actionable')
      .map((template) => template.type)

    logger.info(
      'NotificationHelper',
      `Found ${actionableTypes.length} actionable types`,
      {
        types: actionableTypes,
      },
    )

    return actionableTypes
  } catch (error) {
    logger.error(
      'NotificationHelper',
      'Failed to get actionable types',
      error as Error,
      {
        templatesCount: templates.length,
      },
    )
    return []
  }
}

/**
 * 取得所有資訊型通知類型（從模板）
 */
export function getInformationalNotificationTypesFromTemplate(
  templates: NotificationTemplate[],
): string[] {
  try {
    logger.debug(
      'NotificationHelper',
      'Getting informational notification types',
    )

    const informationalTypes = templates
      .filter((template) => template.category === 'informational')
      .map((template) => template.type)

    logger.info(
      'NotificationHelper',
      `Found ${informationalTypes.length} informational types`,
      {
        types: informationalTypes,
      },
    )

    return informationalTypes
  } catch (error) {
    logger.error(
      'NotificationHelper',
      'Failed to get informational types',
      error as Error,
      {
        templatesCount: templates.length,
      },
    )
    return []
  }
}

/**
 * 取得支援特定完成策略的通知類型（從模板）
 */
export function getNotificationTypesByCompletionStrategyFromTemplate(
  templates: NotificationTemplate[],
  strategy: CompletionStrategy,
): string[] {
  try {
    logger.debug(
      'NotificationHelper',
      `Getting types by completion strategy: ${strategy}`,
    )

    const matchingTypes = templates
      .filter((template) => template.completionStrategy === strategy)
      .map((template) => template.type)

    logger.info(
      'NotificationHelper',
      `Found ${matchingTypes.length} types with ${strategy} strategy`,
      {
        strategy,
        types: matchingTypes,
      },
    )

    return matchingTypes
  } catch (error) {
    logger.error(
      'NotificationHelper',
      'Failed to get types by completion strategy',
      error as Error,
      {
        strategy,
        templatesCount: templates.length,
      },
    )
    return []
  }
}

/**
 * 根據實體類型反向查找所有可能的通知類型（從模板）
 */
export function getNotificationTypesByEntityFromTemplate(
  templates: NotificationTemplate[],
  entityType: RelatedEntityType,
): string[] {
  try {
    logger.debug('NotificationHelper', `Getting types by entity: ${entityType}`)

    const matchingTypes = templates
      .filter((template) => template.requiredEntityType === entityType)
      .map((template) => template.type)

    logger.info(
      'NotificationHelper',
      `Found ${matchingTypes.length} types for entity ${entityType}`,
      {
        entityType,
        types: matchingTypes,
      },
    )

    return matchingTypes
  } catch (error) {
    logger.error(
      'NotificationHelper',
      'Failed to get types by entity',
      error as Error,
      {
        entityType,
        templatesCount: templates.length,
      },
    )
    return []
  }
}
