import { ThemeModule } from './types';
import MasterStandard from './MasterStandard';

export const themes: Record<string, ThemeModule> = {
    'master-standard': MasterStandard,
};

console.log('Loading Theme Registry. Available:', Object.keys(themes));

export const defaultThemeId = 'master-standard';
