-- Phase 2: Migrate existing is_agent data to sender_type
-- This migration populates the sender_type column based on existing is_agent values

-- Step 1: Update existing messages based on is_agent field
UPDATE messages 
SET sender_type = CASE 
    WHEN is_agent = true THEN 'agent'::sender_type
    WHEN is_agent = false THEN 'customer'::sender_type
    ELSE 'customer'::sender_type -- Default fallback for any NULL values
END
WHERE sender_type IS NULL;

-- Step 2: Verify the migration
DO $$
DECLARE
    total_messages INTEGER;
    customer_messages INTEGER;
    agent_messages INTEGER;
    null_sender_type INTEGER;
BEGIN
    -- Get counts
    SELECT COUNT(*) INTO total_messages FROM messages;
    SELECT COUNT(*) INTO customer_messages FROM messages WHERE sender_type = 'customer';
    SELECT COUNT(*) INTO agent_messages FROM messages WHERE sender_type = 'agent';
    SELECT COUNT(*) INTO null_sender_type FROM messages WHERE sender_type IS NULL;
    
    -- Report results
    RAISE NOTICE 'Migration completed:';
    RAISE NOTICE 'Total messages: %', total_messages;
    RAISE NOTICE 'Customer messages: %', customer_messages;
    RAISE NOTICE 'Agent messages: %', agent_messages;
    RAISE NOTICE 'NULL sender_type (should be 0): %', null_sender_type;
    
    -- Verify no NULL values remain
    IF null_sender_type > 0 THEN
        RAISE EXCEPTION 'Migration failed: % messages still have NULL sender_type', null_sender_type;
    END IF;
END
$$;