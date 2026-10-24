<template>
  <div class="page">
    <div class="hb-wrap">
      <h1 class="hb-title">♠️ 桥牌社 🃏</h1>
      <p class="hb-sub">选择玩法：自己跟电脑练手，或者叫上朋友开一桌</p>

      <div class="hb-grid">
        <!-- 人机对战 -->
        <router-link to="/bridge/solo" class="hb-card">
          <div class="hb-emoji">🤖</div>
          <h2 class="hb-h2">人机对战</h2>
          <p class="hb-desc">
            你 + 3 个电脑对手，随时开局。<br />
            可选 简单 / 中等 / 困难 三档难度。
          </p>
          <span class="hb-go">开始练习 →</span>
        </router-link>

        <!-- 好友对战 -->
        <router-link to="/bridge/room" class="hb-card alt">
          <div class="hb-emoji">🧑‍🤝‍🧑</div>
          <h2 class="hb-h2">好友对战</h2>
          <p class="hb-desc">
            创建或加入房间，东西南北四人同桌。<br />
            空位由电脑替补，随时可以开始。
          </p>
          <span class="hb-go">进入房间 →</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
// 模式选择页：不做别的，只把玩家分流到两种玩法
</script>

<style scoped>
.hb-wrap {
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
}
.hb-title {
  font-size: 30px;
  font-weight: 800;
  color: #141416;
  margin-bottom: 8px;
}
.hb-sub {
  font-size: 14px;
  color: #7d766c;
  margin-bottom: 34px;
}
.hb-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
.hb-card {
  display: block;
  padding: 38px 28px 30px;
  border-radius: 26px;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
  box-shadow: 0 22px 50px rgba(120, 90, 50, 0.16);
  transition: transform 0.3s cubic-bezier(0.6, 0, 0.2, 1), box-shadow 0.3s;
}
.hb-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 30px 62px rgba(120, 90, 50, 0.24);
}
.hb-card.alt {
  background: rgba(255, 251, 242, 0.72);
}
.hb-emoji {
  font-size: 46px;
  margin-bottom: 12px;
}
.hb-h2 {
  font-size: 21px;
  font-weight: 800;
  color: #141416;
  margin-bottom: 10px;
}
.hb-desc {
  font-size: 13px;
  line-height: 1.7;
  color: #7d766c;
  margin-bottom: 20px;
}
.hb-go {
  display: inline-block;
  font-size: 14px;
  font-weight: 700;
  color: #d9351f;
}

@media (max-width: 760px) {
  .hb-grid { grid-template-columns: 1fr; }
  .hb-title { font-size: 25px; }
}
</style>
