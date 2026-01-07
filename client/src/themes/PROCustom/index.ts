import Layout from './Layout';
import Controls from './Controls';
import { ThemeModule } from '../types';

import { DEFAULT_THEME } from '../../lib/types';

import thumbnail from './assets/thumbnail.png';

const PRO_DEFAULT_THEME = {
    ...DEFAULT_THEME,
    // Black / Dark (Replaces Blue)
    bluePrimary: '#27272a', // Zinc 800
    blueSecondary: '#000000', // Black
    // Red (Replaces Purple)
    purplePrimary: '#ef4444', // Red 500
    purpleSecondary: '#991b1b', // Red 800

    ringColor: '#ef4444',
    accentColor: '#d4d4d8', // Light Grey

    // Match Midstrips to new palette
    midStrip1Start: '#27272a',
    midStrip1End: '#000000',
    midStrip2Start: '#ef4444',
    midStrip2End: '#991b1b',
    midStrip4Start: '#27272a',
    midStrip4End: '#000000',

    // Bottom Bar
    bottomBar1Start: '#ef4444',
    bottomBar1End: '#991b1b',
    bottomBar2Start: '#27272a',
    bottomBar2End: '#000000',
};

const PROCustom: ThemeModule = {
    id: 'pro-custom',
    name: 'PRO Custom',
    thumbnail,
    Layout,
    Controls,
    defaultConfig: PRO_DEFAULT_THEME
};

export default PROCustom;
