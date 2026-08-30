-- ============================================================
-- 04_stored_procedures.sql
-- All 15 application stored procedures.
-- Uses CREATE OR ALTER PROCEDURE — re-runnable on any version.
-- Every SP has: SET NOCOUNT ON; SET XACT_ABORT ON;
-- No dynamic SQL (EXEC('string')) anywhere.
-- ============================================================
USE HealthCareDB;
GO

-- Required so every procedure is compiled with uses_quoted_identifier=True.
-- Without this, DML on tables with filtered indexes (Claims, ClaimFormData, etc.)
-- raises: "INSERT failed because SET options have incorrect settings: QUOTED_IDENTIFIER"
SET QUOTED_IDENTIFIER ON;
GO

-- ============================================================
-- sp_Login — authenticate user (plain text per BRD, non-prod only)
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.sp_Login
    @Username NVARCHAR(100),
    @Password NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    SELECT UserId, Username, Role
    FROM   dbo.Users
    WHERE  Username = @Username
      AND  Password = @Password
      AND  IsActive = 1;
END;
GO

-- ============================================================
-- sp_GetClaims — paginated list with optional status + search filters
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.sp_GetClaims
    @PageNumber       INT           = 1,
    @PageSize         INT           = 20,
    @ValidationStatus NVARCHAR(20)  = NULL,
    @SearchTerm       NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    SELECT
        c.ClaimId,
        c.PatientId,
        c.InsuranceName,
        c.PolicyId,
        c.ValidationStatus,
        c.CreatedOn,
        c.UpdatedOn,
        c.SentOn,
        COUNT(*) OVER() AS TotalCount
    FROM  dbo.Claims c
    WHERE c.IsDeleted = 0
      AND (@ValidationStatus IS NULL OR c.ValidationStatus = @ValidationStatus)
      AND (
            @SearchTerm IS NULL
            OR c.PatientId       LIKE '%' + @SearchTerm + '%'
            OR c.InsuranceName   LIKE '%' + @SearchTerm + '%'
            OR CAST(c.ClaimId AS NVARCHAR(36)) LIKE '%' + @SearchTerm + '%'
          )
    ORDER BY c.CreatedOn DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
GO

-- ============================================================
-- sp_GetClaimById — full claim detail (4 result sets)
-- RS1: header + form data
-- RS2: diagnosis codes
-- RS3: service lines
-- RS4: document metadata
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.sp_GetClaimById
    @ClaimId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    -- RS1: header + form data
    SELECT c.*, cfd.*
    FROM   dbo.Claims c
    JOIN   dbo.ClaimFormData cfd ON c.ClaimId = cfd.ClaimId
    WHERE  c.ClaimId = @ClaimId AND c.IsDeleted = 0;

    -- RS2: diagnosis codes
    SELECT DiagnosisId, ClaimId, Pointer, IcdCode, Sequence
    FROM   dbo.ClaimDiagnosis
    WHERE  ClaimId = @ClaimId
    ORDER BY Sequence;

    -- RS3: service lines
    SELECT ServiceLineId, ClaimId, LineSequence, ServiceDateFrom, ServiceDateTo,
           PlaceOfService, EmgIndicator, ProcedureCode, DiagnosisPointer,
           LineCharge, DaysUnits, EpsdtFamilyPlan, IdQualifier, RenderingProviderId
    FROM   dbo.ClaimServiceLines
    WHERE  ClaimId = @ClaimId
    ORDER BY LineSequence;

    -- RS4: document metadata (no file bytes)
    SELECT DocumentId, FileName, FileType, FileSizeBytes, UploadedOn
    FROM   dbo.ClaimDocuments
    WHERE  ClaimId = @ClaimId;
END;
GO

-- ============================================================
-- sp_CreateClaim — insert claim header row, returns ClaimId
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.sp_CreateClaim
    @PatientId        NVARCHAR(50),
    @InsuranceName    NVARCHAR(200),
    @PolicyId         NVARCHAR(100),
    @ValidationStatus NVARCHAR(20) = 'Draft',
    @CreatedBy        INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    DECLARE @NewClaimId UNIQUEIDENTIFIER = NEWID();
    INSERT INTO dbo.Claims (ClaimId, PatientId, InsuranceName, PolicyId, ValidationStatus, CreatedBy)
    VALUES (@NewClaimId, @PatientId, @InsuranceName, @PolicyId, @ValidationStatus, @CreatedBy);
    -- Return the new ClaimId so the caller can use it immediately
    SELECT @NewClaimId AS ClaimId;
END;
GO

-- ============================================================
-- sp_UpsertClaimFormData — insert or update all 68 flat fields
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.sp_UpsertClaimFormData
    @ClaimId                UNIQUEIDENTIFIER,
    -- Section 1
    @InsuranceType          NVARCHAR(50)   = NULL,
    @InsuredIdNumber        NVARCHAR(30)   = NULL,
    @PatientName            NVARCHAR(60),
    @PatientBirthDate       DATE,
    @PatientSex             CHAR(1),
    @InsuredName            NVARCHAR(60)   = NULL,
    @PatientStreet          NVARCHAR(100)  = NULL,
    @PatientCity            NVARCHAR(50)   = NULL,
    @PatientState           CHAR(2)        = NULL,
    @PatientZip             NVARCHAR(10)   = NULL,
    @PatientPhone           NVARCHAR(15)   = NULL,
    @PatientRelationship    NVARCHAR(10),
    -- Section 2
    @InsuredStreet          NVARCHAR(100)  = NULL,
    @InsuredCity            NVARCHAR(50)   = NULL,
    @InsuredState           CHAR(2)        = NULL,
    @InsuredZip             NVARCHAR(10)   = NULL,
    @InsuredPolicyNumber    NVARCHAR(100),
    @InsuredDOB             DATE           = NULL,
    @InsuredSex             CHAR(1)        = NULL,
    @OtherClaimId           NVARCHAR(50)   = NULL,
    @InsurancePlanName      NVARCHAR(100)  = NULL,
    @AnotherBenefitPlan     BIT            = 0,
    -- Section 3
    @OtherInsuredName       NVARCHAR(60)   = NULL,
    @OtherPolicyNumber      NVARCHAR(50)   = NULL,
    @OtherPlanName          NVARCHAR(100)  = NULL,
    @PatientSignature       BIT            = NULL,
    @PatientSignatureDate   DATE           = NULL,
    @InsuredSignature       BIT            = NULL,
    -- Section 4
    @EmploymentRelated      CHAR(3)        = NULL,
    @AutoAccident           CHAR(3)        = NULL,
    @AutoAccidentState      CHAR(2)        = NULL,
    @OtherAccident          CHAR(3)        = NULL,
    @IllnessDate            DATE           = NULL,
    @IllnessQualifier       NVARCHAR(10)   = NULL,
    @OtherDate              DATE           = NULL,
    @OtherDateQualifier     NVARCHAR(10)   = NULL,
    @UnableToWorkFrom       DATE           = NULL,
    @UnableToWorkTo         DATE           = NULL,
    @ReferringProviderName  NVARCHAR(60)   = NULL,
    @ReferringProviderNPI   CHAR(10)       = NULL,
    @HospitalizationFrom    DATE           = NULL,
    @HospitalizationTo      DATE           = NULL,
    @AdditionalClaimInfo    NVARCHAR(MAX)  = NULL,
    @OutsideLab             BIT            = NULL,
    @OutsideLabCharges      DECIMAL(12,2)  = NULL,
    -- Section 7
    @ResubmissionCode       NVARCHAR(5)    = NULL,
    @OriginalRefNumber      NVARCHAR(50)   = NULL,
    @PriorAuthNumber        NVARCHAR(50)   = NULL,
    @FederalTaxId           CHAR(9),
    @PatientAccountNumber   NVARCHAR(50)   = NULL,
    @AcceptAssignment       CHAR(3),
    @TotalCharge            DECIMAL(12,2)  = 0,
    @AmountPaid             DECIMAL(12,2)  = NULL,
    @PhysicianSignature     BIT            = NULL,
    @PhysicianSignatureDate DATE           = NULL,
    @ServiceFacilityName    NVARCHAR(100)  = NULL,
    @ServiceFacilityStreet  NVARCHAR(100)  = NULL,
    @ServiceFacilityCity    NVARCHAR(50)   = NULL,
    @ServiceFacilityState   CHAR(2)        = NULL,
    @ServiceFacilityZip     NVARCHAR(10)   = NULL,
    @ServiceFacilityNPI     CHAR(10)       = NULL,
    @BillingProviderName    NVARCHAR(100),
    @BillingProviderStreet  NVARCHAR(100)  = NULL,
    @BillingProviderCity    NVARCHAR(50)   = NULL,
    @BillingProviderState   CHAR(2)        = NULL,
    @BillingProviderZip     NVARCHAR(10)   = NULL,
    @BillingProviderPhone   NVARCHAR(15)   = NULL,
    @BillingProviderNPI     CHAR(10),
    @BillingProviderIdQual  NVARCHAR(2)    = NULL,
    @BillingProviderId      NVARCHAR(50)   = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF EXISTS (SELECT 1 FROM dbo.ClaimFormData WHERE ClaimId = @ClaimId)
    BEGIN
        UPDATE dbo.ClaimFormData SET
            InsuranceType          = @InsuranceType,
            InsuredIdNumber        = @InsuredIdNumber,
            PatientName            = @PatientName,
            PatientBirthDate       = @PatientBirthDate,
            PatientSex             = @PatientSex,
            InsuredName            = @InsuredName,
            PatientStreet          = @PatientStreet,
            PatientCity            = @PatientCity,
            PatientState           = @PatientState,
            PatientZip             = @PatientZip,
            PatientPhone           = @PatientPhone,
            PatientRelationship    = @PatientRelationship,
            InsuredStreet          = @InsuredStreet,
            InsuredCity            = @InsuredCity,
            InsuredState           = @InsuredState,
            InsuredZip             = @InsuredZip,
            InsuredPolicyNumber    = @InsuredPolicyNumber,
            InsuredDOB             = @InsuredDOB,
            InsuredSex             = @InsuredSex,
            OtherClaimId           = @OtherClaimId,
            InsurancePlanName      = @InsurancePlanName,
            AnotherBenefitPlan     = @AnotherBenefitPlan,
            OtherInsuredName       = @OtherInsuredName,
            OtherPolicyNumber      = @OtherPolicyNumber,
            OtherPlanName          = @OtherPlanName,
            PatientSignature       = @PatientSignature,
            PatientSignatureDate   = @PatientSignatureDate,
            InsuredSignature       = @InsuredSignature,
            EmploymentRelated      = @EmploymentRelated,
            AutoAccident           = @AutoAccident,
            AutoAccidentState      = @AutoAccidentState,
            OtherAccident          = @OtherAccident,
            IllnessDate            = @IllnessDate,
            IllnessQualifier       = @IllnessQualifier,
            OtherDate              = @OtherDate,
            OtherDateQualifier     = @OtherDateQualifier,
            UnableToWorkFrom       = @UnableToWorkFrom,
            UnableToWorkTo         = @UnableToWorkTo,
            ReferringProviderName  = @ReferringProviderName,
            ReferringProviderNPI   = @ReferringProviderNPI,
            HospitalizationFrom    = @HospitalizationFrom,
            HospitalizationTo      = @HospitalizationTo,
            AdditionalClaimInfo    = @AdditionalClaimInfo,
            OutsideLab             = @OutsideLab,
            OutsideLabCharges      = @OutsideLabCharges,
            ResubmissionCode       = @ResubmissionCode,
            OriginalRefNumber      = @OriginalRefNumber,
            PriorAuthNumber        = @PriorAuthNumber,
            FederalTaxId           = @FederalTaxId,
            PatientAccountNumber   = @PatientAccountNumber,
            AcceptAssignment       = @AcceptAssignment,
            TotalCharge            = @TotalCharge,
            AmountPaid             = @AmountPaid,
            PhysicianSignature     = @PhysicianSignature,
            PhysicianSignatureDate = @PhysicianSignatureDate,
            ServiceFacilityName    = @ServiceFacilityName,
            ServiceFacilityStreet  = @ServiceFacilityStreet,
            ServiceFacilityCity    = @ServiceFacilityCity,
            ServiceFacilityState   = @ServiceFacilityState,
            ServiceFacilityZip     = @ServiceFacilityZip,
            ServiceFacilityNPI     = @ServiceFacilityNPI,
            BillingProviderName    = @BillingProviderName,
            BillingProviderStreet  = @BillingProviderStreet,
            BillingProviderCity    = @BillingProviderCity,
            BillingProviderState   = @BillingProviderState,
            BillingProviderZip     = @BillingProviderZip,
            BillingProviderPhone   = @BillingProviderPhone,
            BillingProviderNPI     = @BillingProviderNPI,
            BillingProviderIdQual  = @BillingProviderIdQual,
            BillingProviderId      = @BillingProviderId
        WHERE ClaimId = @ClaimId;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.ClaimFormData (
            ClaimId, InsuranceType, InsuredIdNumber, PatientName, PatientBirthDate, PatientSex,
            InsuredName, PatientStreet, PatientCity, PatientState, PatientZip, PatientPhone,
            PatientRelationship, InsuredStreet, InsuredCity, InsuredState, InsuredZip,
            InsuredPolicyNumber, InsuredDOB, InsuredSex, OtherClaimId, InsurancePlanName,
            AnotherBenefitPlan, OtherInsuredName, OtherPolicyNumber, OtherPlanName,
            PatientSignature, PatientSignatureDate, InsuredSignature, EmploymentRelated,
            AutoAccident, AutoAccidentState, OtherAccident, IllnessDate, IllnessQualifier,
            OtherDate, OtherDateQualifier, UnableToWorkFrom, UnableToWorkTo,
            ReferringProviderName, ReferringProviderNPI, HospitalizationFrom, HospitalizationTo,
            AdditionalClaimInfo, OutsideLab, OutsideLabCharges, ResubmissionCode,
            OriginalRefNumber, PriorAuthNumber, FederalTaxId, PatientAccountNumber,
            AcceptAssignment, TotalCharge, AmountPaid, PhysicianSignature, PhysicianSignatureDate,
            ServiceFacilityName, ServiceFacilityStreet, ServiceFacilityCity, ServiceFacilityState,
            ServiceFacilityZip, ServiceFacilityNPI, BillingProviderName, BillingProviderStreet,
            BillingProviderCity, BillingProviderState, BillingProviderZip, BillingProviderPhone,
            BillingProviderNPI, BillingProviderIdQual, BillingProviderId
        )
        VALUES (
            @ClaimId, @InsuranceType, @InsuredIdNumber, @PatientName, @PatientBirthDate, @PatientSex,
            @InsuredName, @PatientStreet, @PatientCity, @PatientState, @PatientZip, @PatientPhone,
            @PatientRelationship, @InsuredStreet, @InsuredCity, @InsuredState, @InsuredZip,
            @InsuredPolicyNumber, @InsuredDOB, @InsuredSex, @OtherClaimId, @InsurancePlanName,
            @AnotherBenefitPlan, @OtherInsuredName, @OtherPolicyNumber, @OtherPlanName,
            @PatientSignature, @PatientSignatureDate, @InsuredSignature, @EmploymentRelated,
            @AutoAccident, @AutoAccidentState, @OtherAccident, @IllnessDate, @IllnessQualifier,
            @OtherDate, @OtherDateQualifier, @UnableToWorkFrom, @UnableToWorkTo,
            @ReferringProviderName, @ReferringProviderNPI, @HospitalizationFrom, @HospitalizationTo,
            @AdditionalClaimInfo, @OutsideLab, @OutsideLabCharges, @ResubmissionCode,
            @OriginalRefNumber, @PriorAuthNumber, @FederalTaxId, @PatientAccountNumber,
            @AcceptAssignment, @TotalCharge, @AmountPaid, @PhysicianSignature, @PhysicianSignatureDate,
            @ServiceFacilityName, @ServiceFacilityStreet, @ServiceFacilityCity, @ServiceFacilityState,
            @ServiceFacilityZip, @ServiceFacilityNPI, @BillingProviderName, @BillingProviderStreet,
            @BillingProviderCity, @BillingProviderState, @BillingProviderZip, @BillingProviderPhone,
            @BillingProviderNPI, @BillingProviderIdQual, @BillingProviderId
        );
    END
END;
GO

-- ============================================================
-- sp_UpsertClaimDiagnosis — insert or update a single diagnosis pointer
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.sp_UpsertClaimDiagnosis
    @ClaimId  UNIQUEIDENTIFIER,
    @Pointer  CHAR(1),
    @IcdCode  NVARCHAR(10),
    @Sequence INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF EXISTS (SELECT 1 FROM dbo.ClaimDiagnosis WHERE ClaimId = @ClaimId AND Pointer = @Pointer)
    BEGIN
        UPDATE dbo.ClaimDiagnosis
        SET IcdCode = @IcdCode, Sequence = @Sequence
        WHERE ClaimId = @ClaimId AND Pointer = @Pointer;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.ClaimDiagnosis (ClaimId, Pointer, IcdCode, Sequence)
        VALUES (@ClaimId, @Pointer, @IcdCode, @Sequence);
    END
END;
GO

-- ============================================================
-- sp_UpsertClaimServiceLine — insert or update a single service line
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.sp_UpsertClaimServiceLine
    @ClaimId             UNIQUEIDENTIFIER,
    @LineSequence        INT,
    @ServiceDateFrom     DATE,
    @ServiceDateTo       DATE,
    @PlaceOfService      CHAR(2),
    @ProcedureCode       CHAR(5),
    @DiagnosisPointer    NVARCHAR(10),
    @LineCharge          DECIMAL(12,2),
    @DaysUnits           DECIMAL(10,3),
    @EmgIndicator        CHAR(1)  = NULL,
    @EpsdtFamilyPlan     CHAR(1)  = NULL,
    @IdQualifier         CHAR(2)  = NULL,
    @RenderingProviderId CHAR(10) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF EXISTS (SELECT 1 FROM dbo.ClaimServiceLines WHERE ClaimId = @ClaimId AND LineSequence = @LineSequence)
    BEGIN
        UPDATE dbo.ClaimServiceLines SET
            ServiceDateFrom     = @ServiceDateFrom,
            ServiceDateTo       = @ServiceDateTo,
            PlaceOfService      = @PlaceOfService,
            ProcedureCode       = @ProcedureCode,
            DiagnosisPointer    = @DiagnosisPointer,
            LineCharge          = @LineCharge,
            DaysUnits           = @DaysUnits,
            EmgIndicator        = @EmgIndicator,
            EpsdtFamilyPlan     = @EpsdtFamilyPlan,
            IdQualifier         = @IdQualifier,
            RenderingProviderId = @RenderingProviderId
        WHERE ClaimId = @ClaimId AND LineSequence = @LineSequence;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.ClaimServiceLines (
            ClaimId, LineSequence, ServiceDateFrom, ServiceDateTo, PlaceOfService,
            ProcedureCode, DiagnosisPointer, LineCharge, DaysUnits,
            EmgIndicator, EpsdtFamilyPlan, IdQualifier, RenderingProviderId
        )
        VALUES (
            @ClaimId, @LineSequence, @ServiceDateFrom, @ServiceDateTo, @PlaceOfService,
            @ProcedureCode, @DiagnosisPointer, @LineCharge, @DaysUnits,
            @EmgIndicator, @EpsdtFamilyPlan, @IdQualifier, @RenderingProviderId
        );
    END
END;
GO

-- ============================================================
-- sp_UpdateValidationStatus — status transition + mandatory audit log entry
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.sp_UpdateValidationStatus
    @ClaimId   UNIQUEIDENTIFIER,
    @NewStatus NVARCHAR(20),
    @ChangedBy NVARCHAR(100),
    @Notes     NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    DECLARE @OldStatus NVARCHAR(20);
    SELECT @OldStatus = ValidationStatus FROM dbo.Claims WHERE ClaimId = @ClaimId;

    UPDATE dbo.Claims SET
        ValidationStatus = @NewStatus,
        UpdatedOn        = GETUTCDATE(),
        SentOn = CASE WHEN @NewStatus = 'Sent' THEN GETUTCDATE() ELSE SentOn END
    WHERE ClaimId = @ClaimId;

    -- Audit log is ALWAYS written — never skip this insert
    INSERT INTO dbo.ClaimAuditLog (ClaimId, OldStatus, NewStatus, ChangedBy, Notes)
    VALUES (@ClaimId, @OldStatus, @NewStatus, @ChangedBy, @Notes);
END;
GO

-- ============================================================
-- sp_DeleteClaim — soft delete (sets IsDeleted = 1) + audit
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.sp_DeleteClaim
    @ClaimId   UNIQUEIDENTIFIER,
    @DeletedBy NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    DECLARE @CurrentStatus NVARCHAR(20);
    SELECT @CurrentStatus = ValidationStatus
    FROM   dbo.Claims
    WHERE  ClaimId = @ClaimId AND IsDeleted = 0;

    UPDATE dbo.Claims
    SET IsDeleted = 1, UpdatedOn = GETUTCDATE()
    WHERE ClaimId = @ClaimId;

    INSERT INTO dbo.ClaimAuditLog (ClaimId, OldStatus, NewStatus, ChangedBy, Notes)
    VALUES (@ClaimId, @CurrentStatus, 'Deleted', @DeletedBy, 'Soft deleted by user');
END;
GO

-- ============================================================
-- sp_AttachDocument — insert document metadata (enforces ≤ 5 per claim)
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.sp_AttachDocument
    @ClaimId       UNIQUEIDENTIFIER,
    @FileName      NVARCHAR(255),
    @FilePath      NVARCHAR(500),
    @FileType      NVARCHAR(10),
    @FileSizeBytes BIGINT,
    @UploadedBy    INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    DECLARE @DocCount INT;
    SELECT @DocCount = COUNT(*) FROM dbo.ClaimDocuments WHERE ClaimId = @ClaimId;
    IF @DocCount >= 5
    BEGIN
        RAISERROR('Maximum 5 documents per claim allowed.', 16, 1);
        RETURN;
    END;
    INSERT INTO dbo.ClaimDocuments (ClaimId, FileName, FilePath, FileType, FileSizeBytes, UploadedBy)
    VALUES (@ClaimId, @FileName, @FilePath, @FileType, @FileSizeBytes, @UploadedBy);
    SELECT SCOPE_IDENTITY() AS DocumentId;
END;
GO

-- ============================================================
-- sp_GetDocuments — list all documents for a claim
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.sp_GetDocuments
    @ClaimId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT DocumentId, FileName, FileType, FileSizeBytes, UploadedOn
    FROM   dbo.ClaimDocuments
    WHERE  ClaimId = @ClaimId
    ORDER BY UploadedOn DESC;
END;
GO

-- ============================================================
-- sp_GetDocumentById — single document lookup (for download / delete)
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.sp_GetDocumentById
    @DocumentId INT,
    @ClaimId    UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT DocumentId, FileName, FilePath, FileType, FileSizeBytes, UploadedOn
    FROM   dbo.ClaimDocuments
    WHERE  DocumentId = @DocumentId AND ClaimId = @ClaimId;
END;
GO

-- ============================================================
-- sp_DeleteDocument — remove a document metadata row
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.sp_DeleteDocument
    @DocumentId INT,
    @ClaimId    UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    DELETE FROM dbo.ClaimDocuments
    WHERE  DocumentId = @DocumentId AND ClaimId = @ClaimId;
END;
GO

-- ============================================================
-- sp_GetClaimsAnalytics — 3 result sets for the dashboard
-- RS1: KPI summary
-- RS2: time-series claim counts (weekly or monthly)
-- RS3: status distribution
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.sp_GetClaimsAnalytics
    @Period NVARCHAR(10) = 'month'  -- 'week' or 'month'
AS
BEGIN
    SET NOCOUNT ON;

    -- RS1: KPI summary
    SELECT
        COUNT(*)                                                                   AS TotalClaims,
        SUM(CASE WHEN CreatedOn >= DATEADD(DAY,   -7, GETUTCDATE()) THEN 1 ELSE 0 END) AS ClaimsThisWeek,
        SUM(CASE WHEN CreatedOn >= DATEADD(MONTH, -1, GETUTCDATE()) THEN 1 ELSE 0 END) AS ClaimsThisMonth,
        SUM(CASE WHEN ValidationStatus = 'Validated' THEN 1 ELSE 0 END)           AS ValidatedClaims,
        SUM(CASE WHEN ValidationStatus = 'Sent'      THEN 1 ELSE 0 END)           AS SentClaims
    FROM dbo.Claims
    WHERE IsDeleted = 0;

    -- RS2: time series
    IF @Period = 'week'
        SELECT
            DATEPART(YEAR, CreatedOn) AS [Year],
            DATEPART(WEEK, CreatedOn) AS [Period],
            COUNT(*)                   AS ClaimCount
        FROM   dbo.Claims
        WHERE  IsDeleted = 0 AND CreatedOn >= DATEADD(WEEK, -12, GETUTCDATE())
        GROUP BY DATEPART(YEAR, CreatedOn), DATEPART(WEEK, CreatedOn)
        ORDER BY [Year], [Period];
    ELSE
        SELECT
            DATEPART(YEAR,  CreatedOn) AS [Year],
            DATEPART(MONTH, CreatedOn) AS [Period],
            COUNT(*)                    AS ClaimCount
        FROM   dbo.Claims
        WHERE  IsDeleted = 0 AND CreatedOn >= DATEADD(MONTH, -12, GETUTCDATE())
        GROUP BY DATEPART(YEAR, CreatedOn), DATEPART(MONTH, CreatedOn)
        ORDER BY [Year], [Period];

    -- RS3: status distribution
    SELECT ValidationStatus, COUNT(*) AS [Count]
    FROM   dbo.Claims
    WHERE  IsDeleted = 0
    GROUP BY ValidationStatus;
END;
GO

-- ============================================================
-- sp_GetValidationRules — retrieve payer-specific + universal rules
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.sp_GetValidationRules
    @PayerCode NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT RuleId, PayerCode, FieldName, RuleType, RuleValue, Description
    FROM   dbo.ValidationRules
    WHERE  PayerCode IS NULL               -- universal rules always included
        OR (@PayerCode IS NOT NULL AND PayerCode = @PayerCode)
    ORDER BY PayerCode, FieldName;
END;
GO

PRINT 'All 15 stored procedures created (or updated).';
GO
