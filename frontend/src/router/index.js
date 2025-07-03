import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/dashboard/index.vue'),
    meta: { title: '控制台' }
  },
  {
    path: '/attack',
    name: 'Attack',
    component: () => import('../views/attack/index.vue'),
    meta: { title: '对抗攻击' }
  },
  {
    path: '/interference',
    name: 'Interference',
    component: () => import('../views/interference/index.vue'),
    meta: { title: '环境干扰' }
  },
  {
    path: '/defense',
    name: 'Defense',
    component: () => import('../views/defense/index.vue'),
    meta: { title: '对抗防御' }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('../views/reports/index.vue'),
    meta: { title: '评分报告' }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// 设置页面标题
router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - SkyGuard UAV Defense` : 'SkyGuard UAV Defense'
  next()
})

export default router 