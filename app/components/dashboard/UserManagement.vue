<script setup lang="ts">
interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'moderator' | 'contributor'
  createdAt: string
  lastActive: string
}

interface Props {
  users?: User[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  users: () => [],
  loading: false
})

const emit = defineEmits<{
  edit: [user: User]
  delete: [userId: string]
  promote: [userId: string]
}>()

const searchQuery = ref('')
const selectedRole = ref<'all' | 'admin' | 'moderator' | 'contributor'>('all')

const filteredUsers = computed(() => {
  let filtered = props.users || []

  if (selectedRole.value !== 'all') {
    filtered = filtered.filter(u => u.role === selectedRole.value)
  }

  if (searchQuery.value) {
    filtered = filtered.filter(u =>
      u.username.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  return filtered
})

const getRoleColor = (role: string): "neutral" | "primary" | "secondary" | "success" | "info" | "warning" | "error" => {
  const colors: Record<string, "neutral" | "primary" | "secondary" | "success" | "info" | "warning" | "error"> = {
    'admin': 'error',
    'moderator': 'info',
    'contributor': 'success'
  }
  return colors[role] || 'neutral'
}

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    'admin': 'Administrator',
    'moderator': 'Moderator',
    'contributor': 'Beiträger'
  }
  return labels[role] || role
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="user-management">
    <!-- Filters -->
    <div class="filters">
      <UInput
        v-model="searchQuery"
        type="text"
        placeholder="Benutzer suchen..."
        icon="i-lucide-search"
      />
      <USelectMenu
        v-model="selectedRole"
        :options="[
          { value: 'all', label: 'Alle Rollen' },
          { value: 'admin', label: 'Administrator' },
          { value: 'moderator', label: 'Moderator' },
          { value: 'contributor', label: 'Beiträger' }
        ]"
        option-attribute="label"
        value-attribute="value"
      />
    </div>

    <!-- Users Table -->
    <div class="table-container">
      <USkeleton v-if="loading" class="h-96" />

      <div v-else-if="filteredUsers.length === 0" class="empty-state">
        <UIcon name="i-lucide-users-x" class="empty-icon" />
        <p class="empty-text">Keine Benutzer gefunden</p>
      </div>

      <UTable
        v-else
        :rows="filteredUsers"
      >
        <template #username-header>
          <span>Benutzername</span>
        </template>
        <template #username-data="{ row }">
          <span>{{ (row as any).username }}</span>
        </template>

        <template #email-header>
          <span>E-Mail</span>
        </template>
        <template #email-data="{ row }">
          <span>{{ (row as any).email }}</span>
        </template>

        <template #role-header>
          <span>Rolle</span>
        </template>
        <template #role-data="{ row }">
          <UBadge :color="getRoleColor((row as any).role)" variant="subtle">
            {{ getRoleLabel((row as any).role) }}
          </UBadge>
        </template>

        <template #createdAt-header>
          <span>Erstellt</span>
        </template>
        <template #createdAt-data="{ row }">
          <span class="date-text">{{ formatDate((row as any).createdAt) }}</span>
        </template>

        <template #lastActive-header>
          <span>Zuletzt aktiv</span>
        </template>
        <template #lastActive-data="{ row }">
          <span class="date-text">{{ formatDate((row as any).lastActive) }}</span>
        </template>

        <template #expand="{ row }">
          <div class="expand-actions">
            <UButton
              size="sm"
              color="neutral"
              variant="ghost"
              icon="i-lucide-edit"
              @click="emit('edit', row as any)"
            />
            <UButton
              size="sm"
              color="primary"
              variant="ghost"
              icon="i-lucide-arrow-up"
              title="Befördern"
              @click="emit('promote', (row as any).id)"
            />
            <UButton
              size="sm"
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              @click="emit('delete', (row as any).id)"
            />
          </div>
        </template>
      </UTable>
    </div>
  </div>
</template>

<style scoped>
.user-management {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filters input,
.filters :deep(.u-select-menu) {
  flex: 1;
  min-width: 200px;
}

.table-container {
  border: 1px solid rgb(30 41 59);
  border-radius: 0.5rem;
  overflow: hidden;
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

.date-text {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.875rem;
  color: rgb(148 163 184);
}

.expand-actions {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
}

:deep(.u-table) {
  background-color: rgb(15 23 42);
  border-collapse: collapse;
}

:deep(.u-table tr:hover) {
  background-color: rgb(30 41 59);
}

:deep(.u-table th) {
  background-color: rgb(30 41 59);
  font-weight: 600;
  color: rgb(241 245 249);
  padding: 0.75rem 1rem;
}

:deep(.u-table td) {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgb(30 41 59);
  color: rgb(226 232 240);
}
</style>
