import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 30000  // 超时时间30秒
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 可以在这里设置token等通用请求头
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    // 处理HTTP错误状态码
    const { response } = error
    if (response) {
      switch (response.status) {
        case 401:
          console.error('未授权，请重新登录')
          break
        case 403:
          console.error('拒绝访问')
          break
        case 404:
          console.error('请求的资源不存在')
          break
        case 500:
          console.error('服务器错误')
          break
        default:
          console.error(`请求失败: ${response.status}`)
      }
    } else {
      if (error.message.includes('timeout')) {
        console.error('请求超时')
      } else {
        console.error('网络错误，请检查您的网络连接')
      }
    }
    return Promise.reject(error)
  }
)

// API服务
export default {
  // 执行攻击
  executeAttack(data) {
    return api.post('/execute/attack', data)
  },
  
  // 执行干扰
  executeInterference(data) {
    return api.post('/execute/interfere', data)
  },
  
  // 执行防御
  executeDefense(data) {
    return api.post('/execute/defend', data)
  },
  
  // 获取任务状态
  getTaskStatus(taskId) {
    return api.get(`/tasks/${taskId}`)
  },
  
  // 获取任务结果
  getTaskResult(taskId) {
    return api.get(`/results/${taskId}`)
  }
} 