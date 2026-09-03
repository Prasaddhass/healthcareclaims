USE HealthCareDB;
GO

CREATE OR ALTER PROCEDURE dbo.sp_AttachDocument
    @ClaimId       UNIQUEIDENTIFIER,
    @FileName      NVARCHAR(255),
    @FilePath      NVARCHAR(500),
    @FileType      NVARCHAR(10),
    @DocumentTag   NVARCHAR(30),
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

    INSERT INTO dbo.ClaimDocuments (
        ClaimId,
        FileName,
        FilePath,
        FileType,
        DocumentTag,
        FileSizeBytes,
        UploadedBy
    )
    VALUES (
        @ClaimId,
        @FileName,
        @FilePath,
        @FileType,
        @DocumentTag,
        @FileSizeBytes,
        @UploadedBy
    );

    SELECT SCOPE_IDENTITY() AS DocumentId;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_GetDocuments
    @ClaimId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        DocumentId,
        FileName,
        FilePath,
        FileType,
        DocumentTag,
        FileSizeBytes,
        UploadedOn
    FROM dbo.ClaimDocuments
    WHERE ClaimId = @ClaimId
    ORDER BY UploadedOn DESC;
END;
GO
