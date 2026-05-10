/**
 * 导出工具函数
 */

/**
 * 将文本内容下载为文件
 * @param content 文件内容
 * @param filename 文件名
 * @param mimeType MIME类型
 */
export const downloadTextFile = (content: string, filename: string, mimeType = 'text/plain'): void => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 导出兑换码列表为文本文件
 * @param codes 兑换码数组
 * @returns 导出的文件名
 */
export const exportRedeemCodesToText = (codes: string[]): string => {
  const content = codes.join('\n')
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const filename = `redeem-codes-${timestamp}.txt`
  
  downloadTextFile(content, filename)
  
  return filename
}
