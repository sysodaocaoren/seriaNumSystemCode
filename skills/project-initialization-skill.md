# Project Initialization Skill

## 技能概述

本 Skill 定义序列号管理系统的前端项目初始化规范，确保项目结构、技术栈和代码风格的一致性。

## 初始化约束

### 硬性约束

1. **技术栈锁定**
   - 构建工具：Vite（端口 5175）
   - 框架：React 18 + TypeScript 5
   - 样式：Tailwind CSS 3
   - 路由：React Router 6
   - 部署：Cloudflare Workers/Pages

2. **架构边界**
   - 纯前端项目，禁止创建后端服务
   - 禁止引入不必要的全栈框架
   - 数据存储使用浏览器 API 或 Cloudflare KV

3. **端口规范**
   - 开发服务器：5175（强制）
   - 不可使用其他端口

### 软性约束

1. **代码风格**
   - 函数式组件优先
   - 自定义 Hooks 抽离逻辑
   - 类型定义集中管理

2. **文件命名**
   - 组件：PascalCase（如 `SerialNumberList.tsx`）
   - 工具函数：camelCase（如 `formatDate.ts`）
   - 常量：UPPER_SNAKE_CASE

## 智能体执行要求

### 阶段 1：文档先行（当前阶段）

- [x] 创建 `docs/architecture.md`
- [x] 创建 `skills/project-initialization-skill.md`
- **禁止**：编写业务代码、创建工程文件

### 阶段 2：工程搭建

- [ ] 初始化 npm 项目
- [ ] 安装核心依赖（react, react-dom, typescript, vite）
- [ ] 安装开发依赖（@types/react, @vitejs/plugin-react, tailwindcss）
- [ ] 配置 TypeScript（tsconfig.json）
- [ ] 配置 Vite（vite.config.ts，端口 5175）
- [ ] 配置 Tailwind（tailwind.config.js, postcss.config.js）
- [ ] 创建目录结构
- [ ] 创建入口文件（index.html, main.tsx, App.tsx）
- [ ] 配置 ESLint + Prettier

### 阶段 3：构建校验

- [ ] 执行 `npm install`
- [ ] 执行 `npm run build`
- [ ] 验证构建产物
- [ ] 创建 `wrangler.toml`

### 阶段 4：完成确认

- [ ] 输出初始化结果报告
- [ ] 说明架构类型和技术栈
- [ ] 标记预留地址

## 代码规范模板

### 组件模板

```tsx
// src/components/ui/Button.tsx
import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
}) => {
  const baseStyles = 'px-4 py-2 rounded font-medium transition-colors';
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
};
```

### Hook 模板

```tsx
// src/hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}
```

### 类型定义模板

```ts
// src/types/serialNumber.ts
export interface SerialNumber {
  id: string;
  code: string;
  createdAt: Date;
  expiresAt?: Date;
  used: boolean;
  metadata?: Record<string, unknown>;
}

export type SerialNumberStatus = 'active' | 'expired' | 'used' | 'revoked';
```

## Vite 配置要求

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

## Tailwind 配置要求

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

## 依赖清单

### 生产依赖

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.20.0",
  "lucide-react": "^0.294.0"
}
```

### 开发依赖

```json
{
  "@types/react": "^18.2.43",
  "@types/react-dom": "^18.2.17",
  "@typescript-eslint/eslint-plugin": "^6.14.0",
  "@typescript-eslint/parser": "^6.14.0",
  "@vitejs/plugin-react": "^4.2.1",
  "autoprefixer": "^10.4.16",
  "eslint": "^8.55.0",
  "eslint-plugin-react-hooks": "^4.6.0",
  "eslint-plugin-react-refresh": "^0.4.5",
  "postcss": "^8.4.32",
  "tailwindcss": "^3.3.6",
  "typescript": "^5.2.2",
  "vite": "^5.0.8",
  "wrangler": "^3.19.0"
}
```

## 后续智能体注意事项

1. **不要过度设计**：保持精简，只实现核心功能
2. **优先使用浏览器 API**：localStorage、IndexedDB 等
3. **组件粒度适中**：避免过度拆分，也避免巨型组件
4. **类型优先**：先定义类型，再实现逻辑
5. **测试构建**：每次添加依赖后执行构建验证

---

**Skill 版本**: v1.0  
**适用项目**: 序列号管理系统  
**创建日期**: 2026-05-08
