-- Migration: 007_create_loans_table.sql
-- Create loans table linked to persons

CREATE TABLE loans (
    id SERIAL PRIMARY KEY,
    person_id INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    loan_type VARCHAR(100), -- 'car', 'house', 'student', 'personal', etc.
    principal_amount DECIMAL(12, 2) NOT NULL,
    current_balance DECIMAL(12, 2) NOT NULL,
    interest_rate DECIMAL(5, 4) NOT NULL, -- Annual interest rate as decimal
    monthly_payment DECIMAL(12, 2),
    start_date DATE NOT NULL,
    expected_payoff_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_loans_person_id ON loans(person_id);
CREATE INDEX idx_loans_type ON loans(loan_type);
CREATE INDEX idx_loans_dates ON loans(start_date, expected_payoff_date);
