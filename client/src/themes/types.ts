import React from 'react';
import { ThemeConfig } from '../lib/types';

export interface ThemeModule {
    id: string;
    name: string;
    thumbnail?: string;
    // The main overlay component (1920x1080)
    Layout: React.ComponentType<{ theme: ThemeConfig }>;
    // The sidebar controls component
    Controls: React.ComponentType<{ theme: ThemeConfig, setTheme: (t: ThemeConfig) => void }>;
    // Default configuration values
    defaultConfig: ThemeConfig;
}
