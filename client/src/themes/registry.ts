import { ThemeModule } from './types';
import MasterStandard from './MasterStandard';
import PROCustom from './PROCustom';

export const themes: Record<string, ThemeModule> = {
    'master-standard': MasterStandard,
    'pro-custom': PROCustom,
};

console.log('Loading Theme Registry. Available:', Object.keys(themes));

export const defaultThemeId = 'master-standard';
