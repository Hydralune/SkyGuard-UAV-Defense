<template>
  <div class="result-display">
    <el-row :gutter="20">
      <!-- 左侧：原始图像和结果 -->
      <el-col :span="12">
        <el-card shadow="hover" class="result-card">
          <template #header>
            <div class="card-header">
              <span>原始图像</span>
              <el-tag size="small" type="info">{{ getCardTitle('before') }}</el-tag>
            </div>
          </template>
          <div class="image-container">
            <img v-if="results.beforeImage" :src="results.beforeImage" alt="原始图像" class="result-image" />
            <div v-else class="image-placeholder">
              <el-icon><Picture /></el-icon>
              <span>等待结果...</span>
            </div>
          </div>
          <div class="detection-info" v-if="results.beforeDetections && results.beforeDetections.length > 0">
            <div class="detection-title">检测结果</div>
            <el-table :data="results.beforeDetections" size="small" :show-header="false">
              <el-table-column prop="label" label="标签" width="100">
                <template #default="{ row }">
                  <el-tag size="small">{{ row.label }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="confidence" label="置信度">
                <template #default="{ row }">
                  <el-progress :percentage="Math.round(row.confidence * 100)" :stroke-width="10" />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：处理后的图像和结果 -->
      <el-col :span="12">
        <el-card shadow="hover" class="result-card">
          <template #header>
            <div class="card-header">
              <span>{{ getActionName() }}后</span>
              <el-tag size="small" type="primary">{{ getCardTitle('after') }}</el-tag>
            </div>
          </template>
          <div class="image-container">
            <img v-if="results.afterImage" :src="results.afterImage" alt="处理后图像" class="result-image" />
            <div v-else-if="loading" class="image-placeholder loading">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>处理中...</span>
            </div>
            <div v-else class="image-placeholder">
              <el-icon><Picture /></el-icon>
              <span>等待结果...</span>
            </div>
          </div>
          <div class="detection-info" v-if="results.afterDetections && results.afterDetections.length > 0">
            <div class="detection-title">检测结果</div>
            <el-table :data="results.afterDetections" size="small" :show-header="false">
              <el-table-column prop="label" label="标签" width="100">
                <template #default="{ row }">
                  <el-tag size="small">{{ row.label }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="confidence" label="置信度">
                <template #default="{ row }">
                  <el-progress :percentage="Math.round(row.confidence * 100)" :stroke-width="10" />
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div v-else-if="results.afterImage && (!results.afterDetections || results.afterDetections.length === 0)" class="no-detection">
            <el-empty description="未检测到目标" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 效果分析 -->
    <el-card v-if="hasResults" shadow="hover" class="analysis-card">
      <template #header>
        <div class="card-header">
          <span>效果分析</span>
        </div>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="场景类型">{{ getScenarioTypeLabel() }}</el-descriptions-item>
        <el-descriptions-item label="算法">{{ results.algorithm || '-' }}</el-descriptions-item>
        <el-descriptions-item label="检测总数变化">
          <span class="detection-count">
            {{ results.beforeDetections ? results.beforeDetections.length : 0 }} → 
            {{ results.afterDetections ? results.afterDetections.length : 0 }}
          </span>
          <span class="detection-change" :class="getDetectionChangeClass()">
            ({{ getDetectionChangeText() }})
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="平均置信度变化">
          <span class="confidence-change" :class="getConfidenceChangeClass()">
            {{ getAverageConfidenceBefore() }}% → {{ getAverageConfidenceAfter() }}%
            ({{ getConfidenceChangeText() }})
          </span>
        </el-descriptions-item>
      </el-descriptions>

      <div class="effectiveness-container" v-if="scenarioType === 'attack' || scenarioType === 'defense'">
        <div class="effectiveness-title">{{ scenarioType === 'attack' ? '攻击' : '防御' }}效果评分</div>
        <el-progress 
          :percentage="getEffectivenessScore()" 
          :status="getEffectivenessStatus()"
          :stroke-width="15"
          :format="(percentage) => `${percentage}%`" />
      </div>
    </el-card>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'

export default defineComponent({
  name: 'ResultDisplay',
  props: {
    // 场景类型: attack, interference, defense
    scenarioType: {
      type: String,
      required: true
    },
    // 结果数据
    results: {
      type: Object,
      default: () => ({})
    },
    // 是否加载中
    loading: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    // 是否有结果
    const hasResults = computed(() => {
      return props.results.beforeImage && props.results.afterImage
    })

    // 获取动作名称
    const getActionName = () => {
      switch (props.scenarioType) {
        case 'attack':
          return '攻击';
        case 'interference':
          return '干扰';
        case 'defense':
          return '防御';
        default:
          return '处理';
      }
    }

    // 获取场景类型标签
    const getScenarioTypeLabel = () => {
      switch (props.scenarioType) {
        case 'attack':
          return '对抗攻击';
        case 'interference':
          return '环境干扰';
        case 'defense':
          return '对抗防御';
        default:
          return '未知场景';
      }
    }

    // 获取卡片标题
    const getCardTitle = (type) => {
      if (type === 'before') {
        return '原始检测';
      }
      
      switch (props.scenarioType) {
        case 'attack':
          return '攻击后检测';
        case 'interference':
          return '干扰后检测';
        case 'defense':
          return '防御后检测';
        default:
          return '处理后检测';
      }
    }

    // 获取检测数量变化文本
    const getDetectionChangeText = () => {
      const beforeCount = props.results.beforeDetections ? props.results.beforeDetections.length : 0;
      const afterCount = props.results.afterDetections ? props.results.afterDetections.length : 0;
      const diff = afterCount - beforeCount;

      if (diff === 0) return '无变化';
      if (diff > 0) return `+${diff}`;
      return diff.toString();
    }

    // 获取检测数量变化样式
    const getDetectionChangeClass = () => {
      const beforeCount = props.results.beforeDetections ? props.results.beforeDetections.length : 0;
      const afterCount = props.results.afterDetections ? props.results.afterDetections.length : 0;
      const diff = afterCount - beforeCount;

      if (props.scenarioType === 'attack') {
        // 攻击模式：减少检测是成功
        return diff < 0 ? 'success' : diff > 0 ? 'danger' : '';
      } else if (props.scenarioType === 'defense') {
        // 防御模式：保持或增加检测是成功
        return diff >= 0 ? 'success' : 'danger';
      }
      
      // 干扰模式：只显示变化不评价
      return diff < 0 ? 'danger' : diff > 0 ? 'success' : '';
    }

    // 计算平均置信度
    const getAverageConfidenceBefore = () => {
      if (!props.results.beforeDetections || props.results.beforeDetections.length === 0) {
        return 0;
      }
      
      const sum = props.results.beforeDetections.reduce((total, item) => total + item.confidence, 0);
      return Math.round(sum / props.results.beforeDetections.length * 100);
    }

    const getAverageConfidenceAfter = () => {
      if (!props.results.afterDetections || props.results.afterDetections.length === 0) {
        return 0;
      }
      
      const sum = props.results.afterDetections.reduce((total, item) => total + item.confidence, 0);
      return Math.round(sum / props.results.afterDetections.length * 100);
    }

    // 获取置信度变化文本
    const getConfidenceChangeText = () => {
      const before = getAverageConfidenceBefore();
      const after = getAverageConfidenceAfter();
      const diff = after - before;

      if (Math.abs(diff) < 1) return '无变化';
      if (diff > 0) return `+${diff}%`;
      return `${diff}%`;
    }

    // 获取置信度变化样式
    const getConfidenceChangeClass = () => {
      const before = getAverageConfidenceBefore();
      const after = getAverageConfidenceAfter();
      const diff = after - before;

      if (props.scenarioType === 'attack') {
        // 攻击模式：降低置信度是成功
        return diff < 0 ? 'success' : diff > 0 ? 'danger' : '';
      } else if (props.scenarioType === 'defense') {
        // 防御模式：保持或提高置信度是成功
        return diff >= 0 ? 'success' : 'danger';
      }
      
      // 干扰模式：只显示变化不评价
      return diff < 0 ? 'danger' : diff > 0 ? 'success' : '';
    }

    // 计算攻击/防御效果得分
    const getEffectivenessScore = () => {
      if (!hasResults.value) return 0;
      
      const beforeCount = props.results.beforeDetections ? props.results.beforeDetections.length : 0;
      const afterCount = props.results.afterDetections ? props.results.afterDetections.length : 0;
      const beforeConf = getAverageConfidenceBefore();
      const afterConf = getAverageConfidenceAfter();
      
      if (props.scenarioType === 'attack') {
        // 攻击效果评分：检测数量减少和置信度降低都会提高分数
        // 最佳结果是没有检测 (100分)
        if (afterCount === 0) return 100;
        
        // 计算检测数量的减少比例
        const countScore = afterCount >= beforeCount ? 0 : (1 - afterCount / beforeCount) * 60;
        
        // 计算置信度的降低比例
        const confScore = afterConf >= beforeConf ? 0 : (1 - afterConf / Math.max(beforeConf, 1)) * 40;
        
        return Math.round(countScore + confScore);
      } else if (props.scenarioType === 'defense') {
        // 防御效果评分：保持或增加检测数量和置信度会提高分数
        // 如果原始检测数量为0，无法评估
        if (beforeCount === 0) return 0;
        
        // 计算检测数量的保持比例
        const countScore = afterCount / beforeCount * 60;
        
        // 计算置信度的保持比例
        const confScore = beforeConf === 0 ? 40 : Math.min(afterConf / beforeConf, 1) * 40;
        
        return Math.round(Math.min(countScore + confScore, 100));
      }
      
      return 0;
    }

    // 获取效果评分状态
    const getEffectivenessStatus = () => {
      const score = getEffectivenessScore();
      if (score >= 80) return 'success';
      if (score >= 40) return 'warning';
      return 'exception';
    }

    return {
      hasResults,
      getActionName,
      getScenarioTypeLabel,
      getCardTitle,
      getDetectionChangeText,
      getDetectionChangeClass,
      getAverageConfidenceBefore,
      getAverageConfidenceAfter,
      getConfidenceChangeText,
      getConfidenceChangeClass,
      getEffectivenessScore,
      getEffectivenessStatus
    }
  }
})
</script>

<style scoped>
.result-display {
  margin-top: 20px;
}

.result-card {
  height: 100%;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  overflow: hidden;
  margin-bottom: 10px;
}

.result-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  color: #909399;
  font-size: 14px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.image-placeholder .el-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.detection-info {
  margin-top: 10px;
  border-top: 1px solid #ebeef5;
  padding-top: 10px;
}

.detection-title {
  font-weight: bold;
  margin-bottom: 10px;
}

.analysis-card {
  margin-top: 10px;
}

.detection-change, .confidence-change {
  margin-left: 5px;
}

.detection-change.success, .confidence-change.success {
  color: #67c23a;
}

.detection-change.danger, .confidence-change.danger {
  color: #f56c6c;
}

.no-detection {
  margin-top: 20px;
}

.effectiveness-container {
  margin-top: 20px;
}

.effectiveness-title {
  font-weight: bold;
  margin-bottom: 10px;
}
</style> 