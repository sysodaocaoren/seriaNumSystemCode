import { handleRedeemCodeApiRequest } from '../../src/server/api-handler'
import { createD1Repository, ensureD1Schema } from '../../src/server/d1-repository'

type PagesContext = {
  request: Request
  env: {
    DB?: unknown
  }
}

export const onRequest = async (context: PagesContext) => {
  const { request, env } = context
  const url = new URL(request.url)

  try {
    if (!env.DB) {
      return Response.json(
        {
          success: false,
          error: 'Cloudflare D1 未绑定，请在 Pages 项目中配置名为 DB 的 D1 绑定。',
        },
        { status: 500 },
      )
    }

    await ensureD1Schema(env.DB as Parameters<typeof createD1Repository>[0])

    const body = ['POST', 'PUT', 'PATCH'].includes(request.method)
      ? await request.json().catch(() => ({}))
      : {}

    const result = await handleRedeemCodeApiRequest({
      method: request.method,
      pathname: url.pathname,
      searchParams: url.searchParams,
      body,
      repository: createD1Repository(env.DB as Parameters<typeof createD1Repository>[0]),
    })

    if (!result) {
      return Response.json({ success: false, error: '接口不存在' }, { status: 404 })
    }

    return Response.json(result.body, { status: result.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知异常'
    return Response.json(
      {
        success: false,
        error: `服务执行失败：${message}`,
      },
      { status: 500 },
    )
  }
}
