# LeiOS Repository Website - Implementierungsdetails

## Übersicht

Diese Website wurde als vollständige Anwendung zur Verwaltung und Erkundung des LeiOS-Repositories entwickelt. Sie integriert alle notwendigen Features für Entwickler und Administratoren.

## Implementierte Features

### 1. Repository Explorer
**Datei**: `app/pages/explorer.vue`
**Komponenten**: 
- `RepoExplorer.vue` - Datei-/Ordner-Browser
- `FilePreview.vue` - Dateivorschau
- `RepoStats.vue` - Repository-Statistiken

**Features**:
- Durchsuchen von Dateien und Ordnern mit Suchfunktion
- Dateiinhalt mit Syntax-Highlighting anzeigen
- Repository-Statistiken: Dateizahl, Größe, Programmiersprachen
- Download und Copy-to-Clipboard Funktionen
- Sortierung nach Größe und Änderungsdatum

**API-Integration**:
```typescript
const items = await useAPI(api => api.repository.list())
const file = await useAPI(api => api.repository.getFile(path))
const stats = await useAPI(api => api.repository.stats())
```

### 2. Admin Dashboard
**Datei**: `app/pages/dashboard/index.vue`
**Komponenten**:
- `UserManagement.vue` - Benutzer-Verwaltung
- `ReleaseManagement.vue` - Release-Verwaltung

**Features**:
- **Overview Tab**: Dashboard-Statistiken und letzte Aktivitäten
- **Users Tab**: Benutzer auflisten, Rollen ändern, löschen
- **Releases Tab**: Releases erstellen, bearbeiten, veröffentlichen

**Benutzer-Management**:
- Benutzer nach Rolle filtern (Admin, Moderator, Contributor)
- Benutzer suchen nach Name oder E-Mail
- Rollen erhöhen/ändern
- Benutzer löschen mit Bestätigung

**Release-Management**:
- Releases mit Tags und Versionen verwalten
- Draft vs. Published Status
- Assets-Management (Download-Links)
- Download-Statistiken anzeigen
- Releases veröffentlichen

### 3. Authentifizierung & Autorisierung
**Middleware**: `app/middleware/auth.global.ts`

**Funktionsweise**:
- Cookie-basierte Session-Token Verwaltung
- Automatische Umleitung zu Login für nicht-authentifizierte Benutzer
- Schutz von Admin-Seiten (`/dashboard`)
- Role-basierte Zugriffskontrolle

**Code-Beispiel**:
```typescript
const sessionToken = useCookie('session_token')
if (!sessionToken.value && to.path.startsWith('/dashboard')) {
  return navigateTo(`/auth/login?redirect=${encodeURIComponent(to.fullPath)}`)
}
```

### 4. Layout System

**Dashboard Layout** (`app/layouts/dashboard.vue`):
- RepoHeader-Navigation mit Links zu Explorer und Dashboard
- Responsive Design
- Footer mit Projekt-Links

**Standard Layout** (`app/layouts/default.vue`):
- Für öffentliche Seiten
- Standard Navigation und Footer

### 5. API Integration

**useAPI Composable** (`app/composables/useAPI.ts`):
- Zentrale API-Interaktions-Logik
- Server-seitige Anfragen mit Session-Token
- Fehlerbehandlung und Response-Parsing
- Client-seitige Auth-Umleitung

**useRepository** (`app/composables/useRepository.ts`):
- Repository-spezifische Funktionen
- `listItems()`, `getFile()`, `getStats()`, `search()`

**useAdmin** (`app/composables/useAdmin.ts`):
- Admin-spezifische Funktionen
- Benutzer- und Release-Management
- CRUD-Operationen

### 6. UI-Komponenten

#### Repository Components

**RepoExplorer.vue**:
- Props: `items`, `loading`, `selectedPath`
- Events: `select`, `navigate`
- Features: Suche, Dateitype Icons, Größe/Datum-Anzeige

**FilePreview.vue**:
- Props: `file`, `content`, `loading`
- Features: Syntax-Highlighting, Copy, Download
- Unterstützt sowohl Dateien als auch Ordner

**RepoStats.vue**:
- Props: `stats`, `loading`
- Features: Stat-Cards, Sprachen-Verteilung, letzte Aktualisierung

#### Dashboard Components

**UserManagement.vue**:
- Filterbares User-Table
- Role-basierte Färbung
- Action-Buttons für Edit, Promote, Delete

**ReleaseManagement.vue**:
- Release-Cards mit Status
- Asset-Listen mit Download-Links
- Publish/Edit/Delete Funktionen
- Download-Statistiken

### 7. Styling & Design

**Farbschema** (Aurora):
- Primär: `rgb(59 130 246)` (Blau)
- Sekundär: `rgb(205 74 230)` (Lila)
- Dunkelgrau/Schwarz: `rgb(2 6 23)` - `rgb(30 41 59)`
- Hellgrau: `rgb(148 163 184)` - `rgb(241 245 249)`

**CSS-Techniken**:
- Tailwind CSS mit Dark Mode
- Custom CSS Variables
- Gradient-Effekte
- Responsive Design mit Mobile-First Approach
- Hover-Effects und Übergänge

### 8. Utility Functions

```typescript
// Format-Funktionen
formatFileSize(bytes)    // "2.50 MB"
formatDate(date)         // "5. Dez. 2024"
formatDateTime(date)     // "5. Dez. 2024, 14:30"

// Icon/Language-Funktionen
getLanguageIcon(filename)      // "i-lucide-code"
getLanguageFromExt(filename)   // "TypeScript"

// Hilfsfunktionen
truncate(text, length)         // Text mit Ellipsis
copyToClipboard(text)          // In Zwischenablage kopieren
hasAdminAccess(role)           // Admin-Check
hasModeratorAccess(role)       // Moderator+ Check
getGitHubFileUrl(path)         // GitHub-URL generieren
```

## Dateistruktur

```
l:\Coding\LeiOS\Repo\Website\
├── app/
│   ├── assets/css/main.css
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── ReleaseManagement.vue
│   │   │   └── UserManagement.vue
│   │   ├── layout/
│   │   │   └── RepoHeader.vue
│   │   └── repo/
│   │       ├── FilePreview.vue
│   │       ├── RepoExplorer.vue
│   │       └── RepoStats.vue
│   ├── composables/
│   │   ├── useAdmin.ts
│   │   ├── useAPI.ts
│   │   ├── useRepository.ts
│   │   └── updateAPIClient.ts
│   ├── layouts/
│   │   ├── dashboard.vue
│   │   └── default.vue
│   ├── middleware/
│   │   ├── auth.global.ts
│   │   └── rewrites.global.ts
│   ├── pages/
│   │   ├── index.vue
│   │   ├── explorer.vue
│   │   └── dashboard/
│   │       └── index.vue
│   └── utils/
│       └── index.ts
├── nuxt.config.ts
├── package.json
├── tsconfig.json
├── openapi-ts.config.ts
├── example.env
└── README.md
```

## SEO-Optimierung

Alle Seiten haben optimierte Meta-Tags:
- `title` - Seitentitel für Browser-Tab
- `ogTitle` - Open Graph Titel für Social Media
- `description` - Meta-Beschreibung für Suchmaschinen

## Performance-Optimierungen

- Lazy Loading von Komponenten
- Skeleton Loading während Daten geladen werden
- Optimierte Icon-Verwendung (Lucide)
- CSS-in-JS für scoped Styles
- Nuxt Auto-Imports

## Responsives Design

- Mobile-First Approach
- Breakpoints bei 768px und 1024px
- Flexible Grids mit `auto-fit`
- Touch-freundliche UI-Elemente

## Sicherheit

- Session-basierte Authentifizierung
- Cookie-basierte Token-Speicherung
- HTTPS-ready (in Production)
- CORS-Konfiguration (via Backend)
- Input-Validation in Komponenten

## Testing-Vorbereitung

Die Komponenten sind gut strukturiert für Unit-Tests:
- Props und Events klar definiert
- Reusable Composables
- Keine globalen State-Abhängigkeiten

## Nächste Schritte

1. **Backend-Integration**: API-Endpoints anpassen
2. **OpenAPI-Client**: `bun run api-client:generate` ausführen
3. **Environment-Variablen**: `.env` Datei konfigurieren
4. **Authentication**: Login-Seite und Session-Management implementieren
5. **Tests**: Unit und Integration Tests schreiben
6. **Deployment**: Docker/Bun-basiertes Deployment einrichten

## Verwendete Technologien

- **Nuxt 4**: Vue 3 Meta-Framework
- **Tailwind CSS**: Utility-First CSS Framework
- **@nuxt/ui**: Vue 3 UI-Komponenten-Bibliothek
- **TypeScript**: Typsichere JavaScript-Entwicklung
- **Lucide Icons**: SVG-Icons
- **Zod**: TypeScript-first Schema Validation
- **Bun**: Schneller JavaScript Runtime & Package Manager
