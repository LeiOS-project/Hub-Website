# LeiOS Repository Hub

Das zentrale Portal für das LeiOS-Repository mit Entwickler-Tools, Release-Management und Community-Support.

## Features

- 🔍 **Repository Explorer** - Durchsuchen Sie alle Dateien und Verzeichnisse mit intuitiver Benutzeroberfläche
- 👥 **Benutzer Management** - Verwalten Sie Benutzer und deren Rollen im Repository
- 📦 **Release Management** - Erstellen, bearbeiten und veröffentlichen Sie Releases mit Assets
- 📊 **Statistiken & Analytics** - Überwachen Sie Repository-Statistiken und Sprachen-Verteilung
- 🔐 **Zugriffskontrolle** - Rolle-basierte Zugriffskontrolle für Sicherheit und Verwaltung
- 🎨 **Dark Theme** - Modernes Design mit dunklem Theme basierend auf Aurora-Farbpalette

## Tech Stack

- **Framework**: Nuxt 4
- **UI**: @nuxt/ui
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Icons**: Lucide Icons
- **Runtime**: Bun

## Setup

### Abhängigkeiten installieren:

```bash
bun install
```

### Environment-Variablen

Kopieren Sie die `example.env` in `.env`:

```bash
cp example.env .env
```

## Entwicklung

Starten Sie den Entwicklungsserver auf `http://localhost:12155`:

```bash
bun run dev
```

## Production

### Build

```bash
bun run build
```

### Starten

```bash
bun start
```

## Projekt-Struktur

```
app/
├── api-client/           # Generierte API-Client-Code
├── assets/
│   └── css/
│       └── main.css      # Globale Styles
├── components/
│   ├── dashboard/        # Admin-Dashboard Komponenten
│   ├── layout/           # Layout-Komponenten
│   └── repo/             # Repository-Komponenten
├── composables/
│   ├── useAPI.ts         # API-Interaktions-Composable
│   ├── useAdmin.ts       # Admin-API Composable
│   └── useRepository.ts  # Repository-API Composable
├── layouts/
│   ├── dashboard.vue     # Dashboard-Layout
│   └── default.vue       # Standard-Layout
├── middleware/
│   ├── auth.global.ts    # Authentifizierungs-Middleware
│   └── rewrites.global.ts
├── pages/
│   ├── index.vue         # Startseite
│   ├── explorer.vue      # Repository-Explorer
│   └── dashboard/
│       └── index.vue     # Admin-Dashboard
└── utils/
    └── index.ts          # Utility-Funktionen
```

## Seiten

### 🏠 Startseite (`/`)
- Hero-Section mit Features
- Statistiken-Übersicht
- Call-to-Action Buttons

### 🔍 Repository Explorer (`/explorer`)
- Datei- und Ordner-Browser
- Dateivorschau mit Syntax-Highlighting
- Repository-Statistiken
- Suche und Navigation

### 📊 Admin Dashboard (`/dashboard`)
- **Übersicht**: Quick Stats und letzte Aktivitäten
- **Benutzer-Management**: Benutzer verwalten und Rollen ändern
- **Release-Management**: Releases erstellen, bearbeiten und veröffentlichen

## Komponenten

### Repository-Komponenten

#### `RepoExplorer.vue`
Datei- und Ordner-Browser für das Repository
- Props: `items`, `loading`, `selectedPath`
- Events: `select`, `navigate`

#### `FilePreview.vue`
Vorschau und Download von Dateien
- Props: `file`, `content`, `loading`
- Syntax-Highlighting für Code-Dateien

#### `RepoStats.vue`
Statistiken und Metriken des Repositories
- Props: `stats`, `loading`
- Zeigt Sprachen-Verteilung und Metriken

### Dashboard-Komponenten

#### `UserManagement.vue`
Verwaltung von Repository-Benutzern
- Props: `users`, `loading`
- Events: `edit`, `delete`, `promote`

#### `ReleaseManagement.vue`
Verwaltung von Releases und Assets
- Props: `releases`, `loading`
- Events: `edit`, `delete`, `publish`

## Composables

### `useAPI`
Zentrale API-Interaktions-Composable mit Authentifizierung
- Server-seitige Anfragen mit Session-Token
- Client-seitige Authentifizierungs-Umleitung
- Fehlerbehandlung

```typescript
const data = await useAPI(api => api.repository.list())
```

### `useRepository`
Repository-spezifische API-Funktionen
- `listItems(path)` - Repository-Elemente abrufen
- `getFile(path)` - Dateiinhalt abrufen
- `getStats()` - Statistiken abrufen
- `search(query)` - Suche durchführen

### `useAdmin`
Admin-spezifische API-Funktionen
- Benutzer-Management
- Release-Management
- Statistiken und Analysen

## Authentifizierung

Das System verwendet Cookie-basierte Authentifizierung:
- Session-Token wird im Cookie gespeichert
- Middleware überprüft Authentifizierung für geschützte Seiten
- Rolle-basierte Zugriffskontrolle für Admin-Features

## Styling

### Farbpalette (Aurora)
- Primär: `rgb(59 130 246)` (Blau)
- Sekundär: `rgb(205 74 230)` (Lila)
- Hintergrund: `rgb(2 6 23)` (Dunkelblau)
- Flächen: `rgb(15 23 42)` (Dunkelblau-Grau)
- Text: `rgb(241 245 249)` (Hell)

### CSS-Variablen
```css
--surface-1: #05070d
--surface-2: #0b0f1c
--surface-3: #11182b
--surface-border: rgba(255, 255, 255, 0.08)
--text-primary: #f5f7ff
--text-muted: #9aa6c4
```

## API-Integration

Die App verwendet einen generierten API-Client basierend auf OpenAPI-Spezifikation:

```bash
bun run api-client:generate
```

Dieser Befehl generiert die Dateien in `app/api-client/`.

## Utility-Funktionen

- `formatFileSize(bytes)` - Formatiert Dateigröße
- `formatDate(date)` - Formatiert Datum
- `formatDateTime(date)` - Formatiert Datum und Zeit
- `getLanguageIcon(filename)` - Icon basierend auf Dateityp
- `getLanguageFromExt(filename)` - Programmiersprache erkennen
- `copyToClipboard(text)` - Text in Zwischenablage kopieren
- `hasAdminAccess(role)` - Admin-Zugriff prüfen

## Entwickler-Tipps

### SEO Meta Tags
Alle Seiten sollten `useSeoMeta` verwenden:
```typescript
useSeoMeta({
  title: 'Seiten-Titel',
  ogTitle: 'Open Graph Titel',
  description: 'Seiten-Beschreibung'
})
```

### Page Metadata
Nutzen Sie `definePageMeta` für Layout-Definition:
```typescript
definePageMeta({
  layout: 'dashboard'
})
```

### Icons
Icons von Lucide sind verfügbar:
```vue
<UIcon name="i-lucide-code" />
```

## Lizenz

GPL License - siehe LICENSE Datei für Details

## Support

- 📧 Email: support@leios.dev
- 💬 Discord: https://discord.gg/8YC5BXjCc5
- 🐙 GitHub: https://github.com/LeiOS-project
