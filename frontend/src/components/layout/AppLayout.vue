<template>
  <div class="app-layout">
    <el-container>
      <!-- 侧边栏 -->
      <el-aside width="220px" class="aside">
        <div class="logo-container">
          <h1>SkyGuard</h1>
        </div>
        <el-menu
          :default-active="activeMenu"
          router
          background-color="#001529"
          text-color="#fff"
          active-text-color="#409EFF"
        >
          <el-menu-item index="/">
            <el-icon><el-icon-monitor /></el-icon>
            <span>控制台</span>
          </el-menu-item>
          <el-menu-item index="/attack">
            <el-icon><el-icon-lightning /></el-icon>
            <span>对抗攻击</span>
          </el-menu-item>
          <el-menu-item index="/interference">
            <el-icon><el-icon-warning /></el-icon>
            <span>环境干扰</span>
          </el-menu-item>
          <el-menu-item index="/defense">
            <el-icon><el-icon-shield /></el-icon>
            <span>对抗防御</span>
          </el-menu-item>
          <el-menu-item index="/reports">
            <el-icon><el-icon-data-analysis /></el-icon>
            <span>评分报告</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区 -->
      <el-container>
        <!-- 顶部标题栏 -->
        <el-header height="60px" class="header">
          <div class="header-title">{{ pageTitle }}</div>
          <div class="header-actions">
            <el-button-group>
              <el-button type="primary" size="small">资源调度</el-button>
              <el-button type="primary" size="small">评分报告</el-button>
              <el-button type="primary" size="small">任务监控</el-button>
              <el-button type="primary" size="small">系统管理</el-button>
            </el-button-group>
          </div>
        </el-header>

        <!-- 内容区 -->
        <el-main>
          <slot></slot>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { useRoute } from 'vue-router'

export default defineComponent({
  name: 'AppLayout',
  setup() {
    const route = useRoute()
    
    // 当前活动菜单项
    const activeMenu = computed(() => route.path)
    
    // 页面标题
    const pageTitle = computed(() => route.meta.title || '')
    
    return {
      activeMenu,
      pageTitle
    }
  }
})
</script>

<style scoped>
.app-layout {
  height: 100%;
}

.aside {
  background-color: #001529;
  height: 100vh;
  overflow-y: auto;
}

.logo-container {
  height: 60px;
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header {
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.header-title {
  font-size: 18px;
  font-weight: bold;
}

.el-main {
  padding: 20px;
  background-color: #f0f2f5;
}
</style> 