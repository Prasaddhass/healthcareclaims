-- ============================================================
-- 05_seed_data.sql
-- Seeds the initial admin user.
-- WARNING: Plain-text password per BRD spec — NON-PRODUCTION ONLY.
-- ============================================================
USE HealthCareDB;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Username = 'admin')
BEGIN
    INSERT INTO dbo.Users (Username, Password, Role)
    VALUES ('admin', 'admin', 'Admin');
    PRINT 'Admin user seeded.';
END
ELSE
BEGIN
    PRINT 'Admin user already exists — skipping.';
END
GO

PRINT 'Seed data applied.';
GO
