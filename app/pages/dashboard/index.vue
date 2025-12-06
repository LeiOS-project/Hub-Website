<script setup lang="ts">
import UserManagement from '~/components/dashboard/UserManagement.vue'
import ReleaseManagement from '~/components/dashboard/ReleaseManagement.vue'
import type { NavigationMenuItem } from '@nuxt/ui'

useSeoMeta({
  title: 'Admin Dashboard - LeiOS Repo',
  ogTitle: 'Admin Dashboard - LeiOS Repo',
  description: 'Verwalten Sie das LeiOS-Repository, Benutzer und Releases.'
})

interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'moderator' | 'contributor'
  createdAt: string
  lastActive: string
}

interface Release {
  id: string
  version: string
  tagName: string
  name: string
  description: string
  author: string
  createdAt: string
  published: boolean
  downloadCount?: number
  assets: ReleaseAsset[]
}

interface ReleaseAsset {
  id: string
  name: string
  size: number
  downloadUrl: string
}

const users = ref<User[]>([])
const releases = ref<Release[]>([])
const loading = ref(false)

const tabs = ref<NavigationMenuItem[]>([
  { slot: 'overview', label: 'Übersicht' },
  { slot: 'users', label: 'Benutzer' },
  { slot: 'releases', label: 'Releases' }
])

const activeTab = ref('overview')

// Stats für Overview
const stats = ref<Record<string, number>>({
  totalUsers: 0,
  activeAdmins: 0,
  totalReleases: 0,
  recentUploads: 0
})

// Mock-Daten für Demo
const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@leios.dev',
    role: 'admin',
    createdAt: new Date(2024, 0, 15).toISOString(),
    lastActive: new Date().toISOString()
  },
  {
    id: '2',
    username: 'moderator1',
    email: 'mod@leios.dev',
    role: 'moderator',
    createdAt: new Date(2024, 1, 20).toISOString(),
    lastActive: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: '3',
    username: 'contributor1',
    email: 'contrib@leios.dev',
    role: 'contributor',
    createdAt: new Date(2024, 2, 10).toISOString(),
    lastActive: new Date(Date.now() - 86400000).toISOString()
  }
]

const mockReleases: Release[] = [
  {
    id: '1',
    version: '1.0.0',
    tagName: 'v1.0.0',
    name: 'LeiOS 1.0.0 - Initial Release',
    description: 'Das erste stabile Release von LeiOS mit vollständiger Funktionalität.',
    author: 'LeiOS Team',
    createdAt: new Date(2024, 11, 1).toISOString(),
    published: true,
    downloadCount: 5432,
    assets: [
      { id: '1', name: 'leios-1.0.0.iso', size: 2147483648, downloadUrl: '#' },
      { id: '2', name: 'leios-1.0.0-checksum.txt', size: 256, downloadUrl: '#' }
    ]
  },
  {
    id: '2',
    version: '1.1.0-beta',
    tagName: 'v1.1.0-beta',
    name: 'LeiOS 1.1.0 Beta',
    description: 'Beta-Version mit neuen Features und Verbesserungen.',
    author: 'LeiOS Team',
    createdAt: new Date(2024, 11, 5).toISOString(),
    published: false,
    assets: []
  }
]

// Daten laden
const loadDashboardData = async () => {
  loading.value = true
  try {
    // Mock-Daten verwenden
    users.value = mockUsers
    releases.value = mockReleases
    
    // Stats aktualisieren
    stats.value = {
      totalUsers: mockUsers.length,
      activeAdmins: mockUsers.filter(u => u.role === 'admin').length,
      totalReleases: mockReleases.length,
      recentUploads: mockReleases.filter(r => 
        new Date(r.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
      ).length
    }
  } catch (error) {
    console.error('Fehler beim Laden der Dashboard-Daten:', error)
  } finally {
    loading.value = false
  }
}

// User-Aktionen
const handleEditUser = (user: User) => {
  // Modal oder Navigation zum Bearbeitungsformular
}

const handleDeleteUser = async (userId: string) => {
  // Bestätigung und Löschung
  if (confirm('Sind Sie sicher, dass Sie diesen Benutzer löschen möchten?')) {
    try {
      users.value = users.value.filter(u => u.id !== userId)
    } catch (error) {
      console.error('Fehler beim Löschen des Benutzers:', error)
    }
  }
}

const handlePromoteUser = async (userId: string) => {
  // Benutzer-Rolle erhöhen
}

// Release-Aktionen
const handleEditRelease = (release: Release) => {
  // Modal oder Navigation zum Bearbeitungsformular
}

const handleDeleteRelease = async (releaseId: string) => {
  if (confirm('Sind Sie sicher, dass Sie dieses Release löschen möchten?')) {
    try {
      releases.value = releases.value.filter(r => r.id !== releaseId)
    } catch (error) {
      console.error('Fehler beim Löschen des Releases:', error)
    }
  }
}

const handlePublishRelease = async (releaseId: string) => {
  try {
    const release = releases.value.find(r => r.id === releaseId)
    if (release) {
      release.published = true
    }
  } catch (error) {
    console.error('Fehler beim Veröffentlichen des Releases:', error)
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<template>
  <UContainer class="admin-dashboard-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Admin Dashboard</h1>
        <p class="page-description">
          Verwalten Sie Benutzer, Releases und Repository-Inhalte
        </p>
      </div>
      <UButton
        icon="i-lucide-refresh-cw"
        color="neutral"
        variant="ghost"
        @click="loadDashboardData"
        :disabled="loading"
      >
        Aktualisieren
      </UButton>
    </div>

    <!-- Overview Stats -->
    <div class="stats-overview">
      <div class="stat-card">
        <div class="stat-header">
          <UIcon name="i-lucide-users" class="stat-icon" />
          <span>Benutzer</span>
        </div>
        <div class="stat-value">{{ stats.totalUsers }}</div>
        <p class="stat-meta">{{ stats.activeAdmins }} Admin(s)</p>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <UIcon name="i-lucide-package" class="stat-icon" />
          <span>Releases</span>
        </div>
        <div class="stat-value">{{ stats.totalReleases }}</div>
        <p class="stat-meta">{{ stats.recentUploads }} diese Woche</p>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <UIcon name="i-lucide-activity" class="stat-icon" />
          <span>Status</span>
        </div>
        <div class="stat-value status-online">Online</div>
        <p class="stat-meta">Alle Systeme normal</p>
      </div>
    </div>

    <!-- Tabs -->
    <UTabs :items="tabs" :model-value="activeTab">
      <template #overview>
        <div class="overview-section">
          <div class="overview-grid">
            <!-- Letzten Aktivitäten -->
            <div class="overview-card">
              <h3 class="card-title">Letzte Aktivitäten</h3>
              <div class="activities-list">
                <div v-for="i in 5" :key="i" class="activity-item">
                  <UIcon name="i-lucide-user" class="activity-icon" />
                  <div class="activity-content">
                    <p class="activity-title">Benutzer aktiviert</p>
                    <span class="activity-time">vor {{ i }} Stunden</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="overview-card">
              <h3 class="card-title">Quick Actions</h3>
              <div class="actions-grid">
                <UButton
                  icon="i-lucide-user-plus"
                  color="primary"
                  variant="soft"
                  block
                >
                  Benutzer hinzufügen
                </UButton>
                <UButton
                  icon="i-lucide-package-plus"
                  color="success"
                  variant="soft"
                  block
                >
                  Release erstellen
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #users>
        <div class="users-section">
          <UserManagement
            :users="users"
            :loading="loading"
            @edit="handleEditUser"
            @delete="handleDeleteUser"
            @promote="handlePromoteUser"
          />
        </div>
      </template>

      <template #releases>
        <div class="releases-section">
          <div class="section-header">
            <h3 class="section-title">Release Management</h3>
            <UButton
              icon="i-lucide-plus"
              color="primary"
              variant="soft"
            >
              Neues Release
            </UButton>
          </div>
          <ReleaseManagement
            :releases="releases"
            :loading="loading"
            @edit="handleEditRelease"
            @delete="handleDeleteRelease"
            @publish="handlePublishRelease"
          />
        </div>
      </template>
    </UTabs>
  </UContainer>
</template>

<style scoped>
.admin-dashboard-page {
  padding: 2rem 1rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 2rem;
  flex-wrap: wrap;
}

.header-content {
  flex: 1;
}

.page-title {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 700;
  color: rgb(241 245 249);
}

.page-description {
  margin: 0;
  color: rgb(148 163 184);
  font-size: 0.875rem;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  padding: 1.5rem;
  background: linear-gradient(135deg, rgb(30 41 59) 0%, rgb(15 23 42) 100%);
  border: 1px solid rgb(30 41 59);
  border-radius: 0.5rem;
  transition: border-color 0.2s;
}

.stat-card:hover {
  border-color: rgb(59 130 246);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: rgb(148 163 184);
}

.stat-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: rgb(59 130 246);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: rgb(241 245 249);
  margin-bottom: 0.5rem;
}

.stat-value.status-online {
  color: rgb(34 197 94);
  font-size: 1.125rem;
}

.stat-meta {
  margin: 0;
  font-size: 0.75rem;
  color: rgb(100 116 139);
}

.overview-section {
  margin-top: 1.5rem;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.overview-card {
  padding: 1.5rem;
  background: linear-gradient(135deg, rgb(30 41 59) 0%, rgb(15 23 42) 100%);
  border: 1px solid rgb(30 41 59);
  border-radius: 0.5rem;
}

.card-title {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: rgb(241 245 249);
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.activity-item {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgb(30 41 59);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: rgb(59 130 246);
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.activity-content {
  flex: 1;
}

.activity-title {
  margin: 0;
  font-size: 0.875rem;
  color: rgb(241 245 249);
}

.activity-time {
  display: block;
  font-size: 0.75rem;
  color: rgb(100 116 139);
}

.actions-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

.users-section,
.releases-section {
  margin-top: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.section-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(241 245 249);
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }

  .stats-overview {
    grid-template-columns: 1fr;
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }
}
</style>
