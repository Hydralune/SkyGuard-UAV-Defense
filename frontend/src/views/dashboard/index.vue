<template>
  <app-layout>
    <div class="dashboard-container">
      <el-row :gutter="20">
        <!-- 统计卡片 -->
        <el-col :span="6" v-for="(card, index) in statsCards" :key="index">
          <el-card shadow="hover" class="stats-card">
            <div class="stats-icon" :class="card.color">
              <el-icon :size="36"><component :is="card.icon" /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-title">{{ card.title }}</div>
              <div class="stats-value">{{ card.value }}</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="mt-20">
        <!-- 最近任务列表 -->
        <el-col :span="16">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span>最近演练任务</span>
                <el-button type="primary" size="small">查看全部</el-button>
              </div>
            </template>
            <el-table :data="recentTasks" border style="width: 100%">
              <el-table-column prop="id" label="任务ID" width="120" />
              <el-table-column prop="name" label="任务名称" width="180" />
              <el-table-column prop="type" label="任务类型" />
              <el-table-column prop="status" label="状态">
                <template #default="{ row }">
                  <el-tag :type="row.statusType">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createTime" label="创建时间" />
            </el-table>
          </el-card>
        </el-col>

        <!-- 快速入口 -->
        <el-col :span="8">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span>快速操作</span>
              </div>
            </template>
            <div class="quick-action-list">
              <el-button v-for="(action, index) in quickActions" :key="index" 
                         type="primary" plain class="quick-action-btn"
                         @click="navigateTo(action.path)">
                <el-icon><component :is="action.icon" /></el-icon>
                {{ action.name }}
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </app-layout>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'

export default defineComponent({
  name: 'Dashboard',
  components: {
    AppLayout
  },
  setup() {
    const router = useRouter()

    // 统计卡片数据
    const statsCards = ref([
      { title: '成功防御次数', value: '56', icon: 'Check', color: 'success' },
      { title: '攻击尝试次数', value: '127', icon: 'Warning', color: 'warning' },
      { title: '正在进行任务', value: '3', icon: 'Loading', color: 'info' },
      { title: '系统运行时间', value: '16天', icon: 'Timer', color: 'primary' }
    ])

    // 最近任务数据
    const recentTasks = ref([
      { id: 'T001', name: 'YOLOv5 PGD攻击', type: '对抗攻击', status: '已完成', statusType: 'success', createTime: '2025-07-01 10:30' },
      { id: 'T002', name: '亮度干扰测试', type: '环境干扰', status: '已完成', statusType: 'success', createTime: '2025-07-02 14:22' },
      { id: 'T003', name: 'SkyGuard防御测试', type: '对抗防御', status: '进行中', statusType: 'primary', createTime: '2025-07-03 09:15' },
      { id: 'T004', name: '场景跃变模拟', type: '环境干扰', status: '等待中', statusType: 'info', createTime: '2025-07-03 18:05' }
    ])

    // 快速操作入口
    const quickActions = ref([
      { name: '开始攻击演练', path: '/attack', icon: 'Lightning' },
      { name: '开始防御演练', path: '/defense', icon: 'Shield' },
      { name: '查看评分报告', path: '/reports', icon: 'DataAnalysis' }
    ])

    // 页面跳转
    const navigateTo = (path) => {
      router.push(path)
    }

    return {
      statsCards,
      recentTasks,
      quickActions,
      navigateTo
    }
  }
})
</script>

<style scoped>
.dashboard-container {
  padding: 10px 0;
}

.stats-card {
  height: 100px;
  display: flex;
  align-items: center;
  padding: 20px;
}

.stats-icon {
  margin-right: 15px;
  padding: 12px;
  border-radius: 8px;
}

.stats-icon.success {
  background-color: rgba(103, 194, 58, 0.15);
  color: #67c23a;
}

.stats-icon.warning {
  background-color: rgba(230, 162, 60, 0.15);
  color: #e6a23c;
}

.stats-icon.info {
  background-color: rgba(144, 147, 153, 0.15);
  color: #909399;
}

.stats-icon.primary {
  background-color: rgba(64, 158, 255, 0.15);
  color: #409eff;
}

.stats-info {
  flex: 1;
}

.stats-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.stats-value {
  font-size: 24px;
  font-weight: bold;
}

.mt-20 {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quick-action-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quick-action-btn {
  width: 100%;
  justify-content: flex-start;
}
</style> 