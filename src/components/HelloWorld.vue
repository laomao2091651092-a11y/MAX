import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Goods from '../views/Goods.vue'
import Detail from '../views/Detail.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/goods',
    name: 'Goods',
    component: Goods
  },
  {
    path: '/detail/:id',
    name: 'Detail',
    component: Detail
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
