<template>
  <div class="goods">
    <h2>📦 商品列表页</h2>
    <ul>
      <li><router-link to="/detail/1">Vue入门教程</router-link></li>
      <li><router-link to="/detail/2">Vite实战项目</router-link></li>
      <li><router-link to="/detail/3">前端开发手册</router-link></li>
    </ul>
    <!-- 编程式导航按钮 -->
    <button @click="goToDetail(2)">点击查看第2本书详情</button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
function goToDetail(id){
  router.push(`/detail/${id}`)
}
</script>
