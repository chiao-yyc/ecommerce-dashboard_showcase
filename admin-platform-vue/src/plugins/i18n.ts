import { createI18n } from 'vue-i18n'
import en from '@/locales/en'
import zhTW from '@/locales/zh-TW'

// Type definitions for i18n messages
export interface I18nMessages {
  home: {
    home: string
  }
  user: {
    label: string
    id: string
    email: string
    fullName: string
    phone: string
    role: string
    roles: string
    createdAt: string
  }
  role: {
    label: string
    order: string
    name: string
    description: string
  }
  components: {
    dataTable: {
      viewColumns: string
      toggleColumns: string
      selectedRows: string
      rowsPerPage: string
      currentPage: string
      noData: string
      noResults: string
    }
  }
  actions: {
    label: string
    searchPlaceholder: string
    loading: string
    view: string
    edit: string
    add: string
    update: string
    delete: string
    export: string
    detail: string
    batch: string
    list: string
    cancel: string
    confirm: string
    save: string
  }
  actionWithNoun: string
  systemSetting: {
    userList: {
      pageTitle: string
      roleFilter: string
      editRoleTitle: string
      editRoleDescription: string
    }
    roleManage: {
      pageTitle: string
      editRoleTitle: string
      editRoleDescription: string
      addRoleTitle: string
      roleNamePlaceholder: string
      roleDescriptionPlaceholder: string
    }
    rolePermissions: {
      pageTitle: string
      selectRole: string
      selectRolePlaceholder: string
      saveChanges: string
      saving: string
      saveSuccess: string
      saveFailed: string
    }
  }
  validation: {
    required: string
    minLength: string
    maxLength: string
    invalidDateFormat: string
  }
  errors: {
    operationFailed: string
    loadingFailed: string
    unknownError: string
    deleteFailed: string
  }
  confirmations: {
    delete: {
      title: string
      description: string
      confirm: string
      cancel: string
    }
  }
  customers: {
    pageTitle: string
  }
  holiday: {
    holiday: string
    date: string
    name: string
    type: string
    priority: string
    description: string
    datePlaceholder: string
    namePlaceholder: string
    descriptionPlaceholder: string
    basicInfo: string
    addTitle: string
    editTitle: string
  }
  auth: {
    login: {
      title: string
      description: string
      emailLabel: string
      emailPlaceholder: string
      passwordLabel: string
      passwordPlaceholder: string
      forgotPassword: string
      signInButton: string
      signInWithProvider: string
      noAccount: string
      signUpLink: string
      processingOAuth: string
    }
    validation: {
      emailRequired: string
      emailInvalid: string
      passwordRequired: string
      passwordMinLength: string
      passwordMaxLength: string
    }
    register: {
      title: string
      emailLabel: string
      emailPlaceholder: string
      passwordLabel: string
      passwordPlaceholder: string
      signUpButton: string
      signUpWithProvider: string
      hasAccount: string
      signInLink: string
      validation: {
        emailRequired: string
        emailInvalid: string
        passwordRequired: string
        passwordMinLength: string
        passwordMaxLength: string
      }
    }
  }
  export: {
    pdf: {
      // 圖表標題
      businessHealthRadarTitle: string
      customerValueDistributionTitle: string
      revenueTrendTitle: string

      // 描述格式
      overallHealthScore: string
      exportedAt: string

      // 維度標籤
      dimensions: {
        revenue: string
        satisfaction: string
        fulfillment: string
        support: string
        products: string
        marketing: string
        system: string
      }

      // 匯出格式
      formats: {
        pdf: string
        csv: string
        xlsx: string
        json: string
      }

      // 狀態訊息
      messages: {
        exporting: string
        exported: string
        failed: string
      }
    }
  }
}

export const i18n = createI18n({
  legacy: false, // 使用 Composition API 模式
  locale: 'zh-TW',
  fallbackLocale: 'en',
  messages: {
    en: en,
    'zh-TW': zhTW,
  },
})
