CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS conversions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_url TEXT NOT NULL,
    video_title TEXT,
    video_thumbnail TEXT,
    video_duration INTEGER,
    format VARCHAR(10) NOT NULL DEFAULT 'mp3',
    quality VARCHAR(10) NOT NULL DEFAULT '192',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    file_path TEXT,
    file_size BIGINT,
    error_message TEXT,
    client_ip VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_conversions_status ON conversions(status);
CREATE INDEX idx_conversions_client_ip ON conversions(client_ip);
CREATE INDEX idx_conversions_created_at ON conversions(created_at DESC);
