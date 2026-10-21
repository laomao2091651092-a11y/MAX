// 塔罗三牌组合爬虫脚本（78张牌）
// 用法：在浏览器控制台运行

const baseUrl = 'https://taluo.net'

// 全部78张牌列表
const allCards = [
  // 大阿卡纳 22张
  'major_0', 'major_1', 'major_2', 'major_3', 'major_4',
  'major_5', 'major_6', 'major_7', 'major_8', 'major_9',
  'major_10', 'major_11', 'major_12', 'major_13', 'major_14',
  'major_15', 'major_16', 'major_17', 'major_18', 'major_19',
  'major_20', 'major_21',
  // 圣杯组 14张
  'cup_0', 'cup_1', 'cup_2', 'cup_3', 'cup_4',
  'cup_5', 'cup_6', 'cup_7', 'cup_8', 'cup_9',
  'cup_10', 'cup_11', 'cup_12', 'cup_13',
  // 宝剑组 14张
  'sword_0', 'sword_1', 'sword_2', 'sword_3', 'sword_4',
  'sword_5', 'sword_6', 'sword_7', 'sword_8', 'sword_9',
  'sword_10', 'sword_11', 'sword_12', 'sword_13',
  // 权杖组 14张
  'wand_0', 'wand_1', 'wand_2', 'wand_3', 'wand_4',
  'wand_5', 'wand_6', 'wand_7', 'wand_8', 'wand_9',
  'wand_10', 'wand_11', 'wand_12', 'wand_13',
  // 星币组 14张
  'pentacle_0', 'pentacle_1', 'pentacle_2', 'pentacle_3', 'pentacle_4',
  'pentacle_5', 'pentacle_6', 'pentacle_7', 'pentacle_8', 'pentacle_9',
  'pentacle_10', 'pentacle_11', 'pentacle_12', 'pentacle_13'
]

// 抓三牌组合
async function fetchTripleCombo(card1, card2, card3) {
  const url = `${baseUrl}/triple/${card1}-${card2}-${card3}/`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    
    const html = await res.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    // 找组合解读内容
    const content = doc.querySelector('.combo-content, .reading-content, main')
    const text = content ? content.innerText : ''
    
    return {
      url: url,
      cards: `${card1} × ${card2} × ${card3}`,
      content: text
    }
  } catch (e) {
    console.error(`失败: ${url}`, e)
    return null
  }
}

// 批量抓三牌组合
async function fetchAllTripleCombos() {
  const results = []
  let count = 0
  const total = allCards.length * (allCards.length - 1) * (allCards.length - 2) / 6
  
  console.log(`开始抓取，共 ${total} 种三牌组合...`)
  console.log(`预计需要 ${Math.round(total * 0.3 / 60)} 分钟`)
  
  for (let i = 0; i < allCards.length; i++) {
    for (let j = i + 1; j < allCards.length; j++) {
      for (let k = j + 1; k < allCards.length; k++) {
        count++
        if (count % 100 === 0) {
          console.log(`进度: ${count}/${total} (${Math.round(count/total*100)}%)`)
        }
        
        const result = await fetchTripleCombo(allCards[i], allCards[j], allCards[k])
        if (result) results.push(result)
        
        // 间隔一下，别太快
        await new Promise(r => setTimeout(r, 300))
      }
    }
  }
  
  console.log('抓取完成！')
  console.log(`成功抓取 ${results.length} 种组合`)
  
  // 下载
  const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'tarot-triple-combos.json'
  a.click()
}

// 运行
fetchAllTripleCombos()
