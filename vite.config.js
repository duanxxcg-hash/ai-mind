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
