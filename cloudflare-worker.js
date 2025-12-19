/**
 * Cloudflare Worker - Bangumi API 代理
 * 
 * 部署到 Cloudflare Workers 后，将此 Worker 的 URL 配置到前端
 * 例如: https://your-worker.your-subdomain.workers.dev
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // 转发到 Bangumi API
  if (url.pathname.startsWith('/v0/') || url.pathname === '/calendar') {
    const apiUrl = 'https://api.bgm.tv' + url.pathname + url.search
    
    // 处理 OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
      return handleCORS()
    }
    
    // 复制请求头
    const headers = new Headers(request.headers)
    headers.set('Origin', 'https://api.bgm.tv')
    headers.set('Referer', 'https://api.bgm.tv')
    
    // 创建新的请求，禁用 Cloudflare 缓存
    const apiRequest = new Request(apiUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
      // 禁用 Cloudflare 缓存
      cf: {
        cacheTtl: 0,           // 不缓存
        cacheEverything: false // 不缓存所有内容
      }
    })
    
    try {
      // 发送请求到 Bangumi API
      const response = await fetch(apiRequest)
      
      // 创建新的响应，添加 CORS 头
      const newResponse = new Response(response.body, response)
      
      // 设置 CORS 头
      newResponse.headers.set('Access-Control-Allow-Origin', '*')
      newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      newResponse.headers.set('Access-Control-Max-Age', '86400')
      
      // 添加缓存控制头，确保响应不被缓存
      newResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      newResponse.headers.set('Pragma', 'no-cache')
      newResponse.headers.set('Expires', '0')
      
      return newResponse
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'API request failed', 
        message: error.message 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
  }
  
  // 其他请求返回 404
  return new Response('Not Found', { 
    status: 404,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  })
}

// 处理 CORS 预检请求
function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}

