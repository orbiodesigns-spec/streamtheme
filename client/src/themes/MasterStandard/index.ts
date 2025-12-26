import Layout from './Layout';
import Controls from './Controls';
import { ThemeModule } from '../types';

import { DEFAULT_THEME } from '../../lib/types';

import thumbnail from './assets/thumbnail.png';

const MasterStandard: ThemeModule = {
    id: 'master-standard',
    name: 'Master Standard',
    thumbnail,
    Layout,
    Controls,
    defaultConfig: DEFAULT_THEME
};

export default MasterStandard;
