-- Create database if it doesn't exist
IF DB_ID('ai_toolbox_db') IS NULL
BEGIN
    CREATE DATABASE ai_toolbox_db;
END
GO

USE ai_toolbox_db;
GO

-- Create users table
CREATE TABLE users (
    oid NVARCHAR(36) PRIMARY KEY,  -- Azure AD Object ID
    name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) UNIQUE NOT NULL,
    preferred_username NVARCHAR(255),
    tenant_id NVARCHAR(36),
    roles NVARCHAR(MAX),  -- JSON array of roles
    claims NVARCHAR(MAX), -- JSON object of all claims
    first_login DATETIME2 DEFAULT GETDATE(),
    last_login DATETIME2 DEFAULT GETDATE(),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_last_login ON users(last_login);

GO