import type { CatalogApp } from '../types';

export const CATALOG_APPS: CatalogApp[] = [
  {
    id: 'pipecraft',
    name: 'PipeCraft',
    repoUrl: 'https://github.com/LLAStudio/PipeCraft',
    repoOwner: 'LLAStudio',
    repoName: 'PipeCraft',
    apiReleasesUrl: 'https://api.github.com/repos/LLAStudio/PipeCraft/releases',
    category: 'Lime',
    language: 'TypeScript',
    description: 'Visual CI/CD pipeline editor for GitHub Actions.',
  },
  {
    id: 'lime-ai',
    name: 'Lime AI',
    repoUrl: 'https://github.com/LLAStudio/lime-ai',
    repoOwner: 'LLAStudio',
    repoName: 'lime-ai',
    apiReleasesUrl: 'https://api.github.com/repos/LLAStudio/lime-ai/releases',
    category: 'Lime',
    language: 'JavaScript',
    description:
      'Agent de code local avec aperçu live, 14 thèmes, menus déroulants thémés, MCP, vocal et mode PC/Cloud.',
  },
  {
    id: 'lemonport',
    name: 'LemonPort',
    repoUrl: 'https://github.com/LLAStudio/LemonPort',
    repoOwner: 'LLAStudio',
    repoName: 'LemonPort',
    apiReleasesUrl: 'https://api.github.com/repos/LLAStudio/LemonPort/releases',
    category: 'Lemon',
    language: 'Rust',
    description: 'Fast micro-utility for local port & network inspection.',
  },
  {
    id: 'lemonwatch',
    name: 'LemonWatch',
    repoUrl: 'https://github.com/LLAStudio/LemonWatch',
    repoOwner: 'LLAStudio',
    repoName: 'LemonWatch',
    apiReleasesUrl: 'https://api.github.com/repos/LLAStudio/LemonWatch/releases',
    category: 'Lemon',
    language: 'Rust',
    description: 'Lightweight real-time system & process watcher.',
  },
  {
    id: 'acidmade',
    name: 'AcidMade',
    repoUrl: 'https://github.com/LLAStudio/AcidMade',
    repoOwner: 'LLAStudio',
    repoName: 'AcidMade',
    apiReleasesUrl: 'https://api.github.com/repos/LLAStudio/AcidMade/releases',
    category: 'Acid',
    language: 'Core',
    description: 'Core visual toolkit, design system and utilities for LLAStudio.',
  },
];

export const GITHUB_ORG_URL = 'https://github.com/LLAStudio';
