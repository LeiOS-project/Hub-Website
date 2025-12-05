<script setup lang="ts">
interface RepoStats {
  totalFiles: number
  totalSize: number
  languages: Record<string, number>
  branches: number
  contributors: number
  lastUpdate: string
}

interface Props {
  stats?: RepoStats | null
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  loading: false
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

const getLanguageColor = (language: string) => {
  const colors: Record<string, string> = {
    'TypeScript': 'rgb(59 130 246)',
    'Vue': 'rgb(34 197 94)',
    'JavaScript': 'rgb(250 204 21)',
    'CSS': 'rgb(168 85 247)',
    'HTML': 'rgb(249 115 22)',
    'Python': 'rgb(59 130 246)',
    'Other': 'rgb(100 116 139)'
  }
  return colors[language] || colors['Other']
}
</script>

<template>
  <div class="repo-stats">
    <USkeleton v-if="loading" class="h-96" />

    <div v-else-if="!stats" class="empty-state">
      <UIcon name="i-lucide-chart-no-data" class="empty-icon" />
      <p class="empty-text">Keine Statistiken verfügbar</p>
    </div>

    <div v-else class="stats-grid">
      <!-- Overview Stats -->
      <div class="stats-overview">
        <div class="stat-card">
          <div class="stat-header">
            <UIcon name="i-lucide-file-text" class="stat-icon" />
            <span class="stat-label">Dateien</span>
          </div>
          <div class="stat-value">{{ stats.totalFiles }}</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <UIcon name="i-lucide-database" class="stat-icon" />
            <span class="stat-label">Größe</span>
          </div>
          <div class="stat-value">{{ formatSize(stats.totalSize) }}</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <UIcon name="i-lucide-git-branch" class="stat-icon" />
            <span class="stat-label">Branches</span>
          </div>
          <div class="stat-value">{{ stats.branches }}</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <UIcon name="i-lucide-users" class="stat-icon" />
            <span class="stat-label">Mitwirkende</span>
          </div>
          <div class="stat-value">{{ stats.contributors }}</div>
        </div>
      </div>

      <!-- Language Distribution -->
      <div class="languages-section">
        <h4 class="section-title">Sprachen</h4>
        <div class="languages-list">
          <div
            v-for="(count, language) in stats.languages"
            :key="language"
            class="language-item"
          >
            <div class="language-info">
              <div
                class="language-indicator"
                :style="{ backgroundColor: getLanguageColor(language) }"
              />
              <span class="language-name">{{ language }}</span>
            </div>
            <span class="language-count">{{ count }} Dateien</span>
          </div>
        </div>
      </div>

      <!-- Last Updated -->
      <div class="last-updated">
        <span class="label">Zuletzt aktualisiert:</span>
        <span class="value">{{ new Date(stats.lastUpdate).toLocaleDateString('de-DE', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.repo-stats {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  padding: 1rem;
  background: linear-gradient(135deg, rgb(30 41 59) 0%, rgb(15 23 42) 100%);
  border: 1px solid rgb(30 41 59);
  border-radius: 0.5rem;
  transition: border-color 0.2s, background 0.2s;
}

.stat-card:hover {
  border-color: rgb(59 130 246);
  background: linear-gradient(135deg, rgb(30 58 138) 0%, rgb(15 23 42) 100%);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.stat-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: rgb(59 130 246);
}

.stat-label {
  font-size: 0.875rem;
  color: rgb(148 163 184);
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: rgb(241 245 249);
  font-family: 'Monaco', 'Menlo', monospace;
}

.languages-section {
  padding: 1rem;
  background: linear-gradient(135deg, rgb(30 41 59) 0%, rgb(15 23 42) 100%);
  border: 1px solid rgb(30 41 59);
  border-radius: 0.5rem;
}

.section-title {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(241 245 249);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.languages-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.language-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgb(30 41 59);
}

.language-item:last-child {
  border-bottom: none;
}

.language-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.language-indicator {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
}

.language-name {
  font-size: 0.875rem;
  color: rgb(241 245 249);
}

.language-count {
  font-size: 0.75rem;
  color: rgb(148 163 184);
  font-family: 'Monaco', 'Menlo', monospace;
}

.last-updated {
  padding: 0.75rem 1rem;
  background-color: rgb(15 23 42);
  border: 1px solid rgb(30 41 59);
  border-radius: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.label {
  color: rgb(148 163 184);
}

.value {
  color: rgb(241 245 249);
  font-weight: 500;
  font-family: 'Monaco', 'Menlo', monospace;
}

@media (max-width: 768px) {
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-value {
    font-size: 1.5rem;
  }
}
</style>
