-- Create database if it doesn't exist
IF DB_ID('ai_toolbox_db') IS NULL
BEGIN
    CREATE DATABASE ai_toolbox_db;
END
GO

USE ai_toolbox_db;
GO

-- Create initial tables here as needed
-- Example:
-- CREATE TABLE users (
--     id INT PRIMARY KEY IDENTITY(1,1),
--     name NVARCHAR(255) NOT NULL,
--     email NVARCHAR(255) UNIQUE NOT NULL,
--     created_at DATETIME DEFAULT GETDATE()
-- );
