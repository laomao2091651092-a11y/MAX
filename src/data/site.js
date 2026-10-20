// ============================================================
// 网站配置（site.js）
// 💡 以后想换站名、情话、封面图，只需要改这个文件！
// ============================================================

// 引入封面图片（Vite 会自动处理 assets 路径）
import img1 from '../assets/images/cover/1.jpg'
import img2 from '../assets/images/cover/2.jpg'
import img3 from '../assets/images/cover/3.jpg'
import img4 from '../assets/images/cover/4.jpg'
import img5 from '../assets/images/cover/5.jpg'
import img6 from '../assets/images/cover/6.jpg'

export const site = {
  // 网站名称（显示在顶部导航 Logo 上，改成你们的名字/昵称）
  name: 'MoJingYan',
  // 首页大标题（可以改成一句情话）
  heroTitle: 'Two stars, one Yan',
  // 底部小字说明
  heroSub: '8 people. 60+ shipped projects. Zero filler.',
  // 封面卡片图列表（8 张，3:4 竖版）
  coverImages: [
    { id: 1, img: img1 },
    { id: 2, img: img2 },
    { id: 3, img: img3 },
    { id: 4, img: img4 },
    { id: 5, img: img5 },
    { id: 6, img: img6 },
    { id: 7, img: '' },
    { id: 8, img: '' },
  ],
}
