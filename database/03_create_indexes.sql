-- ============================================================
-- 03_create_indexes.sql
-- Performance indexes for the most frequently queried columns.
-- All filtered WHERE IsDeleted = 0 to minimise index size.
-- Requires SET QUOTED_IDENTIFIER ON for filtered indexes.
-- ============================================================
USE HealthCareDB;
GO

SET QUOTED_IDENTIFIER ON;
GO

-- Claims — primary list query filters
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Claims_ValidationStatus' AND object_id = OBJECT_ID('dbo.Claims'))
BEGIN
    CREATE INDEX IX_Claims_ValidationStatus
        ON dbo.Claims (ValidationStatus)
        WHERE IsDeleted = 0;
    PRINT 'Index IX_Claims_ValidationStatus created.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Claims_CreatedOn' AND object_id = OBJECT_ID('dbo.Claims'))
BEGIN
    CREATE INDEX IX_Claims_CreatedOn
        ON dbo.Claims (CreatedOn DESC)
        WHERE IsDeleted = 0;
    PRINT 'Index IX_Claims_CreatedOn created.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Claims_PatientId' AND object_id = OBJECT_ID('dbo.Claims'))
BEGIN
    CREATE INDEX IX_Claims_PatientId
        ON dbo.Claims (PatientId)
        WHERE IsDeleted = 0;
    PRINT 'Index IX_Claims_PatientId created.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Claims_CreatedBy' AND object_id = OBJECT_ID('dbo.Claims'))
BEGIN
    CREATE INDEX IX_Claims_CreatedBy
        ON dbo.Claims (CreatedBy);
    PRINT 'Index IX_Claims_CreatedBy created.';
END
GO

-- Child table lookups by ClaimId
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ClaimDiagnosis_ClaimId' AND object_id = OBJECT_ID('dbo.ClaimDiagnosis'))
BEGIN
    CREATE INDEX IX_ClaimDiagnosis_ClaimId
        ON dbo.ClaimDiagnosis (ClaimId);
    PRINT 'Index IX_ClaimDiagnosis_ClaimId created.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ServiceLines_ClaimId' AND object_id = OBJECT_ID('dbo.ClaimServiceLines'))
BEGIN
    CREATE INDEX IX_ServiceLines_ClaimId
        ON dbo.ClaimServiceLines (ClaimId);
    PRINT 'Index IX_ServiceLines_ClaimId created.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ClaimDocs_ClaimId' AND object_id = OBJECT_ID('dbo.ClaimDocuments'))
BEGIN
    CREATE INDEX IX_ClaimDocs_ClaimId
        ON dbo.ClaimDocuments (ClaimId);
    PRINT 'Index IX_ClaimDocs_ClaimId created.';
END
GO

-- Audit log — lookup by claim + time
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AuditLog_ClaimId_Time' AND object_id = OBJECT_ID('dbo.ClaimAuditLog'))
BEGIN
    CREATE INDEX IX_AuditLog_ClaimId_Time
        ON dbo.ClaimAuditLog (ClaimId, ChangedOn DESC);
    PRINT 'Index IX_AuditLog_ClaimId_Time created.';
END
GO

PRINT 'All 8 indexes created (or already existed).';
GO
