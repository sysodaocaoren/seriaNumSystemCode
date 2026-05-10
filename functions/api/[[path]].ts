import { handleRedeemCodeApiRequest } from '../../src/server/api-handler'
import { createD1Repository, ensureD1Schema } from '../../src/server/d1-repository'

type PagesContext = {
  request: Request
  env: {
    DB?: any
  }
}

export const onRequest = async (context: PagesContext) => {
  const { request, env } = context
  const url = new URL(request.url)

  if (!env.DB) {
    return Response.json(
      {
        success: false,
        error: 'Cloudflare D1 未绑定，请在 Pages 项目里添加名为 DB 的 D1 绑定。',
      },
      { status: 500 },
    )
  }

  await ensureD1Schema(env.DB)

  const body = ['POST', 'PUT', 'PATCH'].includes(request.method)
    ? await request.json().catch(() => ({}))
    : {}

  const result = await handleRedeemCodeApiRequest({
    method: request.method,
    pathname: url.pathname,
    searchParams: url.searchParams,
    body,
    repository: createD1Repository(env.DB),
  })

  if (!result) {
    return Response.json({ success: false, error: '接口不存在' }, { status: 404 })
  }

  return Response.json(result.body, { status: result.status })
}
