-- ============================================================
-- 01_create_database.sql
-- Creates HealthCareDB if it does not already exist.
-- Run as: sqlcmd -S localhost\sqlexpress -E -i 01_create_database.sql
-- ============================================================
USE master;
GO

IF NOT EXISTS (
    SELECT name FROM sys.databases WHERE name = N'HealthCareDB'
)
BEGIN
    CREATE DATABASE HealthCareDB;
    PRINT 'HealthCareDB created.';
END
ELSE
BEGIN
    PRINT 'HealthCareDB already exists — skipping creation.';
END
GO
