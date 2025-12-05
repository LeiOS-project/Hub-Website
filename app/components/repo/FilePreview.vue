<script setup lang="ts">
interface FileStats {
    name: string
    type: 'file' | 'folder'
    size: number
    lines?: number
    language?: string
    lastModified: string
}

interface Props {
    file?: FileStats | null
    content?: string
    loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
    content: ''
})

const copyToClipboard = async () => {
    if (props.content) {
        await navigator.clipboard.writeText(props.content)
        // Toast-Benachrichtigung könnte hier hinzugefügt werden
    }
}

const downloadFile = () => {
    if (props.file && props.content) {
        const element = document.createElement('a')
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(props.content))
        element.setAttribute('download', props.file.name)
        element.style.display = 'none'
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
    }
}

const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024
        unitIndex++
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`
}

const getLanguageIcon = (language?: string) => {
    const iconMap: Record<string, string> = {
        'typescript': 'i-lucide-code-2',
        'javascript': 'i-lucide-code-2',
        'vue': 'i-lucide-code-2',
        'html': 'i-lucide-code-2',
        'css': 'i-lucide-code-2',
        'python': 'i-lucide-code-2',
    }
    return iconMap[language?.toLowerCase() || ''] || 'i-lucide-file'
}
</script>

<template>
    <div class="file-preview">
        <!-- File Info -->
        <div v-if="file" class="file-info">
            <div class="info-header">
                <div class="file-header">
                    <UIcon :name="getLanguageIcon(file.language)" class="file-type-icon" />
                    <div class="file-details">
                        <h3 class="file-name">{{ file.name }}</h3>
                        <p v-if="file.language" class="file-language">{{ file.language }}</p>
                    </div>
                </div>
                <div class="file-actions">
                    <UButton icon="i-lucide-copy" color="neutral" variant="ghost" size="sm" aria-label="Kopieren"
                        @click="copyToClipboard" />
                    <UButton v-if="file.type === 'file'" icon="i-lucide-download" color="neutral" variant="ghost"
                        size="sm" aria-label="Herunterladen" @click="downloadFile" />
                </div>
            </div>

            <div class="file-stats">
                <div class="stat">
                    <span class="stat-label">Größe:</span>
                    <span class="stat-value">{{ formatFileSize(file.size) }}</span>
                </div>
                <div v-if="file.lines" class="stat">
                    <span class="stat-label">Zeilen:</span>
                    <span class="stat-value">{{ file.lines }}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Zuletzt geändert:</span>
                    <span class="stat-value">{{ new Date(file.lastModified).toLocaleDateString('de-DE') }}</span>
                </div>
            </div>
        </div>

        <!-- Content -->
        <div class="content-container">
            <USkeleton v-if="loading" class="h-96" />

            <div v-else-if="!file" class="empty-state">
                <UIcon name="i-lucide-file-question" class="empty-icon" />
                <p class="empty-text">Wählen Sie eine Datei aus, um sie anzuzeigen</p>
            </div>

            <div v-else class="content-preview">
                <pre v-if="file.type === 'file'" class="code-block"><code>{{ content }}</code></pre>
                <div v-else class="folder-info">
                    <p>Dies ist ein Ordner</p>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.file-preview {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: 100%;
}

.file-info {
    padding: 1rem;
    background-color: rgb(15 23 42);
    border: 1px solid rgb(30 41 59);
    border-radius: 0.5rem;
}

.info-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
}

.file-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.file-type-icon {
    width: 1.5rem;
    height: 1.5rem;
    color: rgb(100 116 139);
}

.file-details {
    display: flex;
    flex-direction: column;
}

.file-name {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: rgb(241 245 249);
}

.file-language {
    margin: 0;
    font-size: 0.75rem;
    color: rgb(148 163 184);
}

.file-actions {
    display: flex;
    gap: 0.5rem;
}

.file-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
}

.stat {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
}

.stat-label {
    color: rgb(148 163 184);
}

.stat-value {
    color: rgb(241 245 249);
    font-weight: 500;
    font-family: 'Monaco', 'Menlo', monospace;
}

.content-container {
    flex: 1;
    overflow: hidden;
    border: 1px solid rgb(30 41 59);
    border-radius: 0.5rem;
    background-color: rgb(15 23 42);
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
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

.content-preview {
    height: 100%;
    overflow-y: auto;
}

.code-block {
    margin: 0;
    padding: 1rem;
    background-color: rgb(7 12 24);
    color: rgb(226 232 240);
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.875rem;
    line-height: 1.5;
    overflow-x: auto;
    border-radius: 0.5rem;
}

.folder-info {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: rgb(148 163 184);
}
</style>
