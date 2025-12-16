import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue')
    },
    {
      path: '/admin/dashboard',
      name: 'admin-dashboard',
      component: () => import('../views/admin/AdminDashboard.vue'),
      meta: { requiresAuth: true, role: 'admin' }
    },
    {
      path: '/reader',
      component: () => import('../views/reader/ReaderHomeView.vue'),
      meta: { requiresAuth: true },
      redirect: '/reader/home',
      children: [
        {
          path: 'home',
          name: 'reader-home',
          component: () => import('../views/reader/HomeView.vue')
        },
        {
          path: 'search',
          name: 'reader-search',
          component: () => import('../views/reader/SearchView.vue')
        },
        {
          path: 'borrow',
          name: 'reader-borrow',
          component: () => import('../views/reader/BorrowView.vue')
        },
        {
          path: 'reservation',
          name: 'reader-reservation',
          component: () => import('../views/reader/ReservationView.vue')
        },
        {
          path: 'profile',
          name: 'reader-profile',
          component: () => import('../views/reader/ProfileView.vue')
        }
      ]
    }
  ]
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  if (requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    // 根据角色跳转
    if (authStore.isAdmin || authStore.isSuperAdmin) {
      next('/admin/dashboard')
    } else {
      next('/reader/home')
    }
  } else {
    next()
  }
})

export default router
