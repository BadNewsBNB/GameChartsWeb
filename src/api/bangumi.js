import axios from 'axios'

// 创建 axios 实例
const request = axios.create({
  baseURL: '/api', // 使用代理
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'bangumi-web/1.0.0 (https://github.com/bangumi)'
  }
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('响应错误:', error)
    return Promise.reject(error)
  }
)

/**
 * 条目搜索
 * @param {Object} params - 搜索参数
 * @param {string} params.keyword - 搜索关键词（必填）
 * @param {string} params.sort - 排序方式: match/heat/rank/score
 * @param {number} params.limit - 每页数量
 * @param {number} params.offset - 偏移量
 * @param {Object} params.filter - 筛选条件
 * @param {Array<number>} params.filter.type - 条目类型: 1=书籍, 2=动画, 3=音乐, 4=游戏, 6=三次元
 * @param {Array<string>} params.filter.tag - 标签
 * @param {Array<string>} params.filter.air_date - 播出日期
 * @param {Array<string>} params.filter.rating - 评分范围
 * @param {Array<string>} params.filter.rank - 排名范围
 * @returns {Promise}
 */
export function searchSubjects({ 
  keyword, 
  sort = 'match', 
  limit = 20, 
  offset = 0,
  filter = {}
} = {}) {
  return request({
    url: '/v0/search/subjects',
    method: 'post',
    params: {
      limit,
      offset
    },
    data: {
      keyword,
      sort,
      filter
    }
  })
}

/**
 * 获取每日放送
 * @returns {Promise}
 */
export function getCalendar() {
  return request({
    url: '/calendar',
    method: 'get'
  })
}

/**
 * 角色搜索
 * @param {Object} params - 搜索参数
 * @param {string} params.keyword - 搜索关键词
 * @param {number} params.limit - 每页数量
 * @param {number} params.offset - 偏移量
 * @returns {Promise}
 */
export function searchCharacters({ keyword, limit = 20, offset = 0 } = {}) {
  return request({
    url: '/v0/search/characters',
    method: 'post',
    params: {
      limit,
      offset
    },
    data: {
      keyword
    }
  })
}

/**
 * 人物搜索
 * @param {Object} params - 搜索参数
 * @param {string} params.keyword - 搜索关键词
 * @param {number} params.limit - 每页数量
 * @param {number} params.offset - 偏移量
 * @returns {Promise}
 */
export function searchPersons({ keyword, limit = 20, offset = 0 } = {}) {
  return request({
    url: '/v0/search/persons',
    method: 'post',
    params: {
      limit,
      offset
    },
    data: {
      keyword
    }
  })
}

/**
 * 获取当前用户信息
 * @param {string} accessToken - Access Token
 * @returns {Promise}
 */
export function getCurrentUser(accessToken) {
  return request({
    url: '/v0/me',
    method: 'get',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })
}

/**
 * 获取用户收藏列表
 * @param {Object} params - 参数
 * @param {string} params.username - 用户名
 * @param {string} params.accessToken - Access Token
 * @param {number} params.subjectType - 条目类型（可选）
 * @param {number} params.type - 收藏类型（可选）
 * @param {number} params.limit - 每页数量
 * @param {number} params.offset - 偏移量
 * @returns {Promise}
 */
export function getUserCollections({ 
  username, 
  accessToken,
  subjectType,
  type,
  limit = 50, 
  offset = 0 
} = {}) {
  return request({
    url: `/v0/users/${username}/collections`,
    method: 'get',
    params: {
      subject_type: subjectType,
      type,
      limit,
      offset
    },
    headers: accessToken ? {
      'Authorization': `Bearer ${accessToken}`
    } : {}
  })
}

/**
 * 批量获取条目详情
 * @param {Array<number>} subjectIds - 条目ID数组
 * @returns {Promise}
 */
export function getSubjectsByIds(subjectIds) {
  // Bangumi API 不支持批量查询，需要单独查询
  return Promise.all(
    subjectIds.map(id => 
      request({
        url: `/v0/subjects/${id}`,
        method: 'get'
      })
    )
  )
}

export default {
  searchSubjects,
  getCalendar,
  searchCharacters,
  searchPersons,
  getCurrentUser,
  getUserCollections,
  getSubjectsByIds
}

