// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rgapawbntdczvujgdgmq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnYXBhd2JudGRjenZ1amdkZ21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MzYxMDMsImV4cCI6MjA4OTMxMjEwM30.9DiXMivbBbQczH_nSW6DKJwNd17U558CW3va6IckGV0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)