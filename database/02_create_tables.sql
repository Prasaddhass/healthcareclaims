-- ============================================================
-- 02_create_tables.sql
-- Creates all 8 application tables inside HealthCareDB.
-- All tables include IF NOT EXISTS guards so the script is re-runnable.
-- ============================================================
USE HealthCareDB;
GO

-- ============================================================
-- 1. Users
-- Plain-text password per BRD (non-production only).
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Users' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.Users (
        UserId    INT IDENTITY(1,1) NOT NULL,
        Username  NVARCHAR(100)     NOT NULL,
        Password  NVARCHAR(255)     NOT NULL,   -- Plain text per BRD — non-prod only
        Role      NVARCHAR(50)      NOT NULL CONSTRAINT DF_Users_Role DEFAULT 'BillingStaff',
        CreatedOn DATETIME2         NOT NULL CONSTRAINT DF_Users_CreatedOn DEFAULT GETUTCDATE(),
        IsActive  BIT               NOT NULL CONSTRAINT DF_Users_IsActive  DEFAULT 1,
        CONSTRAINT PK_Users PRIMARY KEY (UserId),
        CONSTRAINT UQ_Users_Username UNIQUE (Username)
    );
    PRINT 'Table Users created.';
END
GO

-- ============================================================
-- 2. Claims (header row per claim)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Claims' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.Claims (
        ClaimId          UNIQUEIDENTIFIER NOT NULL
                         CONSTRAINT PK_Claims    PRIMARY KEY
                         CONSTRAINT DF_Claims_ClaimId DEFAULT NEWID(),
        PatientId        NVARCHAR(50)     NOT NULL,
        InsuranceName    NVARCHAR(200)    NOT NULL,
        PolicyId         NVARCHAR(100)    NOT NULL,
        ValidationStatus NVARCHAR(20)     NOT NULL
                         CONSTRAINT DF_Claims_Status  DEFAULT 'Draft'
                         CONSTRAINT CHK_Claims_Status
                             CHECK (ValidationStatus IN ('Draft','Pending','Validated','Failed','Sent')),
        CreatedOn        DATETIME2        NOT NULL CONSTRAINT DF_Claims_CreatedOn DEFAULT GETUTCDATE(),
        UpdatedOn        DATETIME2        NOT NULL CONSTRAINT DF_Claims_UpdatedOn DEFAULT GETUTCDATE(),
        CreatedBy        INT              NOT NULL REFERENCES dbo.Users(UserId),
        IsDeleted        BIT              NOT NULL CONSTRAINT DF_Claims_IsDeleted DEFAULT 0,
        SentOn           DATETIME2        NULL
    );
    PRINT 'Table Claims created.';
END
GO

-- ============================================================
-- 3. ClaimFormData (all 68 CMS-1500 flat fields)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ClaimFormData' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.ClaimFormData (
        FormDataId              INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ClaimFormData PRIMARY KEY,
        ClaimId                 UNIQUEIDENTIFIER  NOT NULL REFERENCES dbo.Claims(ClaimId),
        -- Section 1: Patient Info
        InsuranceType           NVARCHAR(50)   NULL,
        InsuredIdNumber         NVARCHAR(30)   NULL,
        PatientName             NVARCHAR(60)   NOT NULL,
        PatientBirthDate        DATE           NOT NULL,
        PatientSex              CHAR(1)        NOT NULL CONSTRAINT CHK_CFD_PatientSex   CHECK (PatientSex IN ('M','F')),
        InsuredName             NVARCHAR(60)   NULL,
        PatientStreet           NVARCHAR(100)  NULL,
        PatientCity             NVARCHAR(50)   NULL,
        PatientState            CHAR(2)        NULL,
        PatientZip              NVARCHAR(10)   NULL,
        PatientPhone            NVARCHAR(15)   NULL,
        PatientRelationship     NVARCHAR(10)   NOT NULL
                                CONSTRAINT CHK_CFD_PatientRel CHECK (PatientRelationship IN ('Self','Spouse','Child','Other')),
        -- Section 2: Insured Info
        InsuredStreet           NVARCHAR(100)  NULL,
        InsuredCity             NVARCHAR(50)   NULL,
        InsuredState            CHAR(2)        NULL,
        InsuredZip              NVARCHAR(10)   NULL,
        InsuredPolicyNumber     NVARCHAR(100)  NOT NULL,
        InsuredDOB              DATE           NULL,
        InsuredSex              CHAR(1)        NULL CONSTRAINT CHK_CFD_InsuredSex CHECK (InsuredSex IN ('M','F')),
        OtherClaimId            NVARCHAR(50)   NULL,
        InsurancePlanName       NVARCHAR(100)  NULL,
        AnotherBenefitPlan      BIT            NOT NULL CONSTRAINT DF_CFD_AnotherBenefitPlan DEFAULT 0,
        -- Section 3: Other Insurance
        OtherInsuredName        NVARCHAR(60)   NULL,
        OtherPolicyNumber       NVARCHAR(50)   NULL,
        OtherPlanName           NVARCHAR(100)  NULL,
        PatientSignature        BIT            NULL,
        PatientSignatureDate    DATE           NULL,
        InsuredSignature        BIT            NULL,
        -- Section 4: Condition Info
        EmploymentRelated       CHAR(3)        NULL CONSTRAINT CHK_CFD_EmpRel    CHECK (EmploymentRelated  IN ('YES','NO')),
        AutoAccident            CHAR(3)        NULL CONSTRAINT CHK_CFD_AutoAcc   CHECK (AutoAccident       IN ('YES','NO')),
        AutoAccidentState       CHAR(2)        NULL,
        OtherAccident           CHAR(3)        NULL CONSTRAINT CHK_CFD_OtherAcc  CHECK (OtherAccident      IN ('YES','NO')),
        IllnessDate             DATE           NULL,
        IllnessQualifier        NVARCHAR(10)   NULL,
        OtherDate               DATE           NULL,
        OtherDateQualifier      NVARCHAR(10)   NULL,
        UnableToWorkFrom        DATE           NULL,
        UnableToWorkTo          DATE           NULL,
        ReferringProviderName   NVARCHAR(60)   NULL,
        ReferringProviderNPI    CHAR(10)       NULL,
        HospitalizationFrom     DATE           NULL,
        HospitalizationTo       DATE           NULL,
        AdditionalClaimInfo     NVARCHAR(MAX)  NULL,
        OutsideLab              BIT            NULL,
        OutsideLabCharges       DECIMAL(12,2)  NULL,
        -- Section 7: Provider & Billing
        ResubmissionCode        NVARCHAR(5)    NULL,
        OriginalRefNumber       NVARCHAR(50)   NULL,
        PriorAuthNumber         NVARCHAR(50)   NULL,
        FederalTaxId            CHAR(9)        NOT NULL,
        PatientAccountNumber    NVARCHAR(50)   NULL,
        AcceptAssignment        CHAR(3)        NOT NULL CONSTRAINT CHK_CFD_AcceptAssign CHECK (AcceptAssignment IN ('YES','NO')),
        TotalCharge             DECIMAL(12,2)  NOT NULL CONSTRAINT DF_CFD_TotalCharge DEFAULT 0,
        AmountPaid              DECIMAL(12,2)  NULL,
        PhysicianSignature      BIT            NULL,
        PhysicianSignatureDate  DATE           NULL,
        ServiceFacilityName     NVARCHAR(100)  NULL,
        ServiceFacilityStreet   NVARCHAR(100)  NULL,
        ServiceFacilityCity     NVARCHAR(50)   NULL,
        ServiceFacilityState    CHAR(2)        NULL,
        ServiceFacilityZip      NVARCHAR(10)   NULL,
        ServiceFacilityNPI      CHAR(10)       NULL,
        BillingProviderName     NVARCHAR(100)  NOT NULL,
        BillingProviderStreet   NVARCHAR(100)  NULL,
        BillingProviderCity     NVARCHAR(50)   NULL,
        BillingProviderState    CHAR(2)        NULL,
        BillingProviderZip      NVARCHAR(10)   NULL,
        BillingProviderPhone    NVARCHAR(15)   NULL,
        BillingProviderNPI      CHAR(10)       NOT NULL,
        BillingProviderIdQual   NVARCHAR(2)    NULL,
        BillingProviderId       NVARCHAR(50)   NULL,
        CONSTRAINT UQ_ClaimFormData_ClaimId UNIQUE (ClaimId)
    );
    PRINT 'Table ClaimFormData created.';
END
GO

-- ============================================================
-- 4. ClaimDiagnosis (up to 12 ICD-10 codes, pointers A–L)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ClaimDiagnosis' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.ClaimDiagnosis (
        DiagnosisId INT              IDENTITY(1,1) NOT NULL CONSTRAINT PK_ClaimDiagnosis PRIMARY KEY,
        ClaimId     UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.Claims(ClaimId),
        Pointer     CHAR(1)          NOT NULL
                    CONSTRAINT CHK_Diag_Pointer CHECK (Pointer IN ('A','B','C','D','E','F','G','H','I','J','K','L')),
        IcdCode     NVARCHAR(10)     NOT NULL,
        Sequence    INT              NOT NULL,
        CONSTRAINT UQ_Diagnosis_ClaimPointer UNIQUE (ClaimId, Pointer)
    );
    PRINT 'Table ClaimDiagnosis created.';
END
GO

-- ============================================================
-- 5. ClaimServiceLines (up to 6 rows per claim)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ClaimServiceLines' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.ClaimServiceLines (
        ServiceLineId       INT              IDENTITY(1,1) NOT NULL CONSTRAINT PK_ClaimServiceLines PRIMARY KEY,
        ClaimId             UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.Claims(ClaimId),
        LineSequence        INT              NOT NULL CONSTRAINT CHK_SL_Seq CHECK (LineSequence BETWEEN 1 AND 6),
        ServiceDateFrom     DATE             NULL,
        ServiceDateTo       DATE             NULL,
        PlaceOfService      CHAR(2)          NULL,
        EmgIndicator        CHAR(1)          NULL,
        ProcedureCode       CHAR(5)          NOT NULL,
        DiagnosisPointer    NVARCHAR(10)     NULL,
        LineCharge          DECIMAL(12,2)    NOT NULL,
        DaysUnits           DECIMAL(10,3)    NULL,
        EpsdtFamilyPlan     CHAR(1)          NULL,
        IdQualifier         CHAR(2)          NULL,
        RenderingProviderId CHAR(10)         NULL,
        CONSTRAINT UQ_ServiceLine_Sequence UNIQUE (ClaimId, LineSequence)
    );
    PRINT 'Table ClaimServiceLines created.';
END
GO

-- ============================================================
-- 6. ClaimDocuments
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ClaimDocuments' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.ClaimDocuments (
        DocumentId    INT              IDENTITY(1,1) NOT NULL CONSTRAINT PK_ClaimDocuments PRIMARY KEY,
        ClaimId       UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.Claims(ClaimId),
        FileName      NVARCHAR(255)    NOT NULL,
        FilePath      NVARCHAR(500)    NOT NULL,
        FileType      NVARCHAR(10)     NOT NULL
                      CONSTRAINT CHK_Doc_FileType CHECK (FileType IN ('pdf','doc','docx','txt')),
        FileSizeBytes BIGINT           NOT NULL,
        UploadedOn    DATETIME2        NOT NULL CONSTRAINT DF_ClaimDocs_UploadedOn DEFAULT GETUTCDATE(),
        UploadedBy    INT              NOT NULL REFERENCES dbo.Users(UserId)
    );
    PRINT 'Table ClaimDocuments created.';
END
GO

-- ============================================================
-- 7. ClaimAuditLog (append-only — no UPDATE/DELETE on this table)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ClaimAuditLog' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.ClaimAuditLog (
        AuditId   INT              IDENTITY(1,1) NOT NULL CONSTRAINT PK_ClaimAuditLog PRIMARY KEY,
        ClaimId   UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.Claims(ClaimId),
        OldStatus NVARCHAR(20)     NULL,
        NewStatus NVARCHAR(20)     NOT NULL,
        ChangedBy NVARCHAR(100)    NOT NULL,
        ChangedOn DATETIME2        NOT NULL CONSTRAINT DF_AuditLog_ChangedOn DEFAULT GETUTCDATE(),
        Notes     NVARCHAR(MAX)    NULL
    );
    PRINT 'Table ClaimAuditLog created.';
END
GO

-- ============================================================
-- 8. ValidationRules (for AI / RAG knowledge base)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ValidationRules' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.ValidationRules (
        RuleId      INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ValidationRules PRIMARY KEY,
        PayerCode   NVARCHAR(20)   NULL,   -- NULL = universal rule
        FieldName   NVARCHAR(100)  NOT NULL,
        RuleType    NVARCHAR(50)   NOT NULL,
        RuleValue   NVARCHAR(500)  NOT NULL,
        Description NVARCHAR(1000) NULL
    );
    PRINT 'Table ValidationRules created.';
END
GO

PRINT 'All 8 tables created (or already existed).';
GO
