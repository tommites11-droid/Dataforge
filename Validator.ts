import { ParseResult, ForgeSchema } from './types.js'

type Check<T> = (value: T) => string | null

class BaseSchema<T> implements ForgeSchema<T> {
  private checks: Check<T>[] = []
  
  constructor(private parser: (v: unknown) => T) {}

  protected addCheck(check: Check<T>) {
    this.checks.push(check)
    return this
  }

  parse(input: unknown): T {
    const res = this.safeParse(input)
    if (!res.success) throw new Error(JSON.stringify(res.errors))
    return res.data
  }

  safeParse(input: unknown): ParseResult<T> {
    try {
      const parsed = this.parser(input)
      for (const check of this.checks) {
        const msg = check(parsed)
        if (msg) return { success: false, errors: [{ path: '', message: msg }] }
      }
      return { success: true, data: parsed }
    } catch (e: any) {
      return { success: false, errors: [{ path: '', message: e.message }] }
    }
  }

  optional() {
    const self = this
    return new BaseSchema<T | undefined>((v) => {
      if (v === undefined) return undefined as T
      return self.parser(v)
    })
  }
}

export class StringSchema extends BaseSchema<string> {
  constructor() {
    super((v) => {
      if (typeof v !== 'string') throw new Error('Expected string')
      return v
    })
  }
  min(n: number, msg?: string) { return this.addCheck(v => v.length < n ? (msg || `Min ${n} chars`) : null) }
  max(n: number, msg?: string) { return this.addCheck(v => v.length > n ? (msg || `Max ${n} chars`) : null) }
  email(msg?: string) { return this.addCheck(v => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? (msg || 'Invalid email') : null) }
}

export class NumberSchema extends BaseSchema<number> {
  constructor() {
    super((v) => {
      if (typeof v !== 'number') throw new Error('Expected number')
      return v
    })
  }
  min(n: number, msg?: string) { return this.addCheck(v => v < n ? (msg || `Min ${n}`) : null) }
  max(n: number, msg?: string) { return this.addCheck(v => v > n ? (msg || `Max ${n}`) : null) }
}

export class ObjectSchema<T extends Record<string, any>> extends BaseSchema<T> {
  constructor(private shape: { [K in keyof T]: ForgeSchema<T[K]> }) {
    super((v) => {
      if (typeof v !== 'object' || v === null) throw new Error('Expected object')
      const result: any = {}
      const errors: any[] = []
      for (const key in shape) {
        const parsed = shape[key].safeParse((v as any)[key])
        if (!parsed.success) {
          errors.push(...parsed.errors.map(e => ({ path: key, message: e.message })))
        } else {
          result[key] = parsed.data
        }
      }
      if (errors.length) throw new Error(JSON.stringify(errors))
      return result as T
    })
  }
}
