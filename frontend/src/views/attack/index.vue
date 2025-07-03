<template>
  <app-layout>
    <div class="attack-page">
      <el-row :gutter="20">
        <!-- 左侧：场景表单 -->
        <el-col :span="8">
          <el-card shadow="never" class="form-card">
            <template #header>
              <div class="card-header">
                <span>对抗攻击配置</span>
              </div>
            </template>
            
            <scenario-form 
              defaultType="attack" 
              @start-scenario="handleStartScenario" />
          </el-card>
        </el-col>
        
        <!-- 右侧：结果展示 -->
        <el-col :span="16">
          <result-display 
            scenarioType="attack" 
            :results="results" 
            :loading="loading" />
        </el-col>
      </el-row>
    </div>
  </app-layout>
</template>

<script>
import { defineComponent, ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import AppLayout from '@/components/layout/AppLayout.vue'
import ScenarioForm from '@/components/scenario/ScenarioForm.vue'
import ResultDisplay from '@/components/visualization/ResultDisplay.vue'

export default defineComponent({
  name: 'AttackPage',
  components: {
    AppLayout,
    ScenarioForm,
    ResultDisplay
  },
  setup() {
    // 加载状态
    const loading = ref(false)
    
    // 结果数据
    const results = reactive({
      beforeImage: null,
      afterImage: null,
      beforeDetections: [],
      afterDetections: [],
      algorithm: '',
      params: {}
    })
    
    // 开始场景处理
    const handleStartScenario = async (formData) => {
      try {
        loading.value = true
        
        // 清除之前的结果
        results.afterImage = null
        results.afterDetections = []
        
        // 保存算法信息
        results.algorithm = formData.algorithm
        results.params = { ...formData.params }
        
        // 创建表单数据
        const formPayload = new FormData()
        formPayload.append('image', formData.image)
        formPayload.append('model', formData.model)
        formPayload.append('algorithm', formData.algorithm)
        formPayload.append('params', JSON.stringify(formData.params))
        
        // 模拟API调用：在实际实现中，使用axios发起请求
        // const response = await axios.post('/api/execute/attack', formPayload)
        
        // 模拟API响应
        await simulateApiResponse()
        
        ElMessage.success('攻击执行成功')
      } catch (error) {
        console.error(error)
        ElMessage.error('执行失败：' + (error.message || '未知错误'))
      } finally {
        loading.value = false
      }
    }
    
    // 模拟API响应（用于演示）
    const simulateApiResponse = () => {
      return new Promise((resolve) => {
        // 模拟处理延迟
        setTimeout(() => {
          // 模拟原始图像
          const imageUrl = 'https://pytorch.org/tutorials/_static/img/fgsm_panda_image.png'
          results.beforeImage = imageUrl
          
          // 模拟原始检测结果
          results.beforeDetections = [
            { id: 1, label: 'panda', confidence: 0.92, bbox: [10, 10, 200, 200] }
          ]
          
          // 模拟攻击后的图像
          results.afterImage = 'https://pytorch.org/tutorials/_static/img/fgsm_adversarial_example.png'
          
          // 模拟攻击后的检测结果
          if (Math.random() > 0.5) {
            // 攻击成功，无检测结果
            results.afterDetections = []
          } else {
            // 攻击部分成功，检测结果置信度降低
            results.afterDetections = [
              { id: 1, label: 'monkey', confidence: 0.41, bbox: [15, 15, 195, 195] }
            ]
          }
          
          resolve()
        }, 2000) // 模拟2秒的处理时间
      })
    }
    
    return {
      loading,
      results,
      handleStartScenario
    }
  }
})
</script>

<style scoped>
.attack-page {
  padding: 10px 0;
}

.form-card {
  height: 100%;
}

.card-header {
  font-weight: bold;
}
</style> 