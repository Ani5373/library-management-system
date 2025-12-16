<template>
  <div class="reservation-view">
    <h1>我的预约</h1>

    <el-card v-if="reservations.length === 0" class="empty-card">
      <el-empty description="暂无预约记录">
        <el-button type="primary" @click="$router.push('/reader/search')">去搜索图书</el-button>
      </el-empty>
    </el-card>

    <div v-else class="reservations-list">
      <el-card
        v-for="reservation in reservations"
        :key="reservation.reservationId"
        class="reservation-card"
        shadow="hover"
      >
        <div class="reservation-header">
          <h3>{{ reservation.publicationTitle }}</h3>
          <el-tag :type="getStatusType(reservation.status)">
            {{ getStatusName(reservation.status) }}
          </el-tag>
        </div>
        
        <el-descriptions :column="2" size="small" border>
          <el-descriptions-item label="作者">
            {{ reservation.author }}
          </el-descriptions-item>
          <el-descriptions-item label="出版社">
            {{ reservation.publisher }}
          </el-descriptions-item>
          <el-descriptions-item label="预约日期">
            {{ formatDate(reservation.reservationDate) }}
          </el-descriptions-item>
          <el-descriptions-item label="过期日期">
            {{ formatDate(reservation.expiryDate) }}
          </el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag :type="getPriorityType(reservation.priority)" size="small">
              第 {{ reservation.queuePosition }} 位
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态说明">
            {{ getStatusDescription(reservation.status) }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="reservation-actions">
          <el-button
            v-if="reservation.status === 'pending'"
            type="danger"
            size="small"
            @click="handleCancel(reservation)"
          >
            取消预约
          </el-button>
          <el-button
            v-if="reservation.status === 'ready'"
            type="success"
            size="small"
            @click="handleGoToBorrow(reservation)"
          >
            前往借阅
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Database, TABLES } from '@/services/database'
import { useAuthStore } from '@/stores/auth'
import type { Reservation, Reader, Publication } from '@/types/models'

const router = useRouter()
const authStore = useAuthStore()
const reservations = ref<any[]>([])

onMounted(() => {
  loadReservations()
})

const loadReservations = () => {
  if (!authStore.user) return
  
  // 获取当前读者信息
  const readers = Database.query<Reader>(
    TABLES.READERS,
    r => r.userId === authStore.user?.userId
  )
  
  if (readers.length === 0) return
  const reader = readers[0]
  
  // 获取读者的预约记录
  const allReservations = Database.query<Reservation>(
    TABLES.RESERVATIONS,
    r => r.readerId === reader.readerId
  )
  
  const publications = Database.getAll<Publication>(TABLES.PUBLICATIONS)
  
  reservations.value = allReservations.map(reservation => {
    const pub = publications.find(p => p.publicationId === reservation.publicationId)
    
    // 计算队列位置
    const samePublicationReservations = Database.query<Reservation>(
      TABLES.RESERVATIONS,
      r => r.publicationId === reservation.publicationId && r.status === 'pending'
    ).sort((a, b) => b.priority - a.priority)
    
    const queuePosition = samePublicationReservations.findIndex(
      r => r.reservationId === reservation.reservationId
    ) + 1
    
    return {
      ...reservation,
      publicationTitle: pub?.title || '未知',
      author: pub?.author || '未知',
      publisher: pub?.publisher || '未知',
      queuePosition
    }
  }).sort((a, b) => new Date(b.reservationDate).getTime() - new Date(a.reservationDate).getTime())
}

const handleCancel = async (reservation: any) => {
  try {
    await ElMessageBox.confirm('确定要取消这个预约吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    Database.update<Reservation>(TABLES.RESERVATIONS, 'reservationId', reservation.reservationId, {
      status: 'cancelled'
    })
    
    ElMessage.success('预约已取消')
    loadReservations()
  } catch {
    // 用户取消
  }
}

const handleGoToBorrow = (reservation: any) => {
  ElMessage.info('请前往图书馆柜台办理借阅')
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const getStatusType = (status: string) => {
  const types: Record<string, any> = {
    pending: 'warning',
    ready: 'success',
    cancelled: 'info',
    expired: 'danger'
  }
  return types[status] || 'info'
}

const getStatusName = (status: string) => {
  const names: Record<string, string> = {
    pending: '等待中',
    ready: '可借阅',
    cancelled: '已取消',
    expired: '已过期'
  }
  return names[status] || status
}

const getStatusDescription = (status: string) => {
  const descriptions: Record<string, string> = {
    pending: '图书归还后会按优先级通知您',
    ready: '图书已可借，请尽快前往借阅',
    cancelled: '预约已被取消',
    expired: '预约已过期，请重新预约'
  }
  return descriptions[status] || ''
}

const getPriorityType = (priority: number) => {
  if (priority >= 90) return 'success'
  if (priority >= 50) return 'warning'
  return 'info'
}
</script>

<style scoped>
.reservation-view {
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  font-size: 28px;
  margin-bottom: 24px;
  color: #333;
}

.empty-card {
  margin-top: 40px;
}

.reservations-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.reservation-card {
  transition: all 0.3s;
}

.reservation-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.reservation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.reservation-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.reservation-actions {
  margin-top: 16px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>
