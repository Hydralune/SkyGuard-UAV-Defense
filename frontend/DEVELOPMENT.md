# SkyGuard UAV Defense 前端开发指南

本指南提供前端开发环境设置和项目架构概览。

## 开发环境设置

### 前提条件

- Node.js v16+
- npm v8+
- Git

### 安装步骤

1. 克隆仓库（如果尚未克隆）
```bash
git clone https://github.com/Hydralune/SkyGuard-UAV-Defense.git
cd SkyGuard-UAV-Defense
```

2. 安装前端依赖
```bash
cd frontend
npm install
```

3. 启动开发服务器
```bash
npm run serve
```

4. 打开浏览器访问 http://localhost:8080

## 项目架构

### 技术栈

- **Vue 3** - 核心框架
- **Element Plus** - UI组件库
- **Vue Router** - 路由管理
- **Pinia** - 状态管理
- **Axios** - API请求

### 目录结构

```
frontend/
├── public/                  # 静态资源目录
├── src/                     # 源代码目录
│   ├── api/                 # API接口
│   ├── assets/              # 资源文件(图片、样式等)
│   ├── components/          # 通用组件
│   │   ├── layout/          # 布局组件
│   │   ├── scenario/        # 场景相关组件
│   │   └── visualization/   # 可视化组件
│   ├── views/               # 页面视图
│   │   ├── attack/          # 对抗攻击页面
│   │   ├── defense/         # 对抗防御页面
│   │   ├── interference/    # 环境干扰页面
│   │   ├── dashboard/       # 主控制台页面
│   │   └── reports/         # 评分报告页面
│   ├── store/               # Pinia状态管理
│   ├── utils/               # 工具函数
│   ├── router/              # 路由配置
│   ├── App.vue              # 根组件
│   └── main.js              # 入口文件
└── package.json             # 项目依赖
```

### 关键组件说明

1. **AppLayout** (`components/layout/AppLayout.vue`)
   - 提供应用的整体布局
   - 包含侧边导航栏和顶部标题栏

2. **ScenarioForm** (`components/scenario/ScenarioForm.vue`)
   - 通用场景配置表单
   - 根据场景类型动态呈现不同的选项和参数

3. **ResultDisplay** (`components/visualization/ResultDisplay.vue`)
   - 显示攻击/干扰/防御结果
   - 提供原始图像和处理后图像的对比展示

## 开发规范

### 命名规范

- **文件命名**: 
  - 组件使用PascalCase: `AppLayout.vue`
  - 其他JS文件使用camelCase: `apiService.js`
  
- **组件命名**:
  - 使用PascalCase: `export default { name: 'ScenarioForm' }`

### 代码风格

- 使用ESLint规则检查代码
- 函数优先使用箭头函数
- 使用Vue 3组合式API (Composition API)
- 优先使用`<script setup>`语法糖

### 组件开发规范

1. 组件应尽可能小且专注于单一职责
2. 公共组件放在`components`目录
3. 页面级组件放在`views`目录
4. 组件props需要定义类型和默认值
5. 事件命名使用kebab-case，例如`@form-submit`

## 后端API集成

前端通过`api/index.js`中定义的方法与后端通信。主要API端点：

- `/api/execute/attack` - 执行对抗攻击
- `/api/execute/interfere` - 执行环境干扰
- `/api/execute/defend` - 执行对抗防御
- `/api/tasks/:id` - 获取任务状态
- `/api/results/:id` - 获取任务结果

## 路由结构

应用定义了以下路由:

- `/` - 仪表板页面
- `/attack` - 对抗攻击页面
- `/interference` - 环境干扰页面
- `/defense` - 对抗防御页面
- `/reports` - 评分报告页面

## 构建与部署

### 构建项目

```bash
npm run build
```

构建后的文件将输出到`dist`目录，可以通过Nginx或其他Web服务器部署。

### Docker部署

项目使用Docker Compose进行部署，前端构建结果会被Nginx容器挂载和提供服务。详细配置见项目根目录的`docker-compose.yml`。 