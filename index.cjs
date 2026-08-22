const Application = require('@waline/vercel');

// 说说页评论路径（仅此路径启用"管理员评论不出现在评论区"）
const SHUOSHUO_PATH = `${(process.env.SHUOSHUO_PATH || '/shuoshuo/').replace(/\/+$/u, '')}/`;

const isAdminComment = (cmt) => Boolean(cmt) && cmt.type === 'administrator';

/**
 * 过滤 /api/comment（评论列表）响应：
 * - 默认（Waline 评论区）：剔除管理员评论（包含嵌套 children 中的管理员回复），count 同步扣除
 * - ?moments=1（说说列表）：只保留管理员评论
 * 仅对说说页路径生效，其他页面评论不受影响。
 */
function filterShuoshuoList(ctx) {
  const path = typeof ctx.query.path === 'string' ? ctx.query.path : '';
  if (path !== SHUOSHUO_PATH) {
    return;
  }

  let body = ctx.body;
  let jsonString = null;

  if (typeof body === 'string') {
    try {
      jsonString = body;
      body = JSON.parse(body);
    } catch {
      return;
    }
  }

  const list = body && body.data && body.data.data;
  if (!Array.isArray(list)) {
    return;
  }

  const wantAdmin = ctx.query.moments === '1' || ctx.query.moments === 'true';

  let removed = 0;
  for (const cmt of list) {
    const isAdmin = isAdminComment(cmt);
    if (wantAdmin ? !isAdmin : isAdmin) {
      removed += 1 + (Array.isArray(cmt.children) ? cmt.children.length : 0);
    }
  }

  if (removed === 0) {
    return;
  }

  body.data.data = list.filter((cmt) => (wantAdmin ? isAdminComment(cmt) : !isAdminComment(cmt)));

  if (!wantAdmin) {
    for (const cmt of body.data.data) {
      if (Array.isArray(cmt.children)) {
        cmt.children = cmt.children.filter((child) => !isAdminComment(child));
      }
    }
  }

  body.data.count = Math.max((Number(body.data.count) || 0) - removed, 0);

  if (jsonString !== null) {
    ctx.body = JSON.stringify(body);
  }
}

async function shuoshuoGuard(ctx, next) {
  await next();
  filterShuoshuoList(ctx);
}

module.exports = Application({
  plugins: [
    {
      middlewares: [shuoshuoGuard],
    },
  ],
  async postSave(comment) {
    // do what ever you want after comment saved
  },
});
