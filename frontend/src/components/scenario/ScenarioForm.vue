<template>
  <div class="scenario-form">
    <el-form :model="formData" label-width="120px" :rules="rules">
      <!-- 场景类型 -->
      <el-form-item label="类型" prop="type">
        <el-select v-model="formData.type" placeholder="请选择场景类型" @change="handleTypeChange">
          <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <!-- 模型选择 -->
      <el-form-item label="模型" prop="model">
        <el-select v-model="formData.model" placeholder="请选择模型">
          <el-option v-for="item in modelOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <!-- 数据集选择 -->
      <el-form-item label="数据集" prop="dataset">
        <el-select v-model="formData.dataset" placeholder="请选择数据集">
          <el-option v-for="item in datasetOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <!-- 动态算法选择 -->
      <template v-if="formData.type === 'attack'">
        <el-form-item label="攻击算法" prop="algorithm">
          <el-select v-model="formData.algorithm" placeholder="请选择攻击算法" @change="handleAlgorithmChange">
            <el-option v-for="item in attackAlgorithmOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </template>

      <template v-if="formData.type === 'interference'">
        <el-form-item label="干扰类型" prop="algorithm">
          <el-select v-model="formData.algorithm" placeholder="请选择干扰类型" @change="handleAlgorithmChange">
            <el-option v-for="item in interferenceOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </template>

      <template v-if="formData.type === 'defense'">
        <el-form-item label="防御算法" prop="algorithm">
          <el-select v-model="formData.algorithm" placeholder="请选择防御算法" @change="handleAlgorithmChange">
            <el-option v-for="item in defenseAlgorithmOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </template>

      <!-- 动态参数表单 -->
      <template v-if="formData.algorithm && algorithmParams.length > 0">
        <el-divider content-position="left">算法参数</el-divider>
        <el-form-item v-for="param in algorithmParams" 
                      :key="param.name" 
                      :label="param.label" 
                      :prop="'params.' + param.name">
          <el-input-number v-if="param.type === 'number'" 
                           v-model="formData.params[param.name]" 
                           :min="param.min" 
                           :max="param.max" 
                           :step="param.step" />
          <el-slider v-else-if="param.type === 'slider'" 
                     v-model="formData.params[param.name]" 
                     :min="param.min" 
                     :max="param.max" 
                     :step="param.step" />
          <el-input v-else 
                    v-model="formData.params[param.name]" />
        </el-form-item>
      </template>

      <!-- 图片上传 -->
      <el-divider content-position="left">测试图像</el-divider>
      <el-form-item label="上传图像" prop="image">
        <el-upload
          class="image-upload"
          action="#"
          :http-request="uploadImage"
          :show-file-list="false"
          :before-upload="beforeImageUpload">
          <img v-if="imageUrl" :src="imageUrl" class="preview-image" />
          <el-icon v-else class="upload-icon"><Plus /></el-icon>
        </el-upload>
        <div class="upload-tip">支持jpg/png格式，文件大小不超过5MB</div>
      </el-form-item>

      <!-- 操作按钮 -->
      <el-form-item>
        <el-button type="primary" @click="submitForm">开始</el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { defineComponent, ref, reactive, watch } from 'vue'

export default defineComponent({
  name: 'ScenarioForm',
  props: {
    // 默认场景类型: attack, interference, defense
    defaultType: {
      type: String,
      default: ''
    }
  },
  emits: ['start-scenario'],
  setup(props, { emit }) {
    // 表单数据
    const formData = reactive({
      type: props.defaultType || 'attack',
      model: '',
      dataset: 'COCO',
      algorithm: '',
      params: {},
      image: null
    })

    // 图片预览URL
    const imageUrl = ref('')

    // 场景类型选项
    const typeOptions = [
      { value: 'attack', label: '对抗攻击' },
      { value: 'interference', label: '环境干扰' },
      { value: 'defense', label: '对抗防御' }
    ]

    // 模型选项
    const modelOptions = ref([
      { value: 'YOLOv5', label: 'YOLOv5' }
    ])
    
    // 数据集选项
    const datasetOptions = [
      { value: 'COCO', label: 'COCO Dataset' },
      { value: 'VOC', label: 'Pascal VOC' }
    ]
    
    // 攻击算法选项
    const attackAlgorithmOptions = [
      { value: 'PGD', label: 'PGD (Projected Gradient Descent)' },
      { value: 'FGSM', label: 'FGSM (Fast Gradient Sign Method)' },
      { value: 'CW', label: 'C&W (Carlini & Wagner)' },
      { value: 'Deepfool', label: 'Deepfool' },
      { value: 'AdvPatch', label: 'AdvPatch' },
      { value: 'DPatch', label: 'DPatch' }
    ]
    
    // 干扰类型选项
    const interferenceOptions = [
      { value: 'brightness', label: '亮度' },
      { value: 'gaussian_noise', label: '高斯噪声' },
      { value: 'contrast', label: '对比度' },
      { value: 'distortion', label: '扭曲' },
      { value: 'scene_change', label: '场景跃变' }
    ]
    
    // 防御算法选项
    const defenseAlgorithmOptions = [
      { value: 'PGDTraining', label: 'PGD Training' },
      { value: 'FGM', label: 'FGM' },
      { value: 'FrddAT', label: 'FrddAT' },
      { value: 'YOPO', label: 'YOPO' },
      { value: 'FreeLP', label: 'FreeLP' },
      { value: 'SkyGuard', label: 'SkyGuard-Defense (我们的方案)' }
    ]
    
    // 算法参数
    const algorithmParams = ref([])
    
    // 表单验证规则
    const rules = {
      type: [{ required: true, message: '请选择场景类型', trigger: 'change' }],
      model: [{ required: true, message: '请选择模型', trigger: 'change' }],
      dataset: [{ required: true, message: '请选择数据集', trigger: 'change' }],
      algorithm: [{ required: true, message: '请选择算法', trigger: 'change' }],
      image: [{ required: true, message: '请上传图像', trigger: 'change' }]
    }

    // 监听类型变化
    watch(() => formData.type, (newType) => {
      // 根据类型调整模型选项
      if (newType === 'defense') {
        modelOptions.value = [
          { value: 'YOLOv10', label: 'YOLOv10' }
        ]
        formData.model = 'YOLOv10'
      } else {
        modelOptions.value = [
          { value: 'YOLOv5', label: 'YOLOv5' }
        ]
        formData.model = 'YOLOv5'
      }
      
      // 重置算法和参数
      formData.algorithm = ''
      formData.params = {}
      algorithmParams.value = []
    })

    // 处理类型变化
    const handleTypeChange = (type) => {
      formData.algorithm = ''
      formData.params = {}
      algorithmParams.value = []
    }
    
    // 处理算法变化
    const handleAlgorithmChange = (algorithm) => {
      // 重置参数
      formData.params = {}
      
      // 根据不同算法设置不同参数
      if (formData.type === 'attack') {
        if (algorithm === 'FGSM') {
          algorithmParams.value = [
            { name: 'epsilon', label: '扰动预算 (ε)', type: 'slider', min: 0, max: 0.3, step: 0.01, default: 0.03 },
          ]
        } else if (algorithm === 'PGD') {
          algorithmParams.value = [
            { name: 'epsilon', label: '扰动预算 (ε)', type: 'slider', min: 0, max: 0.3, step: 0.01, default: 0.03 },
            { name: 'alpha', label: '步长 (α)', type: 'slider', min: 0.001, max: 0.1, step: 0.001, default: 0.01 },
            { name: 'iterations', label: '迭代次数', type: 'number', min: 1, max: 100, step: 1, default: 10 }
          ]
        } else if (algorithm === 'CW') {
          algorithmParams.value = [
            { name: 'confidence', label: '置信度', type: 'slider', min: 0, max: 50, step: 1, default: 0 },
            { name: 'learning_rate', label: '学习率', type: 'number', min: 0.001, max: 0.1, step: 0.001, default: 0.01 },
            { name: 'iterations', label: '迭代次数', type: 'number', min: 1, max: 1000, step: 1, default: 100 }
          ]
        } else if (algorithm === 'AdvPatch' || algorithm === 'DPatch') {
          algorithmParams.value = [
            { name: 'patch_size', label: '补丁大小', type: 'number', min: 10, max: 300, step: 1, default: 50 },
            { name: 'learning_rate', label: '学习率', type: 'number', min: 0.001, max: 0.1, step: 0.001, default: 0.03 },
            { name: 'iterations', label: '迭代次数', type: 'number', min: 1, max: 1000, step: 1, default: 100 }
          ]
        }
      } else if (formData.type === 'interference') {
        if (algorithm === 'brightness') {
          algorithmParams.value = [
            { name: 'level', label: '亮度等级', type: 'slider', min: -100, max: 100, step: 1, default: 50 },
          ]
        } else if (algorithm === 'gaussian_noise') {
          algorithmParams.value = [
            { name: 'level', label: '噪声等级', type: 'slider', min: 0, max: 100, step: 1, default: 30 },
          ]
        } else if (algorithm === 'contrast') {
          algorithmParams.value = [
            { name: 'level', label: '对比度等级', type: 'slider', min: -100, max: 100, step: 1, default: 30 },
          ]
        } else if (algorithm === 'distortion') {
          algorithmParams.value = [
            { name: 'level', label: '扭曲等级', type: 'slider', min: 0, max: 100, step: 1, default: 20 },
          ]
        }
      } else if (formData.type === 'defense') {
        if (algorithm === 'PGDTraining' || algorithm === 'FGM' || algorithm === 'FrddAT') {
          algorithmParams.value = [
            { name: 'adv_ratio', label: '对抗样本比例', type: 'slider', min: 0, max: 1, step: 0.1, default: 0.5 },
            { name: 'epsilon', label: '扰动预算 (ε)', type: 'slider', min: 0, max: 0.3, step: 0.01, default: 0.03 },
          ]
        } else if (algorithm === 'SkyGuard') {
          algorithmParams.value = [
            { name: 'defense_level', label: '防御强度', type: 'slider', min: 1, max: 10, step: 1, default: 5 },
          ]
        }
      }
      
      // 设置默认参数值
      algorithmParams.value.forEach(param => {
        formData.params[param.name] = param.default
      })
    }
    
    // 图片上传前的验证
    const beforeImageUpload = (file) => {
      const isJPGOrPNG = file.type === 'image/jpeg' || file.type === 'image/png'
      const isLt5M = file.size / 1024 / 1024 < 5
      
      if (!isJPGOrPNG) {
        ElMessage.error('只能上传JPG或PNG格式的图片!')
      }
      if (!isLt5M) {
        ElMessage.error('图片大小不能超过5MB!')
      }
      
      return isJPGOrPNG && isLt5M
    }
    
    // 自定义上传图片处理函数
    const uploadImage = (options) => {
      const file = options.file
      formData.image = file
      
      // 创建本地预览
      const reader = new FileReader()
      reader.onload = (e) => {
        imageUrl.value = e.target.result
      }
      reader.readAsDataURL(file)
    }
    
    // 提交表单
    const submitForm = () => {
      // 表单验证和提交逻辑
      if (!formData.image) {
        ElMessage.warning('请上传测试图像')
        return
      }
      
      // 发出开始场景事件
      emit('start-scenario', { ...formData })
    }
    
    // 重置表单
    const resetForm = () => {
      formData.algorithm = ''
      formData.params = {}
      imageUrl.value = ''
      formData.image = null
    }

    return {
      formData,
      imageUrl,
      typeOptions,
      modelOptions,
      datasetOptions,
      attackAlgorithmOptions,
      interferenceOptions,
      defenseAlgorithmOptions,
      algorithmParams,
      rules,
      handleTypeChange,
      handleAlgorithmChange,
      beforeImageUpload,
      uploadImage,
      submitForm,
      resetForm
    }
  }
})
</script>

<style scoped>
.scenario-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.image-upload {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 178px;
  height: 178px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.image-upload:hover {
  border-color: #409EFF;
}

.upload-icon {
  font-size: 28px;
  color: #8c939d;
}

.preview-image {
  width: 178px;
  height: 178px;
  display: block;
}

.upload-tip {
  font-size: 12px;
  color: #606266;
  margin-top: 7px;
}
</style> 