// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_Sqlite_init.sql';
import m0001 from './0001_far_alex_wilder.sql';
import m0002 from './0002_volatile_gamora.sql';
import m0003 from './0003_daffy_bromley.sql';
import m0004 from './0004_oval_human_fly.sql';
import m0005 from './0005_wandering_supernaut.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002,
m0003,
m0004,
m0005
    }
  }
  