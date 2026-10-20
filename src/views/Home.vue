<template>
  <div class="derm-site" ref="siteRef">
    <!-- 噪点纹理层 -->
    <div class="grain"></div>

    <!-- ============ HERO ============ -->
    <section class="hero">
      <h1 class="small-team">
        <span class="word"><span>Two</span></span>
        <span class="word"><span>stars,</span></span>
        <span class="word"><span>one</span></span>
        <span class="word"><span>Yan</span></span>
      </h1>

      <div class="big-results-wrap">
        <div class="big-results" aria-hidden="true">
          <span class="letter">J</span><span class="letter">i</span><span class="letter">n</span><span class="letter">g</span><span class="letter">Y</span><span class="letter">a</span><span class="letter">n</span>
        </div>
      </div>

      <!-- 卡片行 -->
      <div class="cards-row">
        <div
          v-for="(c, i) in coverImages"
          :key="c.id"
          class="card"
          :class="`card-${i + 1}`"
          :data-rot="[-8,-5,-3,-1.5,0,2,4,7][i]"
          :data-depth="[12,9,7,5,10,6,8,11][i]"
          :style="c.img ? { backgroundImage: `url(${c.img})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}"
        ></div>
      </div>

      <div class="subline" id="subline">
        <!-- 点击进入画廊（文案可以自己改成情话） -->
        <router-link to="/gallery" class="arrow-pill">
          Meet the crew
          <span class="ar">→</span>
        </router-link>
        <p class="subline-text">8 people. 60+ shipped projects. Zero filler.</p>
      </div>
    </section>

    <!-- ============ 团队 ============ -->
    <section class="team-section">
      <div class="team-head">
        <div>
          <div class="eyebrow">Diagnosis</div>
          <h2>Small team, <em>big results</em></h2>
        </div>
        <p>Meet the crew: 8 people. 60+ shipped projects. Zero filler.</p>
      </div>

      <div class="team-grid">
        <div class="t-card">
          <div class="t-meta"><div class="nm">Mateus Aldana</div><div class="rl">Creative Director</div></div>
        </div>
        <div class="t-card">
          <div class="t-meta"><div class="nm">Eli Ramirez</div><div class="rl">Design Lead</div></div>
        </div>
        <div class="t-card">
          <div class="t-meta"><div class="nm">Naomi Park</div><div class="rl">Brand Strategist</div></div>
        </div>
        <div class="t-card">
          <div class="t-meta"><div class="nm">Theo Vance</div><div class="rl">Senior Engineer</div></div>
        </div>
        <div class="t-card">
          <div class="t-meta"><div class="nm">Kit Bellamy</div><div class="rl">Art Direction</div></div>
        </div>
        <div class="t-card">
          <div class="t-meta"><div class="nm">Ravi Saigal</div><div class="rl">Motion · 3D</div></div>
        </div>
        <div class="t-card">
          <div class="t-meta"><div class="nm">Iris Caldwell</div><div class="rl">Producer</div></div>
        </div>
        <div class="t-card">
          <div class="t-meta"><div class="nm">Maya Okafor</div><div class="rl">Founder · CEO</div></div>
        </div>
      </div>
    </section>

    <!-- ============ 统计 / CTA ============ -->
    <section class="stats">
      <div class="stats-inner">
        <h3>Cellular Dermal <em>Intelligence.</em></h3>
        <div class="stat-block">
          <div class="num" data-count="120"><span>0</span><small>+</small></div>
          <div class="lbl">Projects shipped</div>
        </div>
        <div class="stat-block">
          <div class="num" data-count="12"><span>0</span><small>yrs</small></div>
          <div class="lbl">Combined craft</div>
        </div>
        <div class="stat-block">
          <div class="num" data-count="0.4"><span>0</span></div>
          <div class="lbl">Avg NPS</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './derm.css'
import { site } from '../data/site.js'

const coverImages = site.coverImages

gsap.registerPlugin(ScrollTrigger)

const siteRef = ref(null)
let ctx = null
let rafId = null
let mx = 0, my = 0, tx = 0, ty = 0

function parallaxLoop(root) {
  const cards = root.querySelectorAll('.card')
  tx += (mx - tx) * 0.05
  ty += (my - ty) * 0.05
  cards.forEach((card) => {
    const d = parseFloat(card.dataset.depth) || 8
    card.style.translate = `${tx * d}px ${ty * d * 0.5}px`
  })
  rafId = requestAnimationFrame(() => parallaxLoop(root))
}

onMounted(() => {
  const root = siteRef.value
  if (!root) return

  ctx = gsap.context(() => {
    const cards = root.querySelectorAll('.card')
    const tCards = root.querySelectorAll('.t-card')

    // 初始状态
    gsap.set('.small-team .word > span', { y: '105%' })
    gsap.set('.big-results .letter', { y: 80, opacity: 0 })
    gsap.set('#subline', { opacity: 0, y: 20 })
    gsap.set('.t-card', { opacity: 0 })
    gsap.set('.stats-inner', { opacity: 0 })

    cards.forEach((card) => {
      const rot = parseFloat(card.dataset.rot) || 0
      card.dataset.restRot = rot
      gsap.set(card, { y: -800, rotation: rot + 25, opacity: 0, scale: 0.7 })
    })

    // 入场时间线
    const intro = gsap.timeline({ defaults: { ease: 'power3.out' } })
    intro
      .to('.small-team .word > span', { y: '0%', duration: 0.9, stagger: 0.08, ease: 'power3.out' }, 0.3)
      .to('.big-results .letter', { y: 0, opacity: 1, duration: 0.9, stagger: 0.05, ease: 'back.out(1.6)' }, 0.55)
      .to('.card', {
        y: 0, opacity: 1, scale: 1,
        rotation: (i, el) => parseFloat(el.dataset.restRot) || 0,
        duration: 1.1, stagger: { each: 0.08, from: 'center' }, ease: 'back.out(1.4)'
      }, 0.8)
      .to('#subline', { opacity: 1, y: 0, duration: 0.8 }, 1.6)

    // 卡片持续浮动
    cards.forEach((card, i) => {
      const rot = parseFloat(card.dataset.restRot) || 0
      gsap.to(card, {
        y: `+=${8 + (i % 3) * 5}`,
        rotation: rot + (i % 2 === 0 ? 1.5 : -1.5),
        duration: 3 + (i % 4) * 0.5,
        delay: 1.8 + i * 0.1,
        ease: 'sine.inOut', yoyo: true, repeat: -1
      })
    })

    // 卡片 hover 3D
    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width - 0.5
        const py = (e.clientY - r.top) / r.height - 0.5
        gsap.to(card, {
          rotateX: -py * 16, rotateY: px * 16, scale: 1.12, zIndex: 20,
          duration: 0.4, ease: 'power2.out', transformPerspective: 700, overwrite: 'auto'
        })
      })
      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          rotateX: 0, rotateY: 0, scale: 1, zIndex: card.style.zIndex || '',
          duration: 0.8, ease: 'elastic.out(1, 0.6)', overwrite: 'auto'
        })
      })
      card.addEventListener('click', () => {
        gsap.fromTo(card, { scale: 1.15 }, { scale: 1.05, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.inOut' })
      })
    })

    // 鼠标视差
    const hero = root.querySelector('.hero')
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect()
      mx = ((e.clientX - r.left) / r.width - 0.5) * 2
      my = ((e.clientY - r.top) / r.height - 0.5) * 2
    })
    hero.addEventListener('mouseleave', () => { mx = 0; my = 0 })
    parallaxLoop(root)

    // 滚动：卡片展开
    ScrollTrigger.create({
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 0.8,
      onUpdate: (self) => {
        const p = self.progress
        gsap.set('.big-results', { scale: 1 + 0.15 * p, opacity: 1 - 0.4 * p })
        gsap.set('.small-team', { y: -60 * p, opacity: 1 - p * 1.5 })
        const moves = [
          { x: -260, y: -40, rot: -25 }, { x: -200, y: 20, rot: -18 },
          { x: -120, y: 80, rot: -10 }, { x: -40, y: 120, rot: -4 },
          { x: 40, y: 120, rot: 4 }, { x: 120, y: 80, rot: 12 },
          { x: 200, y: 20, rot: 22 }, { x: 260, y: -40, rot: 28 }
        ]
        cards.forEach((card, i) => {
          const m = moves[i]
          const rest = parseFloat(card.dataset.restRot) || 0
          gsap.set(card, { x: m.x * p, y: m.y * p, rotation: rest + m.rot * p })
        })
        gsap.set('#subline', { opacity: 1 - p * 2 })
      }
    })

    // 团队滚动显现
    gsap.from('.eyebrow, .team-head h2, .team-head p', {
      opacity: 0, y: 30, duration: 0.9, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: '.team-head', start: 'top 80%' }
    })
    gsap.from(tCards, {
      y: 80, scale: 0.9, rotation: (i) => (i % 2 === 0 ? -3 : 3),
      duration: 1, stagger: 0.08, ease: 'back.out(1.3)',
      scrollTrigger: { trigger: '.team-grid', start: 'top 80%' }
    })
    gsap.to(tCards, {
      opacity: 1, y: 0, duration: 1, stagger: 0.08, ease: 'power3.out',
      scrollTrigger: { trigger: '.team-grid', start: 'top 80%' }
    })

    // 统计显现 + 数字滚动
    gsap.to('.stats-inner', {
      opacity: 1, y: 0, duration: 1.2, ease: 'power3.out',
      scrollTrigger: { trigger: '.stats', start: 'top 80%' }
    })
    gsap.from('.stats-inner', {
      y: 60, scale: 0.97, duration: 1.2, ease: 'power3.out',
      scrollTrigger: { trigger: '.stats', start: 'top 80%' }
    })
    ScrollTrigger.create({
      trigger: '.stats',
      start: 'top 75%',
      once: true,
      onEnter: () => {
        root.querySelectorAll('.stat-block .num').forEach((el) => {
          const target = parseFloat(el.dataset.count)
          const span = el.querySelector('span')
          const decimals = (String(target).split('.')[1] || '').length
          gsap.fromTo(
            { v: 0 },
            {
              v: target,
              duration: 2,
              ease: 'power2.out',
              onUpdate: function () {
                span.textContent = this.targets()[0].v.toFixed(decimals)
              }
            }
          )
        })
      }
    })

    // 按钮点击动画
    root.querySelectorAll('.nav-cta, .arrow-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        gsap.fromTo(btn, { scale: 1 }, { scale: 0.93, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.inOut' })
      })
    })

    // big results 字母 hover
    const bw = root.querySelector('.big-results-wrap')
    if (bw) {
      bw.addEventListener('mouseenter', () => {
        gsap.to('.big-results .letter', { y: -8, duration: 0.5, stagger: 0.03, ease: 'back.out(1.6)' })
      })
      bw.addEventListener('mouseleave', () => {
        gsap.to('.big-results .letter', { y: 0, duration: 0.6, stagger: 0.03, ease: 'elastic.out(1, 0.6)' })
      })
    }
  }, root)
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
  if (ctx) ctx.revert()
})
</script>
