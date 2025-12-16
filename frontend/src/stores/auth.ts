// 认证状态管理
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { AuthService } from '@/services/authService'
import type { User } from '@/types/models'
import type { LoginCredentials } from '@/services/authService'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(AuthService.getCurrentUser())
  const token = ref<string | null>(AuthService.getToken())

  const isAuthenticated = computed(() => {
    return token.value !== null && user.value !== null && AuthService.isAuthenticated()
  })
  const isReader = computed(() => user.value?.role === 'reader')
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isSuperAdmin = computed(() => user.value?.role === 'superadmin')

  async function login(credentials: LoginCredentials) {
    const response = await AuthService.login(credentials)
    if (response.success && response.user && response.token) {
      user.value = response.user
      token.value = response.token
    }
    return response
  }

  function logout() {
    AuthService.logout()
    user.value = null
    token.value = null
  }

  async function changePassword(oldPassword: string, newPassword: string) {
    if (!user.value) {
      return { success: false, message: '未登录' }
    }
    return await AuthService.changePassword(user.value.userId, oldPassword, newPassword)
  }

  function checkRole(role: 'reader' | 'admin' | 'superadmin'): boolean {
    return AuthService.hasRole(role)
  }

  return {
    user,
    token,
    isAuthenticated,
    isReader,
    isAdmin,
    isSuperAdmin,
    login,
    logout,
    changePassword,
    checkRole
  }
})
