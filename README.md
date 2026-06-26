# Astro Blog Editor (mdexed)

A custom, high-performance web-based Markdown/MDX editor built with React and Vite. It is designed specifically as an external writing tool and local CMS for an Astro-based blog, featuring an elegant Slate & Teal dark theme.

## Features

- **Local Filesystem Bridge**: Read and write files directly to your hard drive (`src/content/blog/`) via a custom Vite API plugin.
- **Folder-per-Post Architecture**: Automatically organizes each new post into its own isolated directory (`slug/slug.md`).
- **Dynamic Local Images**: Drag-and-drop or reference local images (`![alt](./image.png)`), and the editor will recursively search the filesystem and render them in the Live Preview.
- **Astro Frontmatter Validation**: Uses Zod to ensure metadata (Title, Date, Read Time, Summary, Tags) strictly adheres to the blog's `config.ts` content collection schema.
- **Live Typographic Fidelity**: The preview pane perfectly mimics the production Astro site's typography, including a scroll-triggered progress bar, scrollspy Table of Contents, and custom code block styling.
- **Multi-File Memory Workspace**: Open multiple files simultaneously using the integrated File Explorer sidebar without losing unsaved changes.

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v18 or higher)

### Installation
1. Clone the repository and install dependencies:
```bash
npm install
```

2. Start the development server (which also powers the local file system API):
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`.

### Workflow
1. Click the `+` icon in the **Explorer** to create a new post, or click the **Upload** icon to import an existing `.md` file.
2. Edit the Metadata settings in the sidebar. The UI will automatically generate a URL-friendly slug based on your title.
3. Write your markdown. Local images placed alongside the file will render automatically.
4. Click **Save to Disk**. Your post will be written locally to `src/content/blog/<slug>/<slug>.md`.

## Technology Stack
- **Framework**: React 18 + Vite
- **Styling**: Vanilla CSS with custom CSS variables (Slate/Teal aesthetic)
- **Editor**: `@monaco-editor/react`
- **Markdown Processing**: `react-markdown`, `remark-gfm`
- **Validation**: `zod`
- **Icons**: `lucide-react`
