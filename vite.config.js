import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Vite 8 底层 Rolldown，manualChunks 必须为函数；按依赖类别拆独立 chunk
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          // element-plus 内部包含 'vue' 子串，所以必须放在 vue 判断之前
          if (id.includes('element-plus') || id.includes('@element-plus')) {
            return 'vendor-element'
          }
          if (id.includes('echarts') || id.includes('zrender')) {
            return 'vendor-echarts'
          }
          if (id.includes('lodash-es')) {
            return 'vendor-lodash'
          }
          if (id.includes('@wangeditor')) {
            return 'vendor-wangeditor'
          }
          if (id.includes('@microsoft')) {
            return 'vendor-fetch-event-source'
          }
          if (id.includes('axios')) {
            return 'vendor-axios'
          }
          if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router') || id.includes('@vue')) {
            return 'vendor-vue'
          }
          // 其余 node_modules 统一归入 vendor-common
          return 'vendor-common'
        },
      },
    },
  },
  server: {
    proxy: {
      '/files': {
        target: 'http://159.75.169.224:1235',
        changeOrigin: true
      },
      '/api': {
        target: 'http://159.75.169.224:1235', //后端接口地址
        changeOrigin: true, //是否跨域
        bypass: (req) => {
          // /api/ai-search 由 Vercel Function 处理，不走课程后端代理
          if (req.url?.startsWith('/api/ai-search')) {
            return req.url
          }
          return null
        }
      }
    }
  }
})
