-- Migration: 008_create_scenarios_table.sql
-- Create scenarios table for financial modeling

CREATE TABLE scenarios (
    id SERIAL PRIMARY KEY,
    household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_scenarios_household_id ON scenarios(household_id);
CREATE INDEX idx_scenarios_dates ON scenarios(start_date, end_date);
