export type ParseSuccess<T> = { success: true; data: T }
export type ParseError = { success: false; errors: { path: string; message: string }[] }
export type ParseResult<T> = ParseSuccess<T> | ParseError

export interface ForgeSchema<T> {
  parse(input: unknown): T
  safeParse(input: unknown): ParseResult<T>
}
