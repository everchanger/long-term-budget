-- Migration: 006_create_savings_accounts_table.sql
-- Create savings accounts table linked to persons

CREATE TABLE savings_accounts (
    id SERIAL PRIMARY KEY,
    person_id INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    account_type VARCHAR(100), -- 'checking', 'savings', 'investment', 'retirement', etc.
    current_balance DECIMAL(12, 2) DEFAULT 0,
    interest_rate DECIMAL(5, 4), -- Annual interest rate as decimal (e.g., 0.0250 for 2.5%)
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_savings_accounts_person_id ON savings_accounts(person_id);
CREATE INDEX idx_savings_accounts_type ON savings_accounts(account_type);
