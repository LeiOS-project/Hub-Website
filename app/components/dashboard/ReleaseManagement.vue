<script setup lang="ts">
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

interface Props {
  releases?: Release[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  releases: () => [],
  loading: false
})

const emit = defineEmits<{
  edit: [release: Release]
  delete: [releaseId: string]
  publish: [releaseId: string]
}>()

const searchQuery = ref('')
const showUnpublished = ref(true)

const filteredReleases = computed(() => {
  let filtered = props.releases || []

  if (!showUnpublished.value) {
    filtered = filtered.filter(r => r.published)
  }

  if (searchQuery.value) {
    filtered = filtered.filter(r =>
      r.version.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      r.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  return filtered.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
})

const formatSize = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<template>
  <div class="release-management">
    <!-- Filters -->
    <div class="filters">
      <UInput
        v-model="searchQuery"
        type="text"
        placeholder="Release durchsuchen..."
        icon="i-lucide-search"
      />
      <UCheckbox v-model="showUnpublished" label="Unveröffentlichte zeigen" />
    </div>

    <!-- Releases List -->
    <div class="releases-container">
      <USkeleton v-if="loading" class="h-96" />

      <div v-else-if="filteredReleases.length === 0" class="empty-state">
        <UIcon name="i-lucide-package-x" class="empty-icon" />
        <p class="empty-text">Keine Releases gefunden</p>
      </div>

      <div v-else class="releases-list">
        <div
          v-for="release in filteredReleases"
          :key="release.id"
          class="release-card"
        >
          <!-- Release Header -->
          <div class="release-header">
            <div class="release-info">
              <div class="version-badge">
                <span class="version">{{ release.version }}</span>
              </div>
              <div class="release-details">
                <h4 class="release-name">{{ release.name }}</h4>
                <p class="release-meta">
                  von {{ release.author }} · {{ formatDate(release.createdAt) }}
                </p>
              </div>
            </div>
            <div class="release-actions">
              <UBadge
                v-if="!release.published"
                color="warning"
                variant="subtle"
              >
                Entwurf
              </UBadge>
              <UButton
                v-if="!release.published"
                size="sm"
                color="success"
                variant="soft"
                icon="i-lucide-upload"
                @click="emit('publish', release.id)"
              >
                Veröffentlichen
              </UButton>
              <UButton
                size="sm"
                color="neutral"
                variant="ghost"
                icon="i-lucide-edit"
                @click="emit('edit', release)"
              />
              <UButton
                size="sm"
                color="error"
                variant="ghost"
                icon="i-lucide-trash-2"
                @click="emit('delete', release.id)"
              />
            </div>
          </div>

          <!-- Release Description -->
          <div class="release-description">
            {{ release.description }}
          </div>

          <!-- Assets -->
          <div v-if="release.assets.length > 0" class="release-assets">
            <h5 class="assets-title">Assets</h5>
            <div class="assets-list">
              <a
                v-for="asset in release.assets"
                :key="asset.id"
                :href="asset.downloadUrl"
                class="asset-item"
              >
                <UIcon name="i-lucide-download" class="asset-icon" />
                <div class="asset-info">
                  <span class="asset-name">{{ asset.name }}</span>
                  <span class="asset-size">{{ formatSize(asset.size) }}</span>
                </div>
                <UIcon name="i-lucide-external-link" class="link-icon" />
              </a>
            </div>
          </div>

          <!-- Stats -->
          <div v-if="release.downloadCount" class="release-stats">
            <span class="stat-item">
              <UIcon name="i-lucide-download" />
              {{ release.downloadCount }} Downloads
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.release-management {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filters {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.filters input {
  flex: 1;
  min-width: 200px;
}

.releases-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.releases-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.release-card {
  padding: 1.25rem;
  background: linear-gradient(135deg, rgb(30 41 59) 0%, rgb(15 23 42) 100%);
  border: 1px solid rgb(30 41 59);
  border-radius: 0.5rem;
  transition: border-color 0.2s;
}

.release-card:hover {
  border-color: rgb(59 130 246);
}

.release-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.release-info {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex: 1;
}

.version-badge {
  padding: 0.5rem 0.75rem;
  background-color: rgb(59 130 246);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  font-family: 'Monaco', 'Menlo', monospace;
  flex-shrink: 0;
}

.version {
  white-space: nowrap;
}

.release-details {
  flex: 1;
}

.release-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: rgb(241 245 249);
}

.release-meta {
  margin: 0.25rem 0 0 0;
  font-size: 0.75rem;
  color: rgb(148 163 184);
}

.release-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.release-description {
  margin: 1rem 0;
  color: rgb(226 232 240);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.release-assets {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgb(30 41 59);
}

.assets-title {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(241 245 249);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.assets-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.asset-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background-color: rgb(7 12 24);
  border-radius: 0.375rem;
  color: rgb(226 232 240);
  text-decoration: none;
  transition: background-color 0.2s;
}

.asset-item:hover {
  background-color: rgb(15 23 42);
  color: rgb(59 130 246);
}

.asset-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.asset-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.asset-name {
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.asset-size {
  font-size: 0.75rem;
  color: rgb(148 163 184);
  font-family: 'Monaco', 'Menlo', monospace;
}

.link-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  opacity: 0.5;
}

.release-stats {
  display: flex;
  gap: 1.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgb(30 41 59);
  font-size: 0.875rem;
  color: rgb(148 163 184);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-item :deep(svg) {
  width: 1rem;
  height: 1rem;
}
</style>
