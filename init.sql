CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE realms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id TEXT NOT NULL,
    name TEXT NOT NULL,
    map_data JSONB DEFAULT '{"spawnpoint":{"roomIndex":0,"x":0,"y":0},"rooms":[]}'::jsonb,
    share_id UUID DEFAULT uuid_generate_v4(),
    only_owner BOOLEAN DEFAULT false
);

CREATE TABLE profiles (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL DEFAULT 'Anonymous',
    skin TEXT DEFAULT '009',
    visited_realms TEXT[] DEFAULT '{}'
);
