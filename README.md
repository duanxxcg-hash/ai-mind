# AI-mind 心理健康陪伴平台

> 基于 Vue 3 的 AI 心理健康陪伴前端项目，提供流式 AI 对话、情绪日记、知识文章等功能。

**在线预览：** [https://ai-mind-two.vercel.app](https://ai-mind-two.vercel.app)

## 技术栈

- **框架：** Vue 3 (Composition API + `<script setup>`)
- **状态管理：** Pinia
- **路由：** Vue Router 4（含路由守卫）
- **UI 组件库：** Element Plus
- **HTTP 请求：** Axios（请求/响应拦截器）
- **AI 流式对话：** `@microsoft/fetch-event-source`（SSE）
- **构建工具：** Vite
- **部署：** Vercel

## 核心功能

- **AI 流式对话**：基于 SSE 实现打字机效果的实时 AI 回复，支持多会话管理
- **情绪分析**：每次对话后自动分析用户情绪状态，展示情绪评分与建议
- **情绪日记**：记录每日心情，支持情绪标签选择与历史回顾
- **知识文章**：心理健康科普文章浏览
- **用户系统**：注册、登录、路由鉴权（普通用户 / 管理员双角色）

## 项目亮点

- SSE 流式对话使用 `streamCompleted` 标志位防止断线重连导致内容重复
- Axios 响应拦截器统一处理 token 过期跳转，区分登录态与未登录态的错误处理
- 聊天区域使用 `nextTick` 确保 DOM 更新后再执行自动滚动
- Vercel 部署配置 API 反向代理，解决跨域问题

## 本地运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

> 注意：AI 对话功能依赖后端服务，本地运行需配置对应接口地址。
