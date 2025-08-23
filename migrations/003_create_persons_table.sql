-- Migration: 003_create_persons_table.sql
-- Create persons table for household members (financial entities)

CREATE TABLE persons (
    id SERIAL PRIMARY KEY,
    household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    birth_date DATE,
    role VARCHAR(100), -- e.g., 'spouse', 'child', 'self', etc.
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_persons_household_id ON persons(household_id);
