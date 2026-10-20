<template>
  <div class="detail">
    <h2>📖 商品详情页</h2>
    <p>测试文字：详情页面成功渲染</p>
    <p>商品ID：{{ $route.params.id }}</p>
    <button @click="goBack">返回商品列表</button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
function goBack(){
  router.back()
}
</script>
