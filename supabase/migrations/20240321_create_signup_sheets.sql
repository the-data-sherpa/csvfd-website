-- Create signup_sheets table
CREATE TABLE IF NOT EXISTS signup_sheets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    sign_up_by TIMESTAMP WITH TIME ZONE NOT NULL,
    point_of_contact UUID[] NOT NULL,
    allow_notes BOOLEAN DEFAULT true,
    allow_removal BOOLEAN DEFAULT true,
    display_slot_numbers BOOLEAN DEFAULT true,
    push_to_calendar BOOLEAN DEFAULT false,
    memo TEXT,
    groups JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT point_of_contact_check CHECK (array_length(point_of_contact, 1) > 0)
);

-- Create index for faster lookups
CREATE INDEX idx_signup_sheets_event_date ON signup_sheets(event_date);
CREATE INDEX idx_signup_sheets_sign_up_by ON signup_sheets(sign_up_by);

-- Create RLS policies
ALTER TABLE signup_sheets ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view sign-up sheets
CREATE POLICY "View sign-up sheets" ON signup_sheets
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to create sign-up sheets
CREATE POLICY "Create sign-up sheets" ON signup_sheets
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow all authenticated users to update sign-up sheets
CREATE POLICY "Update sign-up sheets" ON signup_sheets
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow creators and point of contacts to delete sign-up sheets
CREATE POLICY "Delete own sign-up sheets" ON signup_sheets
    FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by OR auth.uid() = ANY(point_of_contact));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_signup_sheets_updated_at
    BEFORE UPDATE ON signup_sheets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate point_of_contact users exist
CREATE OR REPLACE FUNCTION validate_point_of_contact()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM site_users 
        WHERE id = ANY(NEW.point_of_contact)
    ) THEN
        RAISE EXCEPTION 'All point of contact users must exist in site_users table';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to validate point_of_contact before insert/update
CREATE TRIGGER validate_point_of_contact_trigger
    BEFORE INSERT OR UPDATE ON signup_sheets
    FOR EACH ROW
    EXECUTE FUNCTION validate_point_of_contact(); 