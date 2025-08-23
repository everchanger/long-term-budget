-- Migration: 004_create_income_sources_table.sql
-- Create income sources table linked to persons

CREATE TABLE income_sources (
    id SERIAL PRIMARY KEY,
    person_id INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    frequency VARCHAR(50) NOT NULL, -- 'monthly', 'yearly', 'weekly', 'bi-weekly'
    start_date DATE,
    end_date DATE, -- NULL for ongoing income
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_income_sources_person_id ON income_sources(person_id);
CREATE INDEX idx_income_sources_dates ON income_sources(start_date, end_date);
