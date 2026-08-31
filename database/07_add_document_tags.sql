USE HealthCareDB;
GO

IF COL_LENGTH('dbo.ClaimDocuments', 'DocumentTag') IS NULL
BEGIN
    EXEC(
        'ALTER TABLE dbo.ClaimDocuments
            ADD DocumentTag NVARCHAR(30) NOT NULL
                CONSTRAINT DF_ClaimDocuments_DocumentTag DEFAULT ''MISC'' WITH VALUES;'
    );

    EXEC(
        'ALTER TABLE dbo.ClaimDocuments
            ADD CONSTRAINT CHK_ClaimDocuments_DocumentTag
                CHECK (DocumentTag IN (''PolicyDocument'', ''ProviderContractAgreement'', ''InsuranceID'', ''MISC''));'
    );
END
GO