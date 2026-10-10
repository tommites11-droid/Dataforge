import { StringSchema, NumberSchema, ObjectSchema } from './validator.js'

export const forge = {
  string: () => new StringSchema(),
  number: () => new NumberSchema(),
  object: <T extends Record<string, any>>(shape: { [K in keyof T]: any }) => new ObjectSchema<T>(shape)
}

export * from './types.js'
export * from './validator.js'

// Esempio d'uso edge-ready
export const version = '1.2.0'
