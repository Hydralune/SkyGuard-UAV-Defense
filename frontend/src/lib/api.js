import { getApiUrl, API_BASE_URL } from '@/config/api'

/**
 * 统一的 fetch 封装函数
 * 自动添加后端服务器地址前缀
 * 
 * @param {string} endpoint - API 端点路径（如 '/api/task/123'）
 * @param {RequestInit} options - fetch 选项（method, headers, body 等）
 * @returns {Promise<Response>} fetch 响应
 */
export async function apiFetch(endpoint, options = {}) {
  // 构建完整 URL
  const url = getApiUrl(endpoint)
  
  // 设置默认 headers
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  
  // 合并选项
  const fetchOptions = {
    ...options,
    headers: defaultHeaders,
  }
  
  // 执行 fetch
  const response = await fetch(url, fetchOptions)
  
  // 如果响应不成功，抛出错误
  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `请求失败: ${response.status} ${response.statusText}`
    try {
      const errorJson = JSON.parse(errorText)
      errorMessage = errorJson.message || errorJson.error || errorMessage
    } catch {
      errorMessage = errorText || errorMessage
    }
    throw new Error(errorMessage)
  }
  
  return response
}

/**
 * GET 请求的便捷方法
 * @param {string} endpoint - API 端点路径
 * @param {object} params - URL 查询参数（可选）
 * @returns {Promise<Response>} fetch 响应
 */
export async function apiGet(endpoint, params = null) {
  let url = endpoint
  if (params) {
    const queryString = new URLSearchParams(params).toString()
    url = `${endpoint}?${queryString}`
  }
  return apiFetch(url, { method: 'GET' })
}

/**
 * POST 请求的便捷方法
 * @param {string} endpoint - API 端点路径
 * @param {object} body - 请求体（可选）
 * @param {object} params - URL 查询参数（可选）
 * @returns {Promise<Response>} fetch 响应
 */
export async function apiPost(endpoint, body = null, params = null) {
  let url = endpoint
  if (params) {
    const queryString = new URLSearchParams(params).toString()
    url = `${endpoint}?${queryString}`
  }
  
  const options = {
    method: 'POST',
  }
  
  if (body) {
    if (body instanceof FormData) {
      options.body = body
      // FormData 不需要手动设置 Content-Type，浏览器会自动设置
      delete options.headers
    } else {
      options.body = JSON.stringify(body)
    }
  }
  
  return apiFetch(url, options)
}

/**
 * PUT 请求的便捷方法
 * @param {string} endpoint - API 端点路径
 * @param {object} body - 请求体（可选）
 * @returns {Promise<Response>} fetch 响应
 */
export async function apiPut(endpoint, body = null) {
  const options = {
    method: 'PUT',
  }
  
  if (body) {
    options.body = JSON.stringify(body)
  }
  
  return apiFetch(endpoint, options)
}

/**
 * DELETE 请求的便捷方法
 * @param {string} endpoint - API 端点路径
 * @returns {Promise<Response>} fetch 响应
 */
export async function apiDelete(endpoint) {
  return apiFetch(endpoint, { method: 'DELETE' })
}

// 导出后端服务器地址，供需要直接使用的地方
export { API_BASE_URL }

