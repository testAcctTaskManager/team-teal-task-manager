PRAGMA foreign_keys = OFF;
ALTER TABLE User_Providers ADD COLUMN provider_user_id TEXT;
PRAGMA foreign_keys = ON;