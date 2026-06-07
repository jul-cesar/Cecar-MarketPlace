import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

export type Problem = {
  type: string
  title: string
  status: ContentfulStatusCode
  detail?: string
}

export class HttpError extends Error {
  constructor(public readonly problem: Problem) {
    super(problem.detail ?? problem.title)
  }
}

export function httpError(problem: Problem): never {
  throw new HttpError(problem)
}

export function problem(c: Context, body: Problem) {
  return c.json(body, body.status, {
    'Content-Type': 'application/problem+json',
  })
}
