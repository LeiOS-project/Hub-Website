<script setup lang="ts">
import { ref, computed } from 'vue'

interface RepositoryItem {
  id: string
  name: string
  type: 'file' | 'folder'
  path: string
  size?: number
  lastModified?: string
  description?: string
}

interface Props {
  items?: RepositoryItem[]
  loading?: boolean
  selectedPath?: string
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  loading: false,
  selectedPath: ''
})

const emit = defineEmits<{
  select: [item: RepositoryItem]
  navigate: [path: string]
}>()

const searchQuery = ref('')
const expandedFolders = ref<Set<string>>(new Set())

const filteredItems = computed(() => {
  if (!searchQuery.value) return props.items
  return props.items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const toggleFolder = (path: string) => {
  if (expandedFolders.value.has(path)) {
    expandedFolders.value.delete(path)
  } else {
    expandedFolders.value.add(path)
  }
}

const selectItem = (item: RepositoryItem) => {
  emit('select', item)
  if (item.type === 'folder') {
    toggleFolder(item.path)
    emit('navigate', item.path)
  }
}

const formatSize = (bytes?: number) => {
  if (!bytes) return '-'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`
}

const formatDate = (date?: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<template>
  <div class="repo-explorer">
    <!-- Search Bar -->
    <div class="search-section">
      <UInput
        v-model="searchQuery"
        type="text"
        placeholder="Repository durchsuchen..."
        icon="i-lucide-search"
        :ui="{ base: 'w-full' }"
      />
    </div>

    <!-- File Browser -->
    <div class="browser-container">
      <USkeleton v-if="loading" class="h-96" />

      <div v-else-if="filteredItems.length === 0" class="empty-state">
        <UIcon name="i-lucide-inbox" class="empty-icon" />
        <p class="empty-text">Keine Elemente gefunden</p>
      </div>

      <div v-else class="file-list">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="file-item"
          :class="{ 'selected': selectedPath === item.path }"
          @click="selectItem(item)"
        >
          <div class="item-header">
            <div class="item-info">
              <UIcon
                :name="item.type === 'folder' ? 'i-lucide-folder' : 'i-lucide-file'"
                class="item-icon"
              />
              <div class="item-details">
                <span class="item-name">{{ item.name }}</span>
                <span v-if="item.description" class="item-description">
                  {{ item.description }}
                </span>
              </div>
            </div>
            <div class="item-meta">
              <span class="meta-size">{{ formatSize(item.size) }}</span>
              <span class="meta-date">{{ formatDate(item.lastModified) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.repo-explorer {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
}

.search-section {
  padding: 0.5rem 0;
}

.browser-container {
  flex: 1;
  overflow-y: auto;
  border: 1px solid rgb(30 41 59);
  border-radius: 0.5rem;
  background-color: rgb(15 23 42);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: rgb(148 163 184);
}

.empty-icon {
  width: 3rem;
  height: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-text {
  font-size: 0.875rem;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.file-item {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgb(30 41 59);
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
}

.file-item:hover {
  background-color: rgb(30 41 59);
}

.file-item.selected {
  background-color: rgb(30 58 138);
  border-left: 3px solid rgb(59 130 246);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.item-icon {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  color: rgb(100 116 139);
}

.item-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.item-name {
  font-weight: 500;
  color: rgb(241 245 249);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-description {
  font-size: 0.75rem;
  color: rgb(100 116 139);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-meta {
  display: flex;
  gap: 2rem;
  font-size: 0.75rem;
  color: rgb(100 116 139);
  white-space: nowrap;
  flex-shrink: 0;
}

.meta-size,
.meta-date {
  font-family: 'Monaco', 'Menlo', monospace;
}

@media (max-width: 768px) {
  .item-meta {
    gap: 1rem;
  }

  .meta-size,
  .meta-date {
    font-size: 0.625rem;
  }
}
</style>
