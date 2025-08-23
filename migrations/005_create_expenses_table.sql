-- Migration: 005_create_expenses_table.sql
-- Create expenses table linked to persons

CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    person_id INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    frequency VARCHAR(50) NOT NULL, -- 'monthly', 'yearly', 'weekly', 'bi-weekly', 'one-time'
    category VARCHAR(100), -- 'housing', 'food', 'transportation', 'entertainment', etc.
    start_date DATE,
    end_date DATE, -- NULL for ongoing expenses
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_expenses_person_id ON expenses(person_id);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_dates ON expenses(start_date, end_date);
