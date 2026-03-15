-- Add phone column to users table (optional, for profile details).
-- Run this if your users table already exists and was created before phone was added to the model.
-- SQLite:   ALTER TABLE users ADD COLUMN phone VARCHAR;
-- PostgreSQL: ALTER TABLE users ADD COLUMN phone VARCHAR;

ALTER TABLE users ADD COLUMN phone VARCHAR;