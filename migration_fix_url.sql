-- Migration script to fix URL length issue
-- Run this in your Supabase SQL Editor

ALTER TABLE cliente_proy 
ALTER COLUMN sharepoint_url TYPE TEXT;
