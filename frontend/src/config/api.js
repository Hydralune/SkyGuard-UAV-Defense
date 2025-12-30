// API 配置
// 后端服务器地址 - 统一在这里修改
export const API_BASE_URL = 'http://222.20.126.214:8001'

// API 端点配置
export const API_ENDPOINTS = {
  // 任务相关
  TASK_STATUS: (taskId) => `/api/task/${taskId}`,
  
  // 攻击相关
  ATTACK_RUN: '/api/attack/run',
  
  // 防御相关
  DEFENSE_TRAIN: '/api/defense/train',
  DEFENSE_RUN: '/api/defense/run',
  DEFENSE_DETECT: '/api/defense/detect',
  
  // 可视化相关
  VISUALIZATION_RESULTS: (taskId) => `/visualization/results/${taskId}`,
  VISUALIZATION_RECENT_TASKS: '/visualization/recent-tasks',
  VISUALIZATION_LATEST_TASK: '/visualization/latest-task',
  
  // 系统相关
  SYSTEM_LOAD: '/system/load',
  SYSTEM_LOGS: '/system/logs',
  
  // 场景相关
  SCENARIOS_RUN: '/scenarios/run',
  SCENARIOS_STATUS: (taskId) => `/scenarios/${taskId}`,
  
  // 演练相关
  START_BASIC_DRILL: '/api/start-basic-drill',
  GET_RESULT: (id) => `/api/get-result/${id}`,
}

/**
 * 构建完整的 API URL
 * @param {string} endpoint - API 端点路径（以 / 开头）
 * @returns {string} 完整的 URL
 */
export function getApiUrl(endpoint) {
  // 如果 endpoint 已经是完整 URL，直接返回
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint
  }
  // 确保 endpoint 以 / 开头
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  // 移除 API_BASE_URL 末尾的斜杠（如果有）
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL
  return `${baseUrl}${path}`
}

