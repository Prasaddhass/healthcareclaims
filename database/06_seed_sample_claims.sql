-- ============================================================
-- 06_seed_sample_claims.sql
-- Sample claims supplied for local development and demonstrations.
-- Safe to run repeatedly: every insert is guarded by its primary key.
-- ============================================================
USE HealthCareDB;
GO

SET QUOTED_IDENTIFIER ON;
GO

INSERT INTO dbo.Claims (ClaimId, PatientId, InsuranceName, PolicyId, ValidationStatus, CreatedOn, UpdatedOn, CreatedBy, IsDeleted, SentOn)
SELECT source.ClaimId, source.PatientId, source.InsuranceName, source.PolicyId, source.ValidationStatus, source.CreatedOn, source.UpdatedOn, source.CreatedBy, source.IsDeleted, source.SentOn
FROM (VALUES
    (CONVERT(uniqueidentifier, 'a44db10a-6365-4202-96a2-16595f6b217e'), N'Doe, John A', N'Medicare', N'ABC-123', N'Validated', CONVERT(datetime2, '2026-08-30T16:19:19.6700000'), CONVERT(datetime2, '2026-08-30T17:33:32.5000000'), 1, 0, CAST(NULL AS datetime2)),
    (CONVERT(uniqueidentifier, '0484ff7e-221a-46f7-bd58-4df0feeda7ba'), N'Doe, John', N'Medicare', N'POL-001', N'Failed', CONVERT(datetime2, '2026-08-30T16:09:53.3633333'), CONVERT(datetime2, '2026-08-31T05:03:36.2000000'), 1, 0, CAST(NULL AS datetime2)),
    (CONVERT(uniqueidentifier, '7a02b040-dd7a-4fbe-b057-672095f60984'), N'Doe,John A', N'Medicare', N'ABC-123', N'Failed', CONVERT(datetime2, '2026-08-30T15:26:02.3533333'), CONVERT(datetime2, '2026-08-31T05:03:49.6766667'), 1, 0, CAST(NULL AS datetime2)),
    (CONVERT(uniqueidentifier, '13e8f8a3-97bf-454d-95ee-7effe265ac75'), N'Test, Patient', N'Medicare', N'POL-TEST', N'Draft', CONVERT(datetime2, '2026-08-30T15:54:28.1800000'), CONVERT(datetime2, '2026-08-30T15:54:28.2366667'), 1, 1, CAST(NULL AS datetime2)),
    (CONVERT(uniqueidentifier, '42f8377b-ac43-4e84-b710-b30ffa382ec3'), N'Test, Patient', N'Medicare', N'POL-TEST', N'Draft', CONVERT(datetime2, '2026-08-30T15:53:48.7933333'), CONVERT(datetime2, '2026-08-30T15:53:48.8966667'), 1, 1, CAST(NULL AS datetime2)),
    (CONVERT(uniqueidentifier, 'daeba579-ffe3-4e0d-bdd7-da9db2f9a29e'), N'Doe, John', N'Medicare', N'POL-001', N'Pending', CONVERT(datetime2, '2026-08-30T16:13:14.3333333'), CONVERT(datetime2, '2026-08-30T16:13:14.6500000'), 1, 1, CAST(NULL AS datetime2)),
    (CONVERT(uniqueidentifier, 'ce084107-db73-43cc-a9e9-f952c94fd129'), N'Doe, John A', N'Medicare', N'ABC-123', N'Validated', CONVERT(datetime2, '2026-08-30T16:18:42.5433333'), CONVERT(datetime2, '2026-08-30T17:33:37.0066667'), 1, 0, CAST(NULL AS datetime2))
) AS source (ClaimId, PatientId, InsuranceName, PolicyId, ValidationStatus, CreatedOn, UpdatedOn, CreatedBy, IsDeleted, SentOn)
WHERE NOT EXISTS (SELECT 1 FROM dbo.Claims target WHERE target.ClaimId = source.ClaimId);
GO

SET IDENTITY_INSERT dbo.ClaimFormData ON;

INSERT INTO dbo.ClaimFormData (FormDataId, ClaimId, InsuranceType, InsuredIdNumber, PatientName, PatientBirthDate, PatientSex, PatientRelationship, InsuredPolicyNumber, FederalTaxId, AcceptAssignment, TotalCharge, BillingProviderName, BillingProviderNPI, PatientStreet, PatientCity, PatientState, PatientZip, InsuredStreet, InsuredCity, InsuredState, InsuredZip, InsuredDOB, InsuredSex, EmploymentRelated, AutoAccident, OtherAccident, IllnessDate, IllnessQualifier, UnableToWorkFrom, UnableToWorkTo, ReferringProviderName, HospitalizationFrom, HospitalizationTo, OutsideLab, ResubmissionCode, OriginalRefNumber, PatientAccountNumber, ServiceFacilityName, ServiceFacilityStreet, ServiceFacilityCity, ServiceFacilityState, ServiceFacilityZip, ServiceFacilityNPI)
SELECT source.FormDataId, source.ClaimId, source.InsuranceType, source.InsuredIdNumber, source.PatientName, source.PatientBirthDate, source.PatientSex, source.PatientRelationship, source.InsuredPolicyNumber, source.FederalTaxId, source.AcceptAssignment, source.TotalCharge, source.BillingProviderName, source.BillingProviderNPI, source.PatientStreet, source.PatientCity, source.PatientState, source.PatientZip, source.InsuredStreet, source.InsuredCity, source.InsuredState, source.InsuredZip, source.InsuredDOB, source.InsuredSex, source.EmploymentRelated, source.AutoAccident, source.OtherAccident, source.IllnessDate, source.IllnessQualifier, source.UnableToWorkFrom, source.UnableToWorkTo, source.ReferringProviderName, source.HospitalizationFrom, source.HospitalizationTo, source.OutsideLab, source.ResubmissionCode, source.OriginalRefNumber, source.PatientAccountNumber, source.ServiceFacilityName, source.ServiceFacilityStreet, source.ServiceFacilityCity, source.ServiceFacilityState, source.ServiceFacilityZip, source.ServiceFacilityNPI
FROM (VALUES
    (2, CONVERT(uniqueidentifier, '42f8377b-ac43-4e84-b710-b30ffa382ec3'), CAST(NULL AS nvarchar(50)), CAST(NULL AS nvarchar(30)), N'Test, Patient', CONVERT(date, '1980-01-15'), 'M', N'Self', N'POL-TEST', '123456789', 'YES', CAST(0.00 AS decimal(12,2)), N'Test Billing', '1234567890', CAST(NULL AS nvarchar(100)), CAST(NULL AS nvarchar(50)), CAST(NULL AS char(2)), CAST(NULL AS nvarchar(10)), CAST(NULL AS nvarchar(100)), CAST(NULL AS nvarchar(50)), CAST(NULL AS char(2)), CAST(NULL AS nvarchar(10)), CAST(NULL AS date), CAST(NULL AS char(1)), CAST(NULL AS char(3)), CAST(NULL AS char(3)), CAST(NULL AS char(3)), CAST(NULL AS date), CAST(NULL AS nvarchar(10)), CAST(NULL AS date), CAST(NULL AS date), CAST(NULL AS nvarchar(60)), CAST(NULL AS date), CAST(NULL AS date), CAST(NULL AS bit), CAST(NULL AS nvarchar(5)), CAST(NULL AS nvarchar(50)), CAST(NULL AS nvarchar(50)), CAST(NULL AS nvarchar(100)), CAST(NULL AS nvarchar(100)), CAST(NULL AS nvarchar(50)), CAST(NULL AS char(2)), CAST(NULL AS nvarchar(10)), CAST(NULL AS char(10))),
    (3, CONVERT(uniqueidentifier, '13e8f8a3-97bf-454d-95ee-7effe265ac75'), CAST(NULL AS nvarchar(50)), CAST(NULL AS nvarchar(30)), N'Test, Patient', CONVERT(date, '1980-01-15'), 'M', N'Self', N'POL-TEST', '123456789', 'YES', CAST(0.00 AS decimal(12,2)), N'Test Billing', '1234567890', CAST(NULL AS nvarchar(100)), CAST(NULL AS nvarchar(50)), CAST(NULL AS char(2)), CAST(NULL AS nvarchar(10)), CAST(NULL AS nvarchar(100)), CAST(NULL AS nvarchar(50)), CAST(NULL AS char(2)), CAST(NULL AS nvarchar(10)), CAST(NULL AS date), CAST(NULL AS char(1)), CAST(NULL AS char(3)), CAST(NULL AS char(3)), CAST(NULL AS char(3)), CAST(NULL AS date), CAST(NULL AS nvarchar(10)), CAST(NULL AS date), CAST(NULL AS date), CAST(NULL AS nvarchar(60)), CAST(NULL AS date), CAST(NULL AS date), CAST(NULL AS bit), CAST(NULL AS nvarchar(5)), CAST(NULL AS nvarchar(50)), CAST(NULL AS nvarchar(50)), CAST(NULL AS nvarchar(100)), CAST(NULL AS nvarchar(100)), CAST(NULL AS nvarchar(50)), CAST(NULL AS char(2)), CAST(NULL AS nvarchar(10)), CAST(NULL AS char(10))),
    (4, CONVERT(uniqueidentifier, '0484ff7e-221a-46f7-bd58-4df0feeda7ba'), CAST(NULL AS nvarchar(50)), CAST(NULL AS nvarchar(30)), N'Doe, John', CONVERT(date, '1980-01-15'), 'M', N'Self', N'POL-001', '123456789', 'YES', CAST(150.00 AS decimal(12,2)), N'Acme Medical', '1234567890', CAST(NULL AS nvarchar(100)), CAST(NULL AS nvarchar(50)), CAST(NULL AS char(2)), CAST(NULL AS nvarchar(10)), CAST(NULL AS nvarchar(100)), CAST(NULL AS nvarchar(50)), CAST(NULL AS char(2)), CAST(NULL AS nvarchar(10)), CAST(NULL AS date), CAST(NULL AS char(1)), CAST(NULL AS char(3)), CAST(NULL AS char(3)), CAST(NULL AS char(3)), CAST(NULL AS date), CAST(NULL AS nvarchar(10)), CAST(NULL AS date), CAST(NULL AS date), CAST(NULL AS nvarchar(60)), CAST(NULL AS date), CAST(NULL AS date), CAST(NULL AS bit), CAST(NULL AS nvarchar(5)), CAST(NULL AS nvarchar(50)), CAST(NULL AS nvarchar(50)), CAST(NULL AS nvarchar(100)), CAST(NULL AS nvarchar(100)), CAST(NULL AS nvarchar(50)), CAST(NULL AS char(2)), CAST(NULL AS nvarchar(10)), CAST(NULL AS char(10))),
    (5, CONVERT(uniqueidentifier, 'daeba579-ffe3-4e0d-bdd7-da9db2f9a29e'), CAST(NULL AS nvarchar(50)), CAST(NULL AS nvarchar(30)), N'Doe, John', CONVERT(date, '1980-01-15'), 'M', N'Self', N'POL-001', '123456789', 'YES', CAST(150.00 AS decimal(12,2)), N'Acme Medical', '1234567890', CAST(NULL AS nvarchar(100)), CAST(NULL AS nvarchar(50)), CAST(NULL AS char(2)), CAST(NULL AS nvarchar(10)), CAST(NULL AS nvarchar(100)), CAST(NULL AS nvarchar(50)), CAST(NULL AS char(2)), CAST(NULL AS nvarchar(10)), CAST(NULL AS date), CAST(NULL AS char(1)), CAST(NULL AS char(3)), CAST(NULL AS char(3)), CAST(NULL AS char(3)), CAST(NULL AS date), CAST(NULL AS nvarchar(10)), CAST(NULL AS date), CAST(NULL AS date), CAST(NULL AS nvarchar(60)), CAST(NULL AS date), CAST(NULL AS date), CAST(NULL AS bit), CAST(NULL AS nvarchar(5)), CAST(NULL AS nvarchar(50)), CAST(NULL AS nvarchar(50)), CAST(NULL AS nvarchar(100)), CAST(NULL AS nvarchar(100)), CAST(NULL AS nvarchar(50)), CAST(NULL AS char(2)), CAST(NULL AS nvarchar(10)), CAST(NULL AS char(10))),
    (6, CONVERT(uniqueidentifier, 'ce084107-db73-43cc-a9e9-f952c94fd129'), N'Medicare', N'MCR12345789', N'Doe, John A', CONVERT(date, '1980-01-01'), 'M', N'Self', N'ABC-123', '123456789', 'YES', CAST(100.00 AS decimal(12,2)), N'MM Hospital', '1234567890', N'Main Blvd, Main Street', N'Scottsdale', 'AZ', N'50001', N'Erwin Street', N'Scottsdale', 'AZ', N'50001', CONVERT(date, '1980-01-01'), 'M', 'NO', 'NO', 'NO', CONVERT(date, '2026-08-01'), N'431', CONVERT(date, '2026-08-01'), CONVERT(date, '2026-08-04'), N'Dr. Evans, John', CONVERT(date, '2026-08-01'), CONVERT(date, '2026-08-04'), CAST(0 AS bit), N'22', N'22', N'PAT10000', N'MM Hospital', N'Garden Street', N'Scottsdale', 'AZ', N'50002', N'1111111111'),
    (7, CONVERT(uniqueidentifier, 'a44db10a-6365-4202-96a2-16595f6b217e'), CAST(NULL AS nvarchar(50)), N'', N'Doe, John A', CONVERT(date, '1980-01-01'), 'M', N'Self', N'ABC-123', '123456789', 'YES', CAST(15.00 AS decimal(12,2)), N'MM Hospital', '1234567890', CAST(NULL AS nvarchar(100)), CAST(NULL AS nvarchar(50)), CAST(NULL AS char(2)), CAST(NULL AS nvarchar(10)), CAST(NULL AS nvarchar(100)), CAST(NULL AS nvarchar(50)), CAST(NULL AS char(2)), CAST(NULL AS nvarchar(10)), CAST(NULL AS date), CAST(NULL AS char(1)), CAST(NULL AS char(3)), CAST(NULL AS char(3)), CAST(NULL AS char(3)), CAST(NULL AS date), CAST(NULL AS nvarchar(10)), CAST(NULL AS date), CAST(NULL AS date), CAST(NULL AS nvarchar(60)), CAST(NULL AS date), CAST(NULL AS date), CAST(NULL AS bit), CAST(NULL AS nvarchar(5)), CAST(NULL AS nvarchar(50)), CAST(NULL AS nvarchar(50)), CAST(NULL AS nvarchar(100)), CAST(NULL AS nvarchar(100)), CAST(NULL AS nvarchar(50)), CAST(NULL AS char(2)), CAST(NULL AS nvarchar(10)), CAST(NULL AS char(10)))
) AS source (FormDataId, ClaimId, InsuranceType, InsuredIdNumber, PatientName, PatientBirthDate, PatientSex, PatientRelationship, InsuredPolicyNumber, FederalTaxId, AcceptAssignment, TotalCharge, BillingProviderName, BillingProviderNPI, PatientStreet, PatientCity, PatientState, PatientZip, InsuredStreet, InsuredCity, InsuredState, InsuredZip, InsuredDOB, InsuredSex, EmploymentRelated, AutoAccident, OtherAccident, IllnessDate, IllnessQualifier, UnableToWorkFrom, UnableToWorkTo, ReferringProviderName, HospitalizationFrom, HospitalizationTo, OutsideLab, ResubmissionCode, OriginalRefNumber, PatientAccountNumber, ServiceFacilityName, ServiceFacilityStreet, ServiceFacilityCity, ServiceFacilityState, ServiceFacilityZip, ServiceFacilityNPI)
WHERE NOT EXISTS (SELECT 1 FROM dbo.ClaimFormData target WHERE target.ClaimId = source.ClaimId);

SET IDENTITY_INSERT dbo.ClaimFormData OFF;
GO

SET IDENTITY_INSERT dbo.ClaimDiagnosis ON;
INSERT INTO dbo.ClaimDiagnosis (DiagnosisId, ClaimId, Pointer, IcdCode, Sequence)
SELECT source.DiagnosisId, source.ClaimId, source.Pointer, source.IcdCode, source.Sequence
FROM (VALUES
    (1, CONVERT(uniqueidentifier, '0484ff7e-221a-46f7-bd58-4df0feeda7ba'), 'A', N'Z00.00', 1),
    (2, CONVERT(uniqueidentifier, 'daeba579-ffe3-4e0d-bdd7-da9db2f9a29e'), 'A', N'Z00.00', 1),
    (3, CONVERT(uniqueidentifier, 'ce084107-db73-43cc-a9e9-f952c94fd129'), 'A', N'A00.10', 1),
    (4, CONVERT(uniqueidentifier, 'a44db10a-6365-4202-96a2-16595f6b217e'), 'A', N'A00.10', 1)
) AS source (DiagnosisId, ClaimId, Pointer, IcdCode, Sequence)
WHERE NOT EXISTS (SELECT 1 FROM dbo.ClaimDiagnosis target WHERE target.DiagnosisId = source.DiagnosisId);
SET IDENTITY_INSERT dbo.ClaimDiagnosis OFF;
GO

SET IDENTITY_INSERT dbo.ClaimServiceLines ON;
INSERT INTO dbo.ClaimServiceLines (ServiceLineId, ClaimId, LineSequence, ServiceDateFrom, ServiceDateTo, PlaceOfService, ProcedureCode, DiagnosisPointer, LineCharge, DaysUnits, RenderingProviderId)
SELECT source.ServiceLineId, source.ClaimId, source.LineSequence, source.ServiceDateFrom, source.ServiceDateTo, source.PlaceOfService, source.ProcedureCode, source.DiagnosisPointer, source.LineCharge, source.DaysUnits, source.RenderingProviderId
FROM (VALUES
    (2, CONVERT(uniqueidentifier, 'daeba579-ffe3-4e0d-bdd7-da9db2f9a29e'), 1, CAST(NULL AS date), CAST(NULL AS date), CAST(NULL AS char(2)), 'A1234', CAST(NULL AS nvarchar(10)), CAST(150.00 AS decimal(12,2)), CAST(1.000 AS decimal(10,3)), CAST(NULL AS char(10))),
    (3, CONVERT(uniqueidentifier, 'ce084107-db73-43cc-a9e9-f952c94fd129'), 1, CONVERT(date, '2026-08-01'), CONVERT(date, '2026-08-01'), '11', '99213', CAST(NULL AS nvarchar(10)), CAST(100.00 AS decimal(12,2)), CAST(1.000 AS decimal(10,3)), '1234567890'),
    (4, CONVERT(uniqueidentifier, 'a44db10a-6365-4202-96a2-16595f6b217e'), 1, CONVERT(date, '2006-08-01'), CONVERT(date, '2006-08-01'), '11', '99222', N'11', CAST(15.00 AS decimal(12,2)), CAST(1.000 AS decimal(10,3)), CAST(NULL AS char(10)))
) AS source (ServiceLineId, ClaimId, LineSequence, ServiceDateFrom, ServiceDateTo, PlaceOfService, ProcedureCode, DiagnosisPointer, LineCharge, DaysUnits, RenderingProviderId)
WHERE NOT EXISTS (SELECT 1 FROM dbo.ClaimServiceLines target WHERE target.ServiceLineId = source.ServiceLineId);
SET IDENTITY_INSERT dbo.ClaimServiceLines OFF;
GO

SET IDENTITY_INSERT dbo.ClaimDocuments ON;
INSERT INTO dbo.ClaimDocuments (DocumentId, ClaimId, FileName, FilePath, FileType, FileSizeBytes, UploadedOn, UploadedBy)
SELECT source.DocumentId, source.ClaimId, source.FileName, source.FilePath, source.FileType, source.FileSizeBytes, source.UploadedOn, source.UploadedBy
FROM (VALUES
    (1, CONVERT(uniqueidentifier, 'a44db10a-6365-4202-96a2-16595f6b217e'), N'Test.pdf', N'D:\PropelIQ_Explore_V1\uploads\claims\A44DB10A-6365-4202-96A2-16595F6B217E\f0efb339e85842c4a11baffb4a370b93_Test.pdf', 'pdf', 13309, CONVERT(datetime2, '2026-08-30T16:42:06.4933333'), 1),
    (2, CONVERT(uniqueidentifier, 'a44db10a-6365-4202-96a2-16595f6b217e'), N'PropelIQ-Hints.txt', N'D:\PropelIQ_Explore_V1\uploads\claims\A44DB10A-6365-4202-96A2-16595F6B217E\3d3889d62fbc45f9962aac468fb2d7c7_PropelIQ-Hints.txt', 'txt', 3453, CONVERT(datetime2, '2026-08-30T16:49:42.7833333'), 1)
) AS source (DocumentId, ClaimId, FileName, FilePath, FileType, FileSizeBytes, UploadedOn, UploadedBy)
WHERE NOT EXISTS (SELECT 1 FROM dbo.ClaimDocuments target WHERE target.DocumentId = source.DocumentId);
SET IDENTITY_INSERT dbo.ClaimDocuments OFF;
GO

SET IDENTITY_INSERT dbo.ClaimAuditLog ON;
INSERT INTO dbo.ClaimAuditLog (AuditId, ClaimId, OldStatus, NewStatus, ChangedBy, ChangedOn, Notes)
SELECT source.AuditId, source.ClaimId, source.OldStatus, source.NewStatus, source.ChangedBy, source.ChangedOn, source.Notes
FROM (VALUES
    (1, CONVERT(uniqueidentifier, '42f8377b-ac43-4e84-b710-b30ffa382ec3'), N'Draft', N'Deleted', N'debug-test', CONVERT(datetime2, '2026-08-30T15:53:48.8966667'), N'Soft deleted by user'),
    (2, CONVERT(uniqueidentifier, '13e8f8a3-97bf-454d-95ee-7effe265ac75'), N'Draft', N'Deleted', N'debug-test', CONVERT(datetime2, '2026-08-30T15:54:28.2366667'), N'Soft deleted by user'),
    (3, CONVERT(uniqueidentifier, 'daeba579-ffe3-4e0d-bdd7-da9db2f9a29e'), N'Draft', N'Pending', N'admin', CONVERT(datetime2, '2026-08-30T16:13:14.5400000'), N'Created via test'),
    (4, CONVERT(uniqueidentifier, 'daeba579-ffe3-4e0d-bdd7-da9db2f9a29e'), N'Pending', N'Deleted', N'admin', CONVERT(datetime2, '2026-08-30T16:13:14.6500000'), N'Soft deleted by user'),
    (5, CONVERT(uniqueidentifier, 'ce084107-db73-43cc-a9e9-f952c94fd129'), N'Pending', N'Pending', N'admin', CONVERT(datetime2, '2026-08-30T16:18:59.7100000'), N'Claim created via API (Pending)'),
    (6, CONVERT(uniqueidentifier, 'a44db10a-6365-4202-96a2-16595f6b217e'), N'Pending', N'Pending', N'admin', CONVERT(datetime2, '2026-08-30T16:19:20.8766667'), N'Claim created via API (Pending)'),
    (7, CONVERT(uniqueidentifier, '0484ff7e-221a-46f7-bd58-4df0feeda7ba'), N'Draft', N'Failed', N'admin', CONVERT(datetime2, '2026-08-30T16:19:57.7700000'), N'Validation failed: 1 issue(s)'),
    (8, CONVERT(uniqueidentifier, 'a44db10a-6365-4202-96a2-16595f6b217e'), N'Pending', N'Validated', N'admin', CONVERT(datetime2, '2026-08-30T16:25:03.9700000'), N'Validation passed: 0 issue(s)'),
    (9, CONVERT(uniqueidentifier, 'a44db10a-6365-4202-96a2-16595f6b217e'), N'Validated', N'Pending', N'admin', CONVERT(datetime2, '2026-08-30T16:33:48.4000000'), N'Claim updated via API'),
    (10, CONVERT(uniqueidentifier, 'a44db10a-6365-4202-96a2-16595f6b217e'), N'Pending', N'Validated', N'admin', CONVERT(datetime2, '2026-08-30T17:33:32.5033333'), N'Validation passed: 0 issue(s)'),
    (11, CONVERT(uniqueidentifier, 'ce084107-db73-43cc-a9e9-f952c94fd129'), N'Pending', N'Validated', N'admin', CONVERT(datetime2, '2026-08-30T17:33:37.0066667'), N'Validation passed: 0 issue(s)'),
    (12, CONVERT(uniqueidentifier, '0484ff7e-221a-46f7-bd58-4df0feeda7ba'), N'Failed', N'Failed', N'admin', CONVERT(datetime2, '2026-08-30T17:33:38.6700000'), N'Validation failed: 1 issue(s)'),
    (13, CONVERT(uniqueidentifier, '7a02b040-dd7a-4fbe-b057-672095f60984'), N'Draft', N'Failed', N'admin', CONVERT(datetime2, '2026-08-30T17:33:48.8666667'), N'Validation failed: 11 issue(s)'),
    (14, CONVERT(uniqueidentifier, '0484ff7e-221a-46f7-bd58-4df0feeda7ba'), N'Failed', N'Failed', N'admin', CONVERT(datetime2, '2026-08-31T05:03:36.2033333'), N'Validation failed: 1 issue(s)'),
    (15, CONVERT(uniqueidentifier, '7a02b040-dd7a-4fbe-b057-672095f60984'), N'Failed', N'Failed', N'admin', CONVERT(datetime2, '2026-08-31T05:03:49.6766667'), N'Validation failed: 11 issue(s)')
) AS source (AuditId, ClaimId, OldStatus, NewStatus, ChangedBy, ChangedOn, Notes)
WHERE NOT EXISTS (SELECT 1 FROM dbo.ClaimAuditLog target WHERE target.AuditId = source.AuditId);
SET IDENTITY_INSERT dbo.ClaimAuditLog OFF;
GO

PRINT 'Sample claims data applied.';
GO