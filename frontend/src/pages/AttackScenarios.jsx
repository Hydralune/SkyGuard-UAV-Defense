import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiGet, apiPost, API_ENDPOINTS } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import {
  Sword,
  Zap,
  Target,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Eye,
  FileText,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Image
} from 'lucide-react'

export default function AttackScenarios() {
  const navigate = useNavigate()
  const PERSIST_KEY = 'attack_scenarios_state_v1'
  const hasRestoredRef = useRef(false)
  const [selectedScenario, setSelectedScenario] = useState('adversarial')
  const [selectedModel, setSelectedModel] = useState('yolov8s')
  const [selectedDataset, setSelectedDataset] = useState('Visdrone')
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('pgd')
  const [parameters, setParameters] = useState({
    // 通用参数
    epsilon: 0.03,
    alpha: 0.01,
    iterations: 10,
    num_images: 10, // 评估图像数量
    conf_threshold: 0.25, // 置信度阈值
    iou_threshold: 0.5, // IoU阈值
    
    // DPatch参数
    patch_size: 30,
    
    // 光电干扰参数
    brightness_factor: 1.5,
    noise_std: 0.1,
    contrast_factor: 1.5,
    brightness: 0.5,
    contrast: 1.0,
    noise_level: 0.1,
    
    // CW_L2参数
    confidence: 0,
    lr: 0.01,
    initial_const: 0.1,
    
    // DeepFool参数
    max_iter: 50,
    overshoot: 0.02,
    
    // AdvPatch参数
    learning_rate: 0.1,
    random_locations: true,
    num_patches: 1,
    
    // Distortion参数
    distortion_type: 'elastic',
    severity: 0.5,
    
    // Scene_Transition参数
    transition_type: 'weather'
  })
  const [isRunning, setIsRunning] = useState(false)
  const [taskId, setTaskId] = useState(null)
  const [celeryTaskId, setCeleryTaskId] = useState(null)
  const [taskStatus, setTaskStatus] = useState(null)
  const [progress, setProgress] = useState(0)
  const [resultImages, setResultImages] = useState([])
  const [logMessages, setLogMessages] = useState([])

  // 前后端命名映射
  const backendModelMap = {
    yolov8s: 'yolov8s-visdrone',
    yolov10: 'yolov10-visdrone',
    faster_rcnn: 'faster_rcnn-visdrone',
    ssd: 'ssd-visdrone'
  }
  const backendDatasetMap = {
    Visdrone: 'VisDrone'
  }

  // 初次挂载：从本地存储恢复状态
  useEffect(() => {
    if (hasRestoredRef.current) return
    try {
      const raw = localStorage.getItem(PERSIST_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved.selectedScenario) setSelectedScenario(saved.selectedScenario)
        if (saved.selectedModel) setSelectedModel(saved.selectedModel)
        if (saved.selectedDataset) setSelectedDataset(saved.selectedDataset)
        if (saved.selectedAlgorithm) setSelectedAlgorithm(saved.selectedAlgorithm)
        if (saved.parameters) setParameters(prev => ({ ...prev, ...saved.parameters }))
        if (typeof saved.isRunning === 'boolean') setIsRunning(saved.isRunning)
        if (saved.taskId) setTaskId(saved.taskId)
        if (saved.celeryTaskId) setCeleryTaskId(saved.celeryTaskId)
        if (typeof saved.progress === 'number') setProgress(saved.progress)
        if (saved.taskStatus) setTaskStatus(saved.taskStatus)
        if (Array.isArray(saved.resultImages)) setResultImages(saved.resultImages)
        if (Array.isArray(saved.logMessages)) setLogMessages(saved.logMessages)
      }
    } catch (_) {}
    hasRestoredRef.current = true
  }, [])

  // 持久化：任何关键状态变化时，保存到本地存储
  useEffect(() => {
    const stateToSave = {
      selectedScenario,
      selectedModel,
      selectedDataset,
      selectedAlgorithm,
      parameters,
      isRunning,
      taskId,
      celeryTaskId,
      taskStatus,
      progress,
      resultImages,
      // 只保留最近的 100 条日志
      logMessages: (logMessages || []).slice(0, 100)
    }
    try {
      localStorage.setItem(PERSIST_KEY, JSON.stringify(stateToSave))
    } catch (_) {}
  }, [selectedScenario, selectedModel, selectedDataset, selectedAlgorithm, parameters, isRunning, taskId, celeryTaskId, taskStatus, progress, resultImages, logMessages])

  // 添加useEffect钩子用于轮询任务状态
  useEffect(() => {
    let intervalId;
    
    if (celeryTaskId && isRunning) {
      // 创建轮询间隔，每2秒检查一次任务状态
      intervalId = setInterval(async () => {
        try {
          const response = await apiGet(API_ENDPOINTS.TASK_STATUS(celeryTaskId));
          const data = await response.json();
          console.log('任务状态更新:', data);
          
          setTaskStatus(data);
          
          // 更新进度
          if (data.progress) {
            setProgress(data.progress);
          } else if (data.percent) {
            setProgress(data.percent);
          }
          
          // 添加日志消息（如果有）
          if (data.message && data.message !== '任务进行中' && data.message !== '任务完成') {
            addLogMessage(data.message);
          }
          
          // 如果任务完成，停止轮询并获取结果
          if (data.state === 'SUCCESS' || data.status === 'completed') {
            setIsRunning(false);
            clearInterval(intervalId);
            addLogMessage('任务完成', 'success');
            // 等待一秒再获取结果，确保结果文件已生成
            setTimeout(() => fetchResults(), 1000);
          } else if (data.state === 'FAILURE' || data.status === 'failed') {
            setIsRunning(false);
            clearInterval(intervalId);
            const errorMsg = data.error || data.message || '未知错误';
            addLogMessage(`任务失败: ${errorMsg}`, 'error');
            // 显示错误提示
            addLogMessage(`攻击失败: ${errorMsg}`, 'error');
          }
        } catch (error) {
          console.error('获取任务状态失败:', error);
        }
      }, 2000);
    }
    
    // 清理函数
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [celeryTaskId, isRunning]);

  // 如果恢复到运行中状态但没有轮询，立即触发一次状态拉取并启动轮询
  useEffect(() => {
    if (celeryTaskId && isRunning) {
      (async () => {
        try {
          const response = await apiGet(API_ENDPOINTS.TASK_STATUS(celeryTaskId));
          if (response.ok) {
            const data = await response.json();
            setTaskStatus(data);
            if (data.progress) setProgress(data.progress);
            else if (data.percent) setProgress(data.percent);
          }
        } catch (_) {}
      })();
    }
  }, [celeryTaskId, isRunning]);

  // 当场景切换时，自动选择该场景的默认算法（第一个算法）
  const handleScenarioChange = (value) => {
    setSelectedScenario(value)
    const defaultAlg = attackAlgorithms[value]?.[0]?.id
    if (defaultAlg) {
      setSelectedAlgorithm(defaultAlg)
    }
  }
  
  // 添加日志消息
  const addLogMessage = (message, type = 'info') => {
    // 使用uuid作为id避免重复
    const uniqueId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setLogMessages(prev => [
      {
        id: uniqueId,
        message,
        type,
        timestamp: new Date().toLocaleTimeString()
      },
      ...prev
    ].slice(0, 100)); // 只保留最新的100条消息
  }

  const attackAlgorithms = {
    adversarial: [
      { id: 'pgd', name: 'PGD', description: '投影梯度下降攻击', difficulty: 'high' },
      { id: 'fgsm', name: 'FGSM', description: '快速梯度符号方法', difficulty: 'medium' },
      { id: 'cw_l2', name: 'C&W', description: 'Carlini & Wagner攻击', difficulty: 'high' },
      { id: 'deepfool', name: 'DeepFool', description: '最小扰动攻击', difficulty: 'medium' },
      { id: 'advpatch', name: 'AdvPatch', description: '对抗补丁攻击', difficulty: 'high' },
      { id: 'dpatch', name: 'DPatch', description: '数字补丁攻击', difficulty: 'medium' },
      { id: 'selfmade', name: '自定义攻击算法', description: '从文件导入', difficulty: 'high' },
    ],
    optical: [
      { id: 'brightness', name: '亮度干扰', description: '调整图像亮度', difficulty: 'low' },
      { id: 'gaussian', name: '高斯噪声', description: '添加高斯噪声', difficulty: 'low' },
      { id: 'contrast', name: '对比度调整', description: '修改图像对比度', difficulty: 'low' },
      { id: 'distortion', name: '图像扭曲', description: '几何变换扭曲', difficulty: 'medium' },
      { id: 'scene_transition', name: '场景跃变', description: '快速场景切换', difficulty: 'high' }
    ]
  }

  const models = [
    { id: 'yolov8s', name: 'YOLOv8s', description: '实时目标检测模型' },
    { id: 'yolov10', name: 'YOLOv10', description: '最新版本YOLO模型' },
    { id: 'faster_rcnn', name: 'Faster R-CNN', description: '两阶段检测模型' },
    { id: 'ssd', name: 'SSD', description: '单次检测器' }
  ]

  const datasets = [
    { id: 'Visdrone', name: 'Visdrone', description: '通用目标检测数据集' },
    { id: 'custom', name: 'Custom', description: '自定义数据集' },
    { id: 'uav', name: 'UAV Dataset', description: '无人机专用数据集' }
  ]

  const visualizationTypes = [
    { id: 'original', name: '初始样本', enabled: true },
    { id: 'adversarial', name: '对抗样本', enabled: true },
    { id: 'difference', name: '差异图', enabled: false },
    { id: 'heatmap', name: '热力图', enabled: false },
    { id: 'result_comparison', name: '结果对比', enabled: true }
  ]

  const handleParameterChange = (key, value) => {
    setParameters(prev => ({ ...prev, [key]: value }))
  }

  // 生成后端需要的攻击参数（供“添加到防御”复用）
  const buildBackendAttackParams = () => {
    const base = {
      attack_name: selectedAlgorithm,
      model_name: backendModelMap[selectedModel] || selectedModel || 'yolov8s-visdrone',
      dataset_name: backendDatasetMap[selectedDataset] || selectedDataset || 'VisDrone',
      num_images: parameters.num_images || 10,
      conf_threshold: parameters.conf_threshold || 0.25,
      iou_threshold: parameters.iou_threshold || 0.5,
    }

    const p = {}
    if (selectedScenario === 'adversarial') {
      switch (selectedAlgorithm) {
        case 'pgd':
          p.eps = `${parameters.epsilon}`
          p.alpha = `${parameters.alpha}`
          p.steps = parameters.iterations
          break
        case 'fgsm':
          p.eps = `${parameters.epsilon}`
          p.steps = 1
          break
        case 'cw_l2':
          p.confidence = parameters.confidence
          p.steps = parameters.iterations
          p.lr = parameters.lr
          p.initial_const = parameters.initial_const
          break
        case 'dpatch':
          p.patch_size = parameters.patch_size
          p.steps = parameters.iterations
          break
        case 'deepfool':
          p.max_iter = parameters.max_iter
          p.overshoot = parameters.overshoot
          break
        case 'advpatch':
          p.patch_size = parameters.patch_size
          p.lr = parameters.learning_rate
          p.steps = parameters.max_iter
          p.random_locations = parameters.random_locations
          p.num_patches = parameters.num_patches
          break
        default:
          p.eps = `${parameters.epsilon}`
          p.alpha = `${parameters.alpha}`
          p.steps = parameters.iterations
      }
    } else if (selectedScenario === 'optical') {
      switch (selectedAlgorithm) {
        case 'brightness':
          p.brightness_factor = parameters.brightness_factor
          break
        case 'gaussian':
          p.noise_std = parameters.noise_std
          break
        case 'contrast':
          p.contrast_factor = parameters.contrast_factor
          break
        case 'distortion':
          p.distortion_type = parameters.distortion_type
          p.severity = parameters.severity
          break
        case 'scene_transition':
          p.transition_type = parameters.transition_type
          p.severity = parameters.severity
          break
        default:
          p.brightness = parameters.brightness
          p.contrast = parameters.contrast
          p.noise_level = parameters.noise_level
      }
    }

    return { ...base, ...p }
  }

  // 添加到防御：把当前攻击作为预设写入 localStorage 并跳转
  const handleSendToDefense = () => {
    const preset = {
      attack_name: selectedAlgorithm,
      scenario: selectedScenario,
      title: `${selectedScenario === 'adversarial' ? '对抗' : '光电'}·${selectedAlgorithm.toUpperCase()}`,
      params: buildBackendAttackParams(),
    }
    try {
      localStorage.setItem('defense_attack_prefill_v1', JSON.stringify(preset))
    } catch (_) {}
    navigate('/defense-scenarios')
  }

  // 获取攻击结果
  const fetchResults = async () => {
    if (!taskId) {
      console.log('无法获取结果：缺少taskId');
      return;
    }
    
    try {
      // 调用可视化API获取结果
      addLogMessage('正在获取可视化结果...');
      
      // 注意：这里使用的是后端生成的文件路径结构
      // 实际使用时需要根据后端实际结构调整
      const baseResultPath = `/backend/results/adversarial_results/${taskId}`;
      
      // 尝试获取结果文件列表
      try {
        // 使用可视化API获取结果
        const response = await apiGet(API_ENDPOINTS.VISUALIZATION_RESULTS(taskId));
        const data = await response.json();
        console.log('获取到的可视化结果:', data);
        
        // 处理返回的图像数据
        if (data && data.images && data.images.length > 0) {
          // 根据实际返回的图像类型过滤
          const detectionImages = data.images.filter(img => img.type === 'detection_results');
          const adversarialImages = data.images.filter(img => img.type === 'adversarial_results');
          const comparisonImages = data.images.filter(img => img.type === 'comparison_results');
          const plotImages = data.images.filter(img => img.type === 'plots');
          
          console.log(`检测结果图像: ${detectionImages.length}, 对抗样本图像: ${adversarialImages.length}, 对比图像: ${comparisonImages.length}, 图表: ${plotImages.length}`);
          
          const resultImgs = [];
          
          // 添加原始检测图像
          if (detectionImages.length > 0) {
            resultImgs.push({
              type: 'original',
              url: detectionImages[0].url,
              title: '原始检测结果'
            });
          }
          
          // 添加对抗样本
          if (adversarialImages.length > 0) {
            resultImgs.push({
              type: 'adversarial',
              url: adversarialImages[0].url,
              title: '对抗样本'
            });
          }
          
          // 添加结果对比
          if (comparisonImages.length > 0) {
            resultImgs.push({
              type: 'result_comparison',
              url: comparisonImages[0].url,
              title: '检测结果对比'
            });
          }
          
          // 添加一个有价值的图表
          if (plotImages.length > 0) {
            // 先尝试找类别脆弱性分析图
            const vulnerabilityPlot = plotImages.find(img => img.path.includes('class_vulnerability'));
            const confidencePlot = plotImages.find(img => img.path.includes('confidence_drop'));
            const detectionDropPlot = plotImages.find(img => img.path.includes('detection_drop_rate'));
            
            const plotToUse = vulnerabilityPlot || confidencePlot || detectionDropPlot || plotImages[0];
            
            if (plotToUse) {
              resultImgs.push({
                type: 'plot',
                url: plotToUse.url,
                title: '效果分析'
              });
            }
          }
          
          setResultImages(resultImgs);
        } else {
          console.log('没有找到可视化结果图像');
          // 使用默认静态路径作为备选
          setResultImages([
            {
              type: 'original',
              url: `${baseResultPath}/original_image.jpg`,
              title: '原始图像'
            },
            {
              type: 'adversarial',
              url: `${baseResultPath}/adversarial_image.jpg`,
              title: '对抗样本'
            },
            {
              type: 'result_comparison',
              url: `${baseResultPath}/comparison.jpg`,
              title: '结果对比'
            }
          ]);
        }
        
        addLogMessage('加载结果图像完成');
        
        // 通知用户在可视化页面查看完整结果
        // 构造可视化页面URL - 使用完整URL包含协议和域名
        const visPageUrl = `${window.location.origin}/visualization?task_id=${taskId}`;
        console.log(`可视化页面URL: ${visPageUrl}`);
        addLogMessage(`请在<a href="${visPageUrl}" target="_blank" class="text-blue-500 hover:underline">可视化页面</a>查看完整结果`, 'info');
        
        // 显示成功提示
        const alertElement = document.createElement('div');
        alertElement.innerHTML = `
          <div class="fixed top-4 right-4 z-50 max-w-md">
            <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
              <strong class="font-bold">结果已生成</strong>
              <span class="block sm:inline">
                请在<a href="${window.location.origin}/visualization?task_id=${taskId}" target="_blank" class="text-green-800 font-semibold hover:underline">可视化页面</a>查看完整结果
              </span>
              <button class="absolute top-0 bottom-0 right-0 px-4 py-3" onclick="this.parentElement.parentElement.remove()">
                <span class="text-xl">&times;</span>
              </button>
            </div>
          </div>
        `;
        document.body.appendChild(alertElement.firstElementChild);
        
        // 5秒后自动移除提示
        setTimeout(() => {
          if (alertElement.firstElementChild && alertElement.firstElementChild.parentElement) {
            alertElement.firstElementChild.remove();
          }
        }, 5000);
        
      } catch (innerError) {
        console.error('获取结果文件列表失败:', innerError);
        addLogMessage(`获取结果文件列表失败: ${innerError.message}`, 'error');
      }
      
    } catch (error) {
      console.error('获取结果失败:', error);
      addLogMessage(`获取结果失败: ${error.message}`, 'error');
    }
  };

  // 启动攻击任务
  const handleStartAttack = async () => {
    try {
      setIsRunning(true);
      setTaskId(null);
      setCeleryTaskId(null);
      setTaskStatus(null);
      setProgress(0);
      setResultImages([]);
      setLogMessages([]);
      
      addLogMessage('准备开始攻击任务...');
      
      // 准备参数
      const attackParams = new URLSearchParams({
        attack_name: selectedAlgorithm,
        model_name: backendModelMap[selectedModel] || selectedModel || 'yolov8s-visdrone',
        dataset_name: backendDatasetMap[selectedDataset] || selectedDataset || 'VisDrone',
        num_images: parameters.num_images || 10,
        conf_threshold: parameters.conf_threshold || 0.25,
        iou_threshold: parameters.iou_threshold || 0.5
      });
      
      // 根据攻击类型添加特定参数
      if (selectedScenario === 'adversarial') {
        // 根据具体算法添加参数
        switch (selectedAlgorithm) {
          case 'pgd':
            attackParams.append('eps', `${parameters.epsilon}`);
            attackParams.append('alpha', `${parameters.alpha}`);
            attackParams.append('steps', parameters.iterations);
            break;
            
          case 'fgsm':
            attackParams.append('eps', `${parameters.epsilon}`);
            attackParams.append('steps', 1); // FGSM通常是单步
            break;
            
          case 'cw_l2':
            attackParams.append('confidence', parameters.confidence);
            attackParams.append('steps', parameters.iterations);
            attackParams.append('lr', parameters.lr);
            attackParams.append('initial_const', parameters.initial_const);
            break;
            
          case 'dpatch':
            attackParams.append('patch_size', parameters.patch_size);
            attackParams.append('steps', parameters.iterations);
            break;
            
          case 'deepfool':
            attackParams.append('max_iter', parameters.max_iter);
            attackParams.append('overshoot', parameters.overshoot);
            break;
            
          case 'advpatch':
            attackParams.append('patch_size', parameters.patch_size);
            // 后端期望的字段为 lr 和 steps
            attackParams.append('lr', parameters.learning_rate);
            attackParams.append('steps', parameters.max_iter);
            attackParams.append('random_locations', parameters.random_locations);
            attackParams.append('num_patches', parameters.num_patches);
            break;

          default:
            attackParams.append('eps', `${parameters.epsilon}`);
            attackParams.append('alpha', `${parameters.alpha}`);
            attackParams.append('steps', parameters.iterations);
            break;
        }
      } else if (selectedScenario === 'optical') {
        switch (selectedAlgorithm) {
          case 'brightness':
            attackParams.append('brightness_factor', parameters.brightness_factor);
            break;
            
          case 'gaussian':
            attackParams.append('noise_std', parameters.noise_std);
            break;
            
          case 'contrast':
            attackParams.append('contrast_factor', parameters.contrast_factor);
            break;
            
          case 'distortion':
            attackParams.append('distortion_type', parameters.distortion_type);
            attackParams.append('severity', parameters.severity);
            break;
            
          case 'scene_transition':
            attackParams.append('transition_type', parameters.transition_type);
            attackParams.append('severity', parameters.severity);
            break;

          default:
            attackParams.append('brightness', parameters.brightness);
            attackParams.append('contrast', parameters.contrast);
            attackParams.append('noise_level', parameters.noise_level);
            break;
        }
      }
      
      // 调用API
      const apiUrl = API_ENDPOINTS.ATTACK_RUN;
      console.log(`调用API: ${apiUrl}?${attackParams.toString()}`);
      
      const response = await apiPost(apiUrl, null, Object.fromEntries(attackParams));
      const data = await response.json();
      setTaskId(data.task_id);
      setCeleryTaskId(data.celery_task_id);
      
      addLogMessage(`任务已提交，任务ID: ${data.task_id}`);
      addLogMessage(`Celery任务ID: ${data.celery_task_id}`);
      addLogMessage(`开始执行${selectedScenario === 'adversarial' ? '对抗' : '光电干扰'}攻击: ${selectedAlgorithm}`);
      
      // 显示成功提示
      const alertElement = document.createElement('div');
      alertElement.innerHTML = `
        <div class="fixed top-4 right-4 z-50 max-w-md">
          <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <strong class="font-bold">攻击任务已提交</strong>
            <span class="block sm:inline">任务ID: ${data.task_id}</span>
            <button class="absolute top-0 bottom-0 right-0 px-4 py-3" onclick="this.parentElement.parentElement.remove()">
              <span class="text-xl">&times;</span>
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(alertElement.firstElementChild);
      
      // 5秒后自动移除提示
      setTimeout(() => {
        if (alertElement.firstElementChild && alertElement.firstElementChild.parentElement) {
          alertElement.firstElementChild.remove();
        }
      }, 5000);
      
    } catch (error) {
      console.error('启动攻击失败:', error);
      setIsRunning(false);
      
      addLogMessage(`启动攻击失败: ${error.message}`, 'error');
      
      // 显示错误提示
      const alertElement = document.createElement('div');
      alertElement.innerHTML = `
        <div class="fixed top-4 right-4 z-50 max-w-md">
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong class="font-bold">启动攻击失败</strong>
            <span class="block sm:inline">${error.message}</span>
            <button class="absolute top-0 bottom-0 right-0 px-4 py-3" onclick="this.parentElement.parentElement.remove()">
              <span class="text-xl">&times;</span>
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(alertElement.firstElementChild);
      
      // 5秒后自动移除提示
      setTimeout(() => {
        if (alertElement.firstElementChild && alertElement.firstElementChild.parentElement) {
          alertElement.firstElementChild.remove();
        }
      }, 5000);
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">攻击场景选择</h1>
          <p className="text-muted-foreground mt-2">
            配置和执行对抗攻击与光电干扰场景
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            导入配置
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            导出配置
          </Button>
          <Button variant="default" onClick={handleSendToDefense} title="将当前攻击设为防御评估的输入">
            发送到防御
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧配置面板 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 场景类型选择 */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                场景选择
              </CardTitle>
              <CardDescription>选择攻击场景类型和目标模型</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={selectedScenario} onValueChange={handleScenarioChange}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="adversarial" className="flex items-center">
                    <Sword className="h-4 w-4 mr-2" />
                    对抗攻击
                  </TabsTrigger>
                  <TabsTrigger value="optical" className="flex items-center">
                    <Zap className="h-4 w-4 mr-2" />
                    光电干扰
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="model">模型</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择模型" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div>
                            <div className="font-medium">{model.name}</div>
                            <div className="text-xs text-muted-foreground">{model.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dataset">数据集</Label>
                  <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择数据集" />
                    </SelectTrigger>
                    <SelectContent>
                      {datasets.map((dataset) => (
                        <SelectItem key={dataset.id} value={dataset.id}>
                          <div>
                            <div className="font-medium">{dataset.name}</div>
                            <div className="text-xs text-muted-foreground">{dataset.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="algorithm">算法</Label>
                  <Select value={selectedAlgorithm} onValueChange={setSelectedAlgorithm}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择算法" />
                    </SelectTrigger>
                    <SelectContent>
                      {attackAlgorithms[selectedScenario]?.map((algorithm) => (
                        <SelectItem key={algorithm.id} value={algorithm.id}>
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <div className="font-medium">{algorithm.name}</div>
                              <div className="text-xs text-muted-foreground">{algorithm.description}</div>
                            </div>
                            <Badge variant={
                              algorithm.difficulty === 'high' ? 'destructive' :
                              algorithm.difficulty === 'medium' ? 'default' :
                              'secondary'
                            }>
                              {algorithm.difficulty === 'high' ? '高难度' :
                               algorithm.difficulty === 'medium' ? '中等' : '简单'}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 算法参数配置 */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                参数配置
              </CardTitle>
              <CardDescription>
                调整{selectedScenario === 'adversarial' ? '对抗攻击' : '光电干扰'}算法参数
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedScenario === 'adversarial' && (
                <>
                  {/* PGD和FGSM等通用参数 */}
                  {(selectedAlgorithm === 'pgd' || selectedAlgorithm === 'fgsm') && (
                    <>
                      <div className="space-y-2">
                        <Label>扰动预算 (ε): {parameters.epsilon}</Label>
                        <Slider
                          value={[parameters.epsilon]}
                          onValueChange={(value) => handleParameterChange('epsilon', value[0])}
                          max={0.1}
                          min={0.001}
                          step={0.001}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          控制对抗扰动的最大幅度
                        </p>
                      </div>
                    </>
                  )}

                  {/* PGD特定参数 */}
                  {selectedAlgorithm === 'pgd' && (
                    <>
                      <div className="space-y-2">
                        <Label>学习率 (α): {parameters.alpha}</Label>
                        <Slider
                          value={[parameters.alpha]}
                          onValueChange={(value) => handleParameterChange('alpha', value[0])}
                          max={0.05}
                          min={0.001}
                          step={0.001}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          每次迭代的步长大小
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>迭代次数: {parameters.iterations}</Label>
                        <Slider
                          value={[parameters.iterations]}
                          onValueChange={(value) => handleParameterChange('iterations', value[0])}
                          max={50}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          攻击算法的迭代次数
                        </p>
                      </div>
                    </>
                  )}

                  {/* CW_L2特定参数 */}
                  {selectedAlgorithm === 'cw_l2' && (
                    <>
                      <div className="space-y-2">
                        <Label>置信度参数: {parameters.confidence}</Label>
                        <Slider
                          value={[parameters.confidence]}
                          onValueChange={(value) => handleParameterChange('confidence', value[0])}
                          max={1.0}
                          min={0}
                          step={0.05}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          置信度参数，控制对抗样本的置信度
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>学习率: {parameters.lr}</Label>
                        <Slider
                          value={[parameters.lr]}
                          onValueChange={(value) => handleParameterChange('lr', value[0])}
                          max={0.1}
                          min={0.001}
                          step={0.001}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          优化过程的学习率
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>迭代次数: {parameters.iterations}</Label>
                        <Slider
                          value={[parameters.iterations]}
                          onValueChange={(value) => handleParameterChange('iterations', value[0])}
                          max={50}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          优化迭代次数
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>初始常数c: {parameters.initial_const}</Label>
                        <Slider
                          value={[parameters.initial_const]}
                          onValueChange={(value) => handleParameterChange('initial_const', value[0])}
                          max={1.0}
                          min={0.01}
                          step={0.01}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          初始权衡常数c
                        </p>
                      </div>
                    </>
                  )}

                  {/* DPatch特定参数 */}
                  {selectedAlgorithm === 'dpatch' && (
                    <>
                      <div className="space-y-2">
                        <Label>贴片大小: {parameters.patch_size}</Label>
                        <Slider
                          value={[parameters.patch_size]}
                          onValueChange={(value) => handleParameterChange('patch_size', value[0])}
                          max={100}
                          min={10}
                          step={1}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          DPatch攻击中使用的贴片大小（像素）
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>迭代次数: {parameters.iterations}</Label>
                        <Slider
                          value={[parameters.iterations]}
                          onValueChange={(value) => handleParameterChange('iterations', value[0])}
                          max={50}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          贴片优化的迭代次数
                        </p>
                      </div>
                    </>
                  )}

                  {/* DeepFool特定参数 */}
                  {selectedAlgorithm === 'deepfool' && (
                    <>
                      <div className="space-y-2">
                        <Label>最大迭代次数: {parameters.max_iter}</Label>
                        <Slider
                          value={[parameters.max_iter]}
                          onValueChange={(value) => handleParameterChange('max_iter', value[0])}
                          max={100}
                          min={10}
                          step={1}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          DeepFool算法的最大迭代次数
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>越界程度: {parameters.overshoot}</Label>
                        <Slider
                          value={[parameters.overshoot]}
                          onValueChange={(value) => handleParameterChange('overshoot', value[0])}
                          max={0.1}
                          min={0.001}
                          step={0.001}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          越过决策边界的程度
                        </p>
                      </div>
                    </>
                  )}

                  {/* AdvPatch特定参数 */}
                  {selectedAlgorithm === 'advpatch' && (
                    <>
                      <div className="space-y-2">
                        <Label>补丁大小: {parameters.patch_size}</Label>
                        <Slider
                          value={[parameters.patch_size]}
                          onValueChange={(value) => handleParameterChange('patch_size', value[0])}
                          max={0.5}
                          min={0.05}
                          step={0.05}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          补丁大小（相对于图像尺寸的比例）
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>学习率: {parameters.learning_rate}</Label>
                        <Slider
                          value={[parameters.learning_rate]}
                          onValueChange={(value) => handleParameterChange('learning_rate', value[0])}
                          max={0.5}
                          min={0.01}
                          step={0.01}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          补丁优化的学习率
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>最大迭代次数: {parameters.max_iter}</Label>
                        <Slider
                          value={[parameters.max_iter]}
                          onValueChange={(value) => handleParameterChange('max_iter', value[0])}
                          max={200}
                          min={10}
                          step={10}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          补丁优化的最大迭代次数
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2 py-2">
                        <Switch
                          id="random-locations"
                          checked={parameters.random_locations}
                          onCheckedChange={(checked) => handleParameterChange('random_locations', checked)}
                        />
                        <Label htmlFor="random-locations">随机位置放置</Label>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>补丁数量: {parameters.num_patches}</Label>
                        <Slider
                          value={[parameters.num_patches]}
                          onValueChange={(value) => handleParameterChange('num_patches', value[0])}
                          max={5}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          放置的补丁数量
                        </p>
                      </div>
                    </>
                  )}
                </>
              )}

              {selectedScenario === 'optical' && (
                <>
                  {/* 亮度攻击特定参数 */}
                  {selectedAlgorithm === 'brightness' && (
                    <div className="space-y-2">
                      <Label>亮度因子: {parameters.brightness_factor}</Label>
                      <Slider
                        value={[parameters.brightness_factor]}
                        onValueChange={(value) => handleParameterChange('brightness_factor', value[0])}
                        max={3.0}
                        min={0.1}
                        step={0.1}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        亮度调整因子（1.0=不变，{'>'}1.0=增亮，&lt;1.0=变暗）
                      </p>
                    </div>
                  )}

                  {/* 高斯噪声攻击特定参数 */}
                  {selectedAlgorithm === 'gaussian' && (
                    <div className="space-y-2">
                      <Label>噪声标准差: {parameters.noise_std}</Label>
                      <Slider
                        value={[parameters.noise_std]}
                        onValueChange={(value) => handleParameterChange('noise_std', value[0])}
                        max={0.5}
                        min={0.01}
                        step={0.01}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        高斯噪声的标准差（0=无噪声，数值越大噪声越强）
                      </p>
                    </div>
                  )}

                  {/* 对比度攻击特定参数 */}
                  {selectedAlgorithm === 'contrast' && (
                    <div className="space-y-2">
                      <Label>对比度因子: {parameters.contrast_factor}</Label>
                      <Slider
                        value={[parameters.contrast_factor]}
                        onValueChange={(value) => handleParameterChange('contrast_factor', value[0])}
                        max={3.0}
                        min={0.1}
                        step={0.1}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        对比度调整因子（1.0=不变，{'>'}1.0=增加对比度，&lt;1.0=降低对比度）
                      </p>
                    </div>
                  )}

                  {/* 通用光电干扰参数 */}
                  {selectedAlgorithm !== 'brightness' && selectedAlgorithm !== 'gaussian' && selectedAlgorithm !== 'contrast' && (
                    <div className="space-y-2">
                      <Label>亮度调整: {parameters.brightness}</Label>
                      <Slider
                        value={[parameters.brightness]}
                        onValueChange={(value) => handleParameterChange('brightness', value[0])}
                        max={2.0}
                        min={0.1}
                        step={0.1}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        调整图像整体亮度
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>对比度: {parameters.contrast}</Label>
                    <Slider
                      value={[parameters.contrast]}
                      onValueChange={(value) => handleParameterChange('contrast', value[0])}
                      max={3.0}
                      min={0.1}
                      step={0.1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      调整图像对比度
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>噪声强度: {parameters.noise_level}</Label>
                    <Slider
                      value={[parameters.noise_level]}
                      onValueChange={(value) => handleParameterChange('noise_level', value[0])}
                      max={0.5}
                      min={0.01}
                      step={0.01}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      高斯噪声的标准差
                    </p>
                  </div>
                </>
              )}

              <Separator />

              <div className="space-y-4">
                <Label className="text-base font-medium">评估选项</Label>
                <div className="space-y-2">
                  <Label>评估图像数量</Label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      type="number" 
                      value={parameters.num_images || 10} 
                      onChange={(e) => handleParameterChange('num_images', parseInt(e.target.value) || 10)} 
                      className="w-full" 
                      min="1"
                    />
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="use-all-images"
                        checked={parameters.num_images === -1}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleParameterChange('num_images', -1);
                          } else {
                            handleParameterChange('num_images', 10);
                          }
                        }}
                      />
                      <Label htmlFor="use-all-images" className="text-sm">使用全部图像</Label>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    评估图像数量，-1表示全部
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>置信度阈值: {parameters.conf_threshold || 0.25}</Label>
                  <Slider
                    value={[parameters.conf_threshold || 0.25]}
                    onValueChange={(value) => handleParameterChange('conf_threshold', value[0])}
                    max={1.0}
                    min={0.05}
                    step={0.05}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    检测置信度阈值
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>IoU阈值: {parameters.iou_threshold || 0.5}</Label>
                  <Slider
                    value={[parameters.iou_threshold || 0.5]}
                    onValueChange={(value) => handleParameterChange('iou_threshold', value[0])}
                    max={1.0}
                    min={0.1}
                    step={0.05}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    检测重叠框IoU阈值
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 可视化配置 */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                可视化配置
              </CardTitle>
              <CardDescription>选择要显示的可视化内容</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {visualizationTypes.map((type) => (
                  <div key={type.id} className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">{type.name}</Label>
                    </div>
                    <Switch defaultChecked={type.enabled} />
                  </div>
                ))}
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <Label>可视化样本数量</Label>
                <Input 
                  type="number" 
                  value={parameters.vis_samples || 5} 
                  onChange={(e) => handleParameterChange('vis_samples', parseInt(e.target.value) || 5)}
                  className="w-full" 
                  min="1"
                  max={parameters.num_images === -1 ? 20 : Math.min(parameters.num_images, 20)}
                />
                <p className="text-xs text-muted-foreground">
                  要在可视化页面中显示的样本数量
                </p>
              </div>
              
              {/* 结果图像展示已按需求移除。可在“过程可视化”页面查看完整结果。*/}
            </CardContent>
          </Card>
        </div>

        {/* 右侧控制面板 */}
        <div className="space-y-6">
          {/* 执行控制 */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle>执行控制</CardTitle>
              <CardDescription>启动和控制攻击过程</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleStartAttack}
                disabled={isRunning}
                className="w-full"
                size="lg"
              >
                {isRunning ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    执行中...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    开始攻击
                  </>
                )}
              </Button>

              {isRunning && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>进度</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full h-2" />
                  <p className="text-xs text-muted-foreground">
                    {taskStatus?.status || '正在生成对抗样本...'}
                  </p>
                </div>
              )}

              <div className="flex space-x-2">
                <Button variant="outline" className="flex-1" disabled={!isRunning}>
                  <Pause className="h-3 w-3 mr-1" />
                  暂停
                </Button>
                <Button variant="outline" className="flex-1">
                  <RotateCcw className="h-3 w-3 mr-1" />
                  重置
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 当前配置摘要 */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle>配置摘要</CardTitle>
              <CardDescription>当前选择的配置信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">场景类型</span>
                <Badge variant="outline">
                  {selectedScenario === 'adversarial' ? '对抗攻击' : '光电干扰'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">目标模型</span>
                <span className="text-sm font-medium">
                  {models.find(m => m.id === selectedModel)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">数据集</span>
                <span className="text-sm font-medium">
                  {datasets.find(d => d.id === selectedDataset)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">攻击算法</span>
                <span className="text-sm font-medium">
                  {attackAlgorithms[selectedScenario]?.find(a => a.id === selectedAlgorithm)?.name}
                </span>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <span className="text-sm font-medium">关键参数</span>
                {selectedScenario === 'adversarial' ? (
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>扰动预算</span>
                      <span>{parameters.epsilon}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>学习率</span>
                      <span>{parameters.alpha}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>迭代次数</span>
                      <span>{parameters.iterations}</span>
                    </div>
                    {/* 在摘要中显示贴片大小 */}
                    {selectedAlgorithm === 'dpatch' && (
                      <div className="flex justify-between">
                        <span>贴片大小</span>
                        <span>{parameters.patch_size}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1 text-xs">
                    {/* 亮度攻击特定参数显示 */}
                    {selectedAlgorithm === 'brightness' && (
                      <div className="flex justify-between">
                        <span>亮度因子</span>
                        <span>{parameters.brightness_factor}</span>
                      </div>
                    )}
                    
                    {/* 高斯噪声攻击特定参数显示 */}
                    {selectedAlgorithm === 'gaussian' && (
                      <div className="flex justify-between">
                        <span>噪声标准差</span>
                        <span>{parameters.noise_std}</span>
                      </div>
                    )}
                    
                    {/* 对比度攻击特定参数显示 */}
                    {selectedAlgorithm === 'contrast' && (
                      <div className="flex justify-between">
                        <span>对比度因子</span>
                        <span>{parameters.contrast_factor}</span>
                      </div>
                    )}
                    
                    {/* 其他光电干扰参数显示 */}
                    {selectedAlgorithm !== 'brightness' && selectedAlgorithm !== 'gaussian' && selectedAlgorithm !== 'contrast' && (
                      <>
                        <div className="flex justify-between">
                          <span>亮度</span>
                          <span>{parameters.brightness}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>对比度</span>
                          <span>{parameters.contrast}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>噪声强度</span>
                          <span>{parameters.noise_level}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 日志输出 */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                执行日志
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto text-xs font-mono">
                {logMessages.length > 0 ? (
                  logMessages.map(log => (
                    <div key={log.id} className="flex items-center space-x-2">
                      {log.type === 'success' && <CheckCircle className="h-3 w-3 text-green-500" />}
                      {log.type === 'error' && <AlertTriangle className="h-3 w-3 text-red-500" />}
                      {log.type === 'info' && (
                        <div className={`h-3 w-3 ${isRunning ? 'bg-blue-500 animate-pulse' : 'bg-blue-400'} rounded-full`} />
                      )}
                      <span className="flex-1">{log.message}</span>
                      <span className="text-gray-400 text-[10px]">{log.timestamp}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div key="log-default-1" className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>配置验证完成</span>
                    </div>
                    <div key="log-default-2" className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>模型加载成功</span>
                    </div>
                    <div key="log-default-3" className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>数据集准备就绪</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

