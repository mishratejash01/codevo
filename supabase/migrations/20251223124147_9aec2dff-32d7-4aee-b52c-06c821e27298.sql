-- Add method_signature column to practice_problems for proper driver code generation
ALTER TABLE public.practice_problems 
ADD COLUMN IF NOT EXISTS method_signature jsonb DEFAULT NULL;

-- Add comment explaining the structure
COMMENT ON COLUMN public.practice_problems.method_signature IS 'Method signature for driver code generation. Format: { "name": "twoSum", "params": [{"name": "nums", "type": "int[]"}, {"name": "target", "type": "int"}], "returnType": "int[]" }';