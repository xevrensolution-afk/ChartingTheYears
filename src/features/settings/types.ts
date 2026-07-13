export interface SiteSettings {
  siteName: string;
  tagline: string;
  adminEmail: string;
  defaultLanguage: string;
  defaultEra: string;
  booksPerPage: number;
  mapStyle: string;
  displayTheme: 'system' | 'light' | 'dark';
  fontFamily: string;
  fontScale: number;
  density: number;
}

export type SettingsStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface SettingsState {
  settings: SiteSettings;
  status: SettingsStatus;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: 'Charting the Years',
  tagline: 'Interactive atlas of historical literature',
  adminEmail: '',
  defaultLanguage: 'English',
  defaultEra: 'All',
  booksPerPage: 20,
  mapStyle: 'Parchment',
  displayTheme: 'system',
  fontFamily: '',
  fontScale: 1,
  density: 1,
};
