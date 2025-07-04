# SkyGuard 前端项目

## 项目简介

本项目为 SkyGuard 无人机防御系统的前端部分，基于 React + Vite + TailwindCSS 构建，提供系统的可视化界面与交互。

## 环境要求

- Node.js >= 16.x
- npm >= 8.x

## 安装依赖

```bash
npm install
```

## 启动开发服务器

```bash
npm run dev
```

启动后访问 <http://localhost:5173> 查看前端页面。

## 构建生产包

```bash
npm run build
```

构建完成后，静态文件位于 `dist/` 目录。

## 目录结构

```text
frontend/
├── public/           # 静态资源
├── src/              # 源码目录
│   ├── components/   # 通用组件
│   ├── lib/          # 工具函数
│   ├── pages/        # 页面组件
│   └── App.jsx       # 应用入口
├── index.html        # 主页面
├── package.json      # 项目依赖与脚本
└── ...
```

## 进一步开发指南

### 1. 代码规范

- 推荐使用 ESLint 和 Prettier 保持代码风格统一。
- 组件命名采用大驼峰（PascalCase），文件夹/文件名建议小写加中划线或驼峰。

### 2. 组件开发

- 通用 UI 组件放在 `src/components/ui/`，业务组件放在 `src/components/`。
- 推荐使用函数式组件和 React Hooks。

### 3. 页面开发

- 新页面建议在 `src/pages/` 下新建对应文件。
- 页面间跳转可使用 React Router（如有集成）。

### 4. 样式与主题

- 推荐使用 TailwindCSS 进行样式开发。
- 全局样式可在 `src/index.css` 中配置。

### 5. 状态管理

- 简单场景可用 React 内部状态。
- 复杂场景可引入 Zustand、Redux 等状态管理库。

### 6. 与后端交互

- 建议统一封装 API 请求，可在 `src/lib/` 下新建 `api.js`。
- 推荐使用 axios 或 fetch 进行数据请求。

### 7. 运行与调试

- 开发环境下支持热更新。
- 可通过浏览器开发者工具调试。

### 8. 依赖管理

- 新增依赖请及时更新 `package.json` 并注明用途。

### 9. 贡献与协作

- 建议使用 Git 进行版本管理，分支命名规范如 `feature/xxx`、`fix/xxx`。
- 合并代码前请自测并通过 lint 检查。

如需更多帮助，请查阅项目内其他文档或联系维护者。

