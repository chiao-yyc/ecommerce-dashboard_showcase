// plugins/toastPlugin.ts
import type { App } from 'vue'
import { toast } from 'vue-sonner'

export const toastHelper = {
  success: (msg: string, options?: object) =>
    toast.success(msg, {
      description: 'Success',
      // style: {
      //   background: '#6ee7b7',
      // },
      ...options,
    }),
  info: (msg: string, options?: object) =>
    toast.info(msg, {
      ...options,
    }),
  warning: (msg: string, options?: object) =>
    toast.warning(msg, {
      ...options,
    }),
  error: (msg: string, options?: object) =>
    toast.error(msg, {
      // style: {
      //   background: '#fda4af',
      // },
      ...options,
    }),
  promise: (
    promise: Promise<any>,
    options?: {
      loading?: string | (() => string)
      success?: string | ((data: any) => string)
      error?: string | ((data: any) => string)
    },
  ) => {
    return toast.promise(promise, {
      loading: options?.loading ?? 'Loading...',
      success: options?.success ?? 'Success!',
      error: options?.error ?? 'Error occurred!',
    })
  },
}

export const systemToastHelper = {
  success: (msg: string, options?: object) => {
    toast.success(msg, {
      position: 'top-center',
      // style: {
      //   background: '#6ee7b7',
      // },
      ...options,
    })
  },
  warning: (msg: string, options?: object) => {
    toast.warning(msg, {
      position: 'top-center',
      ...options,
    })
  },
  error: (msg: string, options?: object) => {
    toast.error(msg, {
      position: 'top-center',
      // style: {
      //   background: '#fda4af',
      // },
      ...options,
    })
  },
  info: (msg: string, options?: object) => {
    toast.info(msg, {
      position: 'top-center',
      ...options,
    })
  },
  promise: (
    promise: Promise<any>,
    options?: {
      loading?: string | (() => string)
      success?: string | ((data: any) => string)
      error?: string | ((data: any) => string)
    },
  ) => {
    return toast.promise(promise, {
      loading: options?.loading ?? 'Loading...',
      success: options?.success ?? 'Success!',
      error: options?.error ?? 'Error occurred!',
    })
  },
}

export default {
  install(app: App) {
    app.config.globalProperties.$toast = toastHelper
    app.provide('notify', toastHelper)
    app.provide('toast', systemToastHelper)
  },
}
