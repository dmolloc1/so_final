import toast, { type ToastOptions } from 'react-hot-toast'

const defaultOptions: ToastOptions = {
  duration: 4000,
  position: 'top-right',
}

const buildOptions = (options?: ToastOptions) => ({
  ...defaultOptions,
  ...options,
})

export const notifySuccess = (message: string, options?: ToastOptions) =>
  toast.success(message, buildOptions(options))

export const notifyError = (message: string, options?: ToastOptions) =>
  toast.error(message, buildOptions(options))

export const notifyInfo = (message: string, options?: ToastOptions) =>
  toast(message, buildOptions(options))

export const notifyWarning = (message: string, options?: ToastOptions) =>
  toast(message, {
    ...buildOptions(options),
    icon: '⚠️',
  })

