// 塔罗组合解读爬虫脚本
// 用法：在浏览器控制台运行

const baseUrl = 'https://taluo.net'

// 大阿卡纳牌列表
const majorCards = [
  'major_0', 'major_1', 'major_2', 'major_3', 'major_4',
  'major_5', 'major_6', 'major_7', 'major_8', 'major_9',
  'major_10', 'major_11', 'major_12', 'major_13', 'major_14',
  'major_15', 'major_16', 'major_17', 'major_18', 'major_19',
  'major_20', 'major_21'
]

// 抓双牌组合
async function fetchCombo(card1, card2) {
  const url = `${baseUrl}/combos/${card1}-${card2}/`
  try {
    const res = await fetch(url)
    const html = await res.text()
    
    // 提取内容
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    // 找组合解读内容
    const content = doc.querySelector('.combo-content, .reading-content, main')
    const text = content ? content.innerText : ''
    
    return {
      url: url,
      cards: `${card1} × ${card2}`,
      content: text
    }
  } catch (e) {
    console.error(`失败: ${url}`, e)
    return null
  }
}

// 批量抓双牌组合
async function fetchAllCombos() {
  const results = []
  let count = 0
  const total = majorCards.length * (majorCards.length - 1) / 2
  
  for (let i = 0; i < majorCards.length; i++) {
    for (let j = i + 1; j < majorCards.length; j++) {
      count++
      console.log(`抓取中 ${count}/${total}: ${majorCards[i]} × ${majorCards[j]}`)
      
      const result = await fetchCombo(majorCards[i], majorCards[j])
      if (result) results.push(result)
      
      // 间隔一下，别太快
      await new Promise(r => setTimeout(r, 500))
    }
  }
  
  console.log('抓取完成！')
  console.log(JSON.stringify(results, null, 2))
  
  // 下载
  const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'tarot-combos.json'
  a.click()
}

// 运行
fetchAllCombos()
