import type { Context } from 'hono'
import type { ZodError, ZodType } from 'zod'
import { httpError } from './problem.js'

export async function validateJson<TSchema extends ZodType>(
  c: Context,
  schema: TSchema,
) {
  try {
    const body = await c.req.json()

    return schema.parse(body) as TSchema['_output']
  } catch (error) {
    validationError(error)
  }
}

export function validateParams<TSchema extends ZodType>(
  c: Context,
  schema: TSchema,
) {
  try {
    return schema.parse(c.req.param()) as TSchema['_output']
  } catch (error) {
    validationError(error)
  }
}

export function validateQuery<TSchema extends ZodType>(
  c: Context,
  schema: TSchema,
) {
  try {
    return schema.parse(c.req.query()) as TSchema['_output']
  } catch (error) {
    validationError(error)
  }
}

function validationError(error: unknown): never {
  const detail = isZodError(error)
    ? error.issues
        .map((issue) => {
          const path = issue.path.join('.') || 'body'

          return `${path}: ${issue.message}`
        })
        .join('; ')
    : 'Request validation failed'

  httpError({
    type: 'validation-error',
    title: 'Validation failed',
    status: 400,
    detail,
  })
}

function isZodError(error: unknown): error is ZodError {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'issues' in error &&
      Array.isArray((error as { issues?: unknown }).issues),
  )
}
