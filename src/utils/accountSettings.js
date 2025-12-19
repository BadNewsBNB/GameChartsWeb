/**
 * 账号设置管理工具
 * 用于统一管理 Bangumi Access Token 和 NSFW 设置
 */

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'bangumi_access_token',
  INCLUDE_NSFW: 'bangumi_include_nsfw'
}

/**
 * 获取 Access Token
 * @returns {string}
 */
export function getAccessToken() {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || ''
  } catch (error) {
    console.error('获取 Access Token 失败:', error)
    return ''
  }
}

/**
 * 设置 Access Token
 * @param {string} token 
 */
export function setAccessToken(token) {
  try {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token || '')
  } catch (error) {
    console.error('保存 Access Token 失败:', error)
  }
}

/**
 * 获取是否包含 NSFW 内容
 * @returns {boolean}
 */
export function getIncludeNSFW() {
  try {
    return localStorage.getItem(STORAGE_KEYS.INCLUDE_NSFW) === 'true'
  } catch (error) {
    console.error('获取 NSFW 设置失败:', error)
    return false
  }
}

/**
 * 设置是否包含 NSFW 内容
 * @param {boolean} include 
 */
export function setIncludeNSFW(include) {
  try {
    localStorage.setItem(STORAGE_KEYS.INCLUDE_NSFW, include ? 'true' : 'false')
  } catch (error) {
    console.error('保存 NSFW 设置失败:', error)
  }
}

/**
 * 获取所有账号设置
 * @returns {Object} { accessToken, includeNSFW }
 */
export function getAccountSettings() {
  return {
    accessToken: getAccessToken(),
    includeNSFW: getIncludeNSFW()
  }
}

/**
 * 清除所有账号设置
 */
export function clearAccountSettings() {
  try {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.INCLUDE_NSFW)
  } catch (error) {
    console.error('清除账号设置失败:', error)
  }
}

export default {
  getAccessToken,
  setAccessToken,
  getIncludeNSFW,
  setIncludeNSFW,
  getAccountSettings,
  clearAccountSettings
}

