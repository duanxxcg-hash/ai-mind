<template>
    <el-aside  :width="isCollapse ? '64px' : '264px'">
        <el-menu
        :collapse="isCollapse"
        :collapse-transition="false"
        default-active="2"
        class="menu-style"
        
      >
      <div class="brand">
        <el-image style="width: 50px; height: 50px; margin-right: 10px;" :src="iconUrl" alt="logo"/>
        <div v-show="!isCollapse" class="info-card">
          <h1 class="brand-title">心理健康AI助手</h1>
          <p class="brand-subtitle">管理后台</p>
        </div>
      </div>
         <el-menu-item @click="selectMenu" v-for="item in router.options.routes[0].children" :key="item.path" :index="item.path">
          <el-icon><component :is="item.meta.icon" /></el-icon>
          <span>{{ item.meta.title }}</span>
        </el-menu-item>
        
      </el-menu>
    </el-aside>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAdminStore } from '../stores/admin';
import { computed } from 'vue';

const iconUrl = new URL('@/assets/images/机器人.png',import.meta.url).href
const router = useRouter();
const adminStore = useAdminStore();

/**
 * 响应式计算属性，用于获取侧边栏的折叠状态
 * 
 * 使用 computed 包装的原因：
 * 1. 当 adminStore.isCollapse 变化时，自动触发组件重新渲染
 * 2. 提供响应式链接，确保视图层与状态管理层的数据同步
 * 3. 避免直接访问 store，增强代码的可维护性和解耦性
 * 4. computed 会缓存计算结果，只在依赖项变化时才重新计算，性能更优
 * 
 * // ref() 的工作原理
    const isCollapse = ref(adminStore.isCollapse)  
    // 只执行一次，copy 了初始值
 */
const isCollapse = computed(()=> adminStore.isCollapse) 

//使用点击事件实现菜单的路由跳转
const selectMenu = (key)=>{
  console.log(key)
  const currentRoute=router.options.routes[0];
  router.push(`${currentRoute.path}/${key.index}`);
};

</script>

<style lang="scss" scoped>
.menu-style
{
  height: 100%;
  .brand {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  background-color: #fff;
  border-bottom: 1px solid #e5e7eb;

  .info-card {
    .brand-title {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 5px;
      color: #1f2937;
    }
  }
  .brand-subtitle
  {
    font-size: 14px;
    color: #6b7280;
  }
}
}
</style>