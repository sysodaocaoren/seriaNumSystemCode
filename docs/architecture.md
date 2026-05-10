# 序列号管理系统 - 技术架构文档

## 1. 应用类型

**Web 网站 - 纯前端单页应用（SPA）**

- 架构类型：**只要前端**
- 交付形式：静态网站，可部署至 Cloudflare Workers/Pages
- 无后端服务，数据存储考虑使用 Cloudflare KV 或前端本地存储

## 2. 技术选型

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 构建工具 | Vite | ^5.x | 快速开发服务器与生产构建 |
| 框架 | React | ^18.x | UI 组件与状态管理 |
| 语言 | TypeScript | ^5.x | 类型安全 |
| 样式 | Tailwind CSS | ^3.x | 原子化 CSS 框架 |
| 路由 | React Router | ^6.x | 客户端路由 |
| 图标 | Lucide React | ^0.x | 图标库 |

### Cloudflare Workers 部署适配

- 使用 `wrangler` CLI 进行部署
- 输出目录：`dist/`（Vite 默认）
- 部署配置：`wrangler.toml`
- 静态资源托管：Cloudflare Pages 或 Workers Sites

## 3. 目录结构

```
seriaNumSystem/
├── docs/                      # 项目文档
│   └── architecture.md        # 本文件
├── public/                    # 静态资源
│   └── favicon.ico
├── src/
│   ├── components/            # 通用组件
│   │   ├── ui/               # 基础 UI 组件
│   │   └── layout/           # 布局组件
│   ├── pages/                # 页面组件
│   ├── hooks/                # 自定义 Hooks
│   ├── utils/                # 工具函数
│   ├── types/                # TypeScript 类型定义
│   ├── constants/            # 常量定义
│   ├── styles/               # 全局样式
│   ├── App.tsx               # 根组件
│   └── main.tsx              # 入口文件
├── index.html                 # HTML 模板
├── vite.config.ts            # Vite 配置
├── tailwind.config.js        # Tailwind 配置
├── tsconfig.json             # TypeScript 配置
├── package.json              # 依赖管理
└── wrangler.toml             # Cloudflare 部署配置
```

## 4. 启动方式

### 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器（端口 5175）
npm run dev

# 访问地址
http://127.0.0.1:5175
```

### 生产构建

```bash
# 构建生产版本
npm run build

# 构建输出目录
dist/
```

### Cloudflare 部署

```bash
# 登录 Cloudflare
npx wrangler login

# 部署到 Workers/Pages
npx wrangler deploy
# 或
npx wrangler pages deploy dist
```

## 5. 验收标准

### 5.1 工程标准

- [ ] `npm install` 安装成功，无依赖冲突
- [ ] `npm run build` 构建成功，无 TypeScript 错误
- [ ] `dist/` 目录生成，包含完整静态资源
- [ ] 开发服务器可在 5175 端口正常启动

### 5.2 代码规范

- [ ] TypeScript 严格模式启用
- [ ] ESLint + Prettier 配置完成
- [ ] 组件使用函数式组件 + Hooks
- [ ] 类型定义完整，无 `any` 滥用

### 5.3 部署就绪

- [ ] `wrangler.toml` 配置正确
- [ ] 静态资源路径配置正确
- [ ] 构建产物可直接部署到 Cloudflare

## 6. 架构取舍说明

**为什么选择"只要前端"？**

1. 项目定位为精简工具型应用，核心需求是序列号的生成、验证、管理
2. 用户明确选择纯前端方案，符合"小巧轻盈"的设计目标
3. Cloudflare Workers 提供边缘计算能力，无需独立后端服务器
4. 数据持久化可通过 Cloudflare KV 或浏览器本地存储实现

**技术栈选择理由：**

- **Vite**：启动快、热更新快、配置简单，适合快速开发
- **React + TypeScript**：生态成熟，类型安全，维护性好
- **Tailwind CSS**：原子化 CSS，无需维护大量样式文件，构建产物小
- **Cloudflare Workers**：边缘部署，全球 CDN，免费额度充足

---

**文档版本**: v1.0  
**创建日期**: 2026-05-08  
**适用阶段**: 项目初始化
