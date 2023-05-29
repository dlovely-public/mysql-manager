/* eslint-disable @typescript-eslint/no-empty-interface */
// Global compile-time constants
declare const __DEV__: boolean
declare const __TEST__: boolean
declare const __FEATURE_PROD_DEVTOOLS__: boolean
declare const __BROWSER__: boolean
declare const __CI__: boolean
declare const __VUE_DEVTOOLS_TOAST__: (
  message: string,
  type?: 'normal' | 'error' | 'warn'
) => void

declare namespace MySql {
  export interface DataBase {}
  export interface Table {}
  export interface Column {}
}
