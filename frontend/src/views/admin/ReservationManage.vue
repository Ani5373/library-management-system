<template>
  <div class="reservation-manage">
    <div class="page-header">
      <h2>预约管理</h2>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-box">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">总预约数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-box">
            <div class="stat-value" style="color: #e6a23c">{{ stats.pending }}</div>
            <div class="stat-label">待处理</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-box">
            <div class="stat-value" style="color: #67c23a">{{ stats.ready }}</div>
            <div class="stat-label">可借阅</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-box">
            <div class="stat-value" style="color: #909399">{{ stats.cancelled }}</div>
            <div class="stat-label">已取消</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="读者姓名">
          <el-input v-model="searchForm.readerName" placeholder="请输入读者姓名" clearable />
        </el-form-item>
        <el-form-item label="出版物标题">
          <el-input v-model="searchForm.publicationTitle" placeholder="请输入出版物标题" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="全部" value="" />
            <el-option label="待处理" value="pending" />
            <el-option label="可借阅" value="ready" />
            <el-option label="已取消" value="cancelled" />
            <el-option label="已过期" value="expired" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 预约记录列表 -->
    <el-card class="table-card">
      <el-table :data="filteredReservations" stripe style="width: 100%">
        <el-table-column prop="readerName" label="读者" width="120" />
        <el-table-column prop="publicationTitle" label="出版物" width="200" />
        <el-table-column prop="reservationDate" label="预约日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.reservationDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="expiryDate" label="过期日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.expiryDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)">
              {{ row.priority }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'pending'"
              type="success"
              size="small"
              @click="handleNotify(row)"
            >
              通知可借
            </el-button>
            <el-button
              v-if="row.status === 'pending' || row.status === 'ready'"
              type="danger"
              size="small"
              @click="handleCancel(row)"
            >
              取消预约
            </el-button>
            <el-button
              v-if="row.status === 'ready'"
              type="primary"
              size="small"
              @click="handleBorrow(row)"
            >
              办理借阅
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Database, TABLES } from '@/services/database'
import { CryptoUtils } from '@/utils/crypto'
import type { Reservation, Reader, User, Publication, BorrowRecord, Notification } from '@/types/models'

const reservations = ref<any[]>([])
const readers = ref<Array<Reader & User>>([])
const publications = ref<Publication[]>([])

const stats = ref({
  total: 0,
  pending: 0,
  ready: 0,
  cancelled: 0
})

const searchForm = reactive({
  readerName: '',
  publicationTitle: '',
  status: ''
})

const filteredReservations = computed(() => {
  let result = reservations.value
  if (searchForm.readerName) {
    result = result.filter(r => r.readerName.includes(searchForm.readerName))
  }
  if (searchForm.publicationTitle) {
    result = result.filter(r => r.publicationTitle.includes(searchForm.publicationTitle))
  }
  if (searchForm.status) {
    result = result.filter(r => r.status === searchForm.status)
  }
  return result
})

onMounted(() => {
  loadData()
})

const loadData = () => {
  loadReservations()
  loadReaders()
  loadPublications()
  calculateStats()
}

const loadReservations = () => {
  const allReservations = Database.getAll<Reservation>(TABLES.RESERVATIONS)
  const allReaders = Database.getAll<Reader>(TABLES.READERS)
  const allUsers = Database.getAll<User>(TABLES.USERS)
  const allPublications = Database.getAll<Publication>(TABLES.PUBLICATIONS)
  
  reservations.value = allReservations.map(reservation => {
    const reader = allReaders.find(r => r.readerId === reservation.readerId)
    const user = allUsers.find(u => u.userId === reader?.userId)
    const pub = allPublications.find(p => p.publicationId === reservation.publicationId)
    
    // 检查是否过期
    let status = reservation.status
    if (status === 'pending' && new Date(reservation.expiryDate) < new Date()) {
      status = 'expired'
      Database.update<Reservation>(TABLES.RESERVATIONS, 'reservationId', reservation.reservationId, {
        status: 'expired'
      })
    }
    
    return {
      ...reservation,
      status,
      readerName: user?.name || '未知',
      publicationTitle: pub?.title || '未知'
    }
  }).sort((a, b) => b.priority - a.priority) // 按优先级排序
}

const loadReaders = () => {
  const allReaders = Database.getAll<Reader>(TABLES.READERS)
  const allUsers = Database.getAll<User>(TABLES.USERS)
  
  readers.value = allReaders.map(reader => {
    const user = allUsers.find(u => u.userId === reader.userId)
    return { ...reader, ...user } as Reader & User
  })
}

const loadPublications = () => {
  publications.value = Database.getAll<Publication>(TABLES.PUBLICATIONS)
}

const calculateStats = () => {
  const allReservations = Database.getAll<Reservation>(TABLES.RESERVATIONS)
  stats.value.total = allReservations.length
  stats.value.pending = allReservations.filter(r => r.status === 'pending').length
  stats.value.ready = allReservations.filter(r => r.status === 'ready').length
  stats.value.cancelled = allReservations.filter(r => r.status === 'cancelled').length
}

const handleSearch = () => {
  // 搜索已通过 computed 实现
}

const handleReset = () => {
  searchForm.readerName = ''
  searchForm.publicationTitle = ''
  searchForm.status = ''
}

const handleNotify = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要通知读者该出版物可借吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    
    // 更新预约状态
    Database.update<Reservation>(TABLES.RESERVATIONS, 'reservationId', row.reservationId, {
      status: 'ready'
    })
    
    // 创建通知
    const notification: Notification = {
      notificationId: CryptoUtils.generateId('notif'),
      userId: readers.value.find(r => r.readerId === row.readerId)?.userId || '',
      type: 'reservation_ready',
      title: '预约到书通知',
      content: `您预约的《${row.publicationTitle}》已可借阅，请尽快前来借阅`,
      sendDate: new Date().toISOString(),
      isRead: false
    }
    Database.insert(TABLES.NOTIFICATIONS, notification)
    
    ElMessage.success('已通知读者')
    loadData()
  } catch {
    // 用户取消
  }
}

const handleCancel = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要取消这个预约吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    Database.update<Reservation>(TABLES.RESERVATIONS, 'reservationId', row.reservationId, {
      status: 'cancelled'
    })
    
    // 通知下一位预约者
    const nextReservation = reservations.value
      .filter(r => 
        r.publicationId === row.publicationId && 
        r.status === 'pending' &&
        r.reservationId !== row.reservationId
      )
      .sort((a, b) => b.priority - a.priority)[0]
    
    if (nextReservation) {
      handleNotify(nextReservation)
    }
    
    ElMessage.success('预约已取消')
    loadData()
  } catch {
    // 用户取消
  }
}

const handleBorrow = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要为该读者办理借阅吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    
    const reader = readers.value.find(r => r.readerId === row.readerId)
    const publication = publications.value.find(p => p.publicationId === row.publicationId)
    
    if (!reader || !publication) {
      ElMessage.error('数据错误')
      return
    }
    
    // 检查借阅资格
    if (reader.borrowedCount >= reader.borrowLimit) {
      ElMessage.error('读者已达借阅上限')
      return
    }
    
    if (publication.availableCopies <= 0) {
      ElMessage.error('该出版物暂无可借')
      return
    }
    
    // 创建借阅记录
    const borrowDate = new Date()
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + publication.borrowPeriod)
    
    const borrowRecord: BorrowRecord = {
      recordId: CryptoUtils.generateId('borrow'),
      readerId: row.readerId,
      publicationId: row.publicationId,
      borrowDate: borrowDate.toISOString(),
      dueDate: dueDate.toISOString(),
      returnDate: null,
      status: 'borrowed',
      renewalCount: 0,
      maxRenewals: 2
    }
    
    Database.insert(TABLES.BORROW_RECORDS, borrowRecord)
    
    // 更新出版物可借数量
    Database.update<Publication>(TABLES.PUBLICATIONS, 'publicationId', row.publicationId, {
      availableCopies: publication.availableCopies - 1
    })
    
    // 更新读者借阅数量
    Database.update<Reader>(TABLES.READERS, 'readerId', row.readerId, {
      borrowedCount: reader.borrowedCount + 1
    })
    
    // 删除预约记录
    Database.delete(TABLES.RESERVATIONS, 'reservationId', row.reservationId)
    
    ElMessage.success('借阅办理成功')
    loadData()
  } catch {
    // 用户取消
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const getPriorityType = (priority: number) => {
  if (priority >= 90) return 'danger'
  if (priority >= 50) return 'warning'
  return 'info'
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
    pending: '待处理',
    ready: '可借阅',
    cancelled: '已取消',
    expired: '已过期'
  }
  return names[status] || status
}
</script>

<style scoped>
.reservation-manage {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-box {
  text-align: center;
  padding: 10px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #999;
}

.search-card {
  margin-bottom: 20px;
}

.table-card {
  border-radius: 8px;
}
</style>
