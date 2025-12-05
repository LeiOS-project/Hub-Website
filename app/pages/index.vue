<script setup lang="ts">
useSeoMeta({
  title: 'LeiOS Repository Hub',
  ogTitle: 'LeiOS Repository Hub',
  description: 'Das zentrale Portal für das LeiOS-Repository mit Entwickler-Tools, Release-Management und Community-Support.'
})

const features = [
  {
    icon: 'i-lucide-code-2',
    title: 'Repository Explorer',
    description: 'Durchsuchen Sie alle Dateien und Verzeichnisse des LeiOS-Projekts mit einer intuitiven Benutzeroberfläche'
  },
  {
    icon: 'i-lucide-users',
    title: 'Benutzer Management',
    description: 'Verwalten Sie Benutzer und deren Rollen im Repository'
  },
  {
    icon: 'i-lucide-package',
    title: 'Release Management',
    description: 'Erstellen, bearbeiten und veröffentlichen Sie Releases mit Assets'
  },
  {
    icon: 'i-lucide-bar-chart-2',
    title: 'Statistiken & Analytics',
    description: 'Überwachen Sie Repository-Statistiken und Sprachen-Verteilung'
  },
  {
    icon: 'i-lucide-git-branch',
    title: 'Branch Management',
    description: 'Verwalten Sie Branches und Merge-Requests'
  },
  {
    icon: 'i-lucide-shield',
    title: 'Zugriffskontrolle',
    description: 'Rolle-basierte Zugriffskontrolle für Sicherheit und Verwaltung'
  }
]

const stats = [
  { label: 'Dateien', value: '156+' },
  { label: 'Mitwirkende', value: '12+' },
  { label: 'Branches', value: '8+' },
  { label: 'Releases', value: '5+' }
]
</script>

<template>
  <div class="repo-home">
    <!-- Hero Section -->
    <section class="hero">
      <UContainer>
        <div class="hero-content">
          <h1 class="hero-title">LeiOS Repository Hub</h1>
          <p class="hero-subtitle">
            Erkunden Sie das LeiOS-Projekt, verwalten Sie Releases und arbeiten Sie mit dem Team zusammen
          </p>
          <div class="hero-actions">
            <UButton
              size="lg"
              to="/explorer"
              color="primary"
              variant="soft"
              icon="i-lucide-code-2"
            >
              Repository erkunden
            </UButton>
            <UButton
              size="lg"
              to="/dashboard"
              color="neutral"
              variant="ghost"
              icon="i-lucide-layout-dashboard"
            >
              Zum Dashboard
            </UButton>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- Stats Section -->
    <section class="stats-section">
      <UContainer>
        <div class="stats-grid">
          <div v-for="stat in stats" :key="stat.label" class="stat-box">
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- Features Section -->
    <section class="features">
      <UContainer>
        <div class="section-header">
          <h2 class="section-title">Features</h2>
          <p class="section-description">
            Alles was Sie zur Verwaltung des LeiOS-Repositories brauchen
          </p>
        </div>
        <div class="features-grid">
          <div v-for="feature in features" :key="feature.title" class="feature-card">
            <div class="feature-icon">
              <UIcon :name="feature.icon" />
            </div>
            <h3 class="feature-title">{{ feature.title }}</h3>
            <p class="feature-description">{{ feature.description }}</p>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- CTA Section -->
    <section class="cta">
      <UContainer>
        <div class="cta-content">
          <h2 class="cta-title">Bereit zu beginnen?</h2>
          <p class="cta-description">
            Melden Sie sich an und erkunden Sie alle Features des LeiOS Repository Hubs
          </p>
          <UButton
            size="lg"
            to="/explorer"
            color="primary"
            variant="soft"
            icon="i-lucide-arrow-right"
          >
            Jetzt beginnen
          </UButton>
        </div>
      </UContainer>
    </section>
  </div>
</template>

<style scoped>
.repo-home {
  background-color: rgb(2 6 23);
  color: rgb(241 245 249);
}

/* Hero Section */
.hero {
  padding: 4rem 1rem;
  background: linear-gradient(
    135deg,
    rgb(15 23 42) 0%,
    rgb(2 6 23) 100%
  );
  border-bottom: 1px solid rgb(30 41 59);
  position: relative;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgb(59 130 246) 0%, transparent 70%);
  opacity: 0.1;
  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  margin: 0 0 1rem 0;
  background: linear-gradient(
    135deg,
    rgb(241 245 249) 0%,
    rgb(148 163 184) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.125rem;
  color: rgb(148 163 184);
  margin: 0 0 2rem 0;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Stats Section */
.stats-section {
  padding: 3rem 1rem;
  background-color: rgb(15 23 42);
  border-bottom: 1px solid rgb(30 41 59);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
}

.stat-box {
  text-align: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgb(30 41 59) 0%, rgb(15 23 42) 100%);
  border: 1px solid rgb(30 41 59);
  border-radius: 0.5rem;
  transition: border-color 0.2s;
}

.stat-box:hover {
  border-color: rgb(59 130 246);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: rgb(59 130 246);
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: rgb(148 163 184);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Features Section */
.features {
  padding: 4rem 1rem;
  background-color: rgb(2 6 23);
}

.section-header {
  text-align: center;
  margin-bottom: 3rem;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  color: rgb(241 245 249);
}

.section-description {
  font-size: 1rem;
  color: rgb(148 163 184);
  margin: 0;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.feature-card {
  padding: 2rem;
  background: linear-gradient(135deg, rgb(30 41 59) 0%, rgb(15 23 42) 100%);
  border: 1px solid rgb(30 41 59);
  border-radius: 0.5rem;
  transition: all 0.2s;
  text-align: center;
}

.feature-card:hover {
  border-color: rgb(59 130 246);
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(59, 130, 246, 0.1);
}

.feature-icon {
  width: 3rem;
  height: 3rem;
  margin: 0 auto 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgb(59 130 246);
  border-radius: 0.5rem;
  color: white;
}

.feature-icon :deep(svg) {
  width: 1.5rem;
  height: 1.5rem;
}

.feature-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  color: rgb(241 245 249);
}

.feature-description {
  font-size: 0.875rem;
  color: rgb(148 163 184);
  margin: 0;
  line-height: 1.6;
}

/* CTA Section */
.cta {
  padding: 4rem 1rem;
  background: linear-gradient(
    135deg,
    rgb(30 41 59) 0%,
    rgb(15 23 42) 100%
  );
  border-top: 1px solid rgb(30 41 59);
  text-align: center;
}

.cta-content {
  max-width: 600px;
  margin: 0 auto;
}

.cta-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  color: rgb(241 245 249);
}

.cta-description {
  font-size: 1rem;
  color: rgb(148 163 184);
  margin: 0 0 2rem 0;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .cta-title {
    font-size: 1.5rem;
  }
}
</style>