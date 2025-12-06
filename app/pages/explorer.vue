<script setup lang="ts">
import RepoExplorer from '~/components/repo/RepoExplorer.vue'
import FilePreview from '~/components/repo/FilePreview.vue'
import RepoStats from '~/components/repo/RepoStats.vue'
import type { NavigationMenuItem } from '@nuxt/ui'

useSeoMeta({
  title: 'Repository Explorer - LeiOS',
  ogTitle: 'Repository Explorer - LeiOS',
  description: 'Erkunden Sie das LeiOS Repository und sehen Sie alle Dateien, Branches und Statistiken.'
})

interface RepositoryItem {
  id: string
  name: string
  type: 'file' | 'folder'
  path: string
  size?: number
  lastModified?: string
  description?: string
}

interface FileStats {
  name: string
  type: 'file' | 'folder'
  size: number
  lines?: number
  language?: string
  lastModified: string
}

interface RepoStats {
  totalFiles: number
  totalSize: number
  languages: Record<string, number>
  branches: number
  contributors: number
  lastUpdate: string
}

const { $api } = useNuxtApp()
const selectedPath = ref<string>('')
const selectedItem = ref<RepositoryItem | null>(null)
const fileContent = ref<string>('')
const currentFile = ref<FileStats | null>(null)

const items = ref<RepositoryItem[]>([])
const repoStats = ref<RepoStats | null>(null)
const loading = ref(false)
const contentLoading = ref(false)

const tabs = ref<NavigationMenuItem[]>([
  { slot: 'explorer', label: 'Explorer' },
  { slot: 'stats', label: 'Statistiken' }
])

const activeTab = ref('explorer')

// Mock-Daten für Demo
const mockItems: RepositoryItem[] = [
  {
    id: '1',
    name: 'app',
    type: 'folder',
    path: '/app',
    description: 'Anwendungscode'
  },
  {
    id: '2',
    name: 'components',
    type: 'folder',
    path: '/components',
    description: 'Vue-Komponenten'
  },
  {
    id: '3',
    name: 'README.md',
    type: 'file',
    path: '/README.md',
    size: 5432,
    lastModified: new Date().toISOString(),
    description: 'Projektdokumentation'
  },
  {
    id: '4',
    name: 'package.json',
    type: 'file',
    path: '/package.json',
    size: 2048,
    lastModified: new Date().toISOString()
  },
  {
    id: '5',
    name: 'nuxt.config.ts',
    type: 'file',
    path: '/nuxt.config.ts',
    size: 1024,
    lastModified: new Date().toISOString()
  }
]

const mockStats: RepoStats = {
  totalFiles: 156,
  totalSize: 5242880,
  languages: {
    'TypeScript': 45,
    'Vue': 32,
    'CSS': 20,
    'HTML': 15,
    'JSON': 12,
    'Other': 32
  },
  branches: 8,
  contributors: 12,
  lastUpdate: new Date().toISOString()
}

// Daten laden
const loadRepository = async () => {
  loading.value = true
  try {
    // Mock-Daten verwenden
    items.value = mockItems
    repoStats.value = mockStats
  } catch (error) {
    console.error('Fehler beim Laden des Repositories:', error)
  } finally {
    loading.value = false
  }
}

// Dateiinhalt laden
const loadFileContent = async (item: RepositoryItem) => {
  if (item.type === 'folder') return

  contentLoading.value = true
  try {
    currentFile.value = {
      name: item.name,
      type: item.type,
      size: item.size || 0,
      lastModified: item.lastModified || new Date().toISOString(),
      language: item.name.endsWith('.ts') ? 'typescript' : 'text'
    }
    
    fileContent.value = `// ${item.name}\n// Dateiinhalt würde hier angezeigt\n// Dies ist nur ein Beispiel`
  } catch (error) {
    console.error('Fehler beim Laden der Datei:', error)
  } finally {
    contentLoading.value = false
  }
}

const selectItem = (item: RepositoryItem) => {
  selectedItem.value = item
  selectedPath.value = item.path
  if (item.type === 'file') {
    loadFileContent(item)
  }
}

onMounted(() => {
  loadRepository()
})
</script>

<template>
  <UContainer class="repo-explorer-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Repository Explorer</h1>
        <p class="page-description">
          Erkunden Sie das LeiOS-Repository und sehen Sie alle Dateien und Verzeichnisse
        </p>
      </div>
      <div class="header-actions">
        <UButton
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="ghost"
          @click="loadRepository"
          :disabled="loading"
        >
          Aktualisieren
        </UButton>
        <UButton
          icon="i-lucide-github"
          to="https://github.com/LeiOS-project"
          target="_blank"
          color="primary"
          variant="soft"
        >
          GitHub öffnen
        </UButton>
      </div>
    </div>

    <!-- Tabs -->
    <UTabs :items="tabs" :model-value="activeTab">
      <template #explorer>
        <div class="explorer-layout">
          <div class="explorer-sidebar">
            <RepoExplorer
              :items="items"
              :loading="loading"
              :selected-path="selectedPath"
              @select="selectItem"
              @navigate="(path) => selectedPath = path"
            />
          </div>

          <div class="explorer-content">
            <FilePreview
              :file="currentFile"
              :content="fileContent"
              :loading="contentLoading"
            />
          </div>
        </div>
      </template>

      <template #stats>
        <div class="stats-container">
          <RepoStats :stats="repoStats" :loading="loading" />
        </div>
      </template>
    </UTabs>
  </UContainer>
</template>

<style scoped>
.repo-explorer-page {
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

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.explorer-layout {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.explorer-sidebar {
  min-height: 600px;
}

.explorer-content {
  min-height: 600px;
}

.stats-container {
  margin-top: 1.5rem;
}

@media (max-width: 1024px) {
  .explorer-layout {
    grid-template-columns: 1fr;
  }

  .explorer-sidebar {
    min-height: 400px;
  }

  .page-header {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
