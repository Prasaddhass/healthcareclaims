"""
Domain enumerations used throughout the application.
All enums inherit from str to be JSON-serialisable.
"""
from enum import Enum


class ValidationStatus(str, Enum):
    """CMS-1500 claim lifecycle statuses.  Enforced by DB CHECK constraint."""
    Draft     = "Draft"
    Pending   = "Pending"
    Validated = "Validated"
    Failed    = "Failed"
    Sent      = "Sent"


class InsuranceType(str, Enum):
    """Item 1 — Insurance Type (CMS-1500)."""
    Medicare       = "Medicare"
    Medicaid       = "Medicaid"
    TRICARE        = "TRICARE"
    CHAMPVA        = "CHAMPVA"
    GroupHealthPlan = "Group Health Plan"
    FECABlackLung  = "FECA/Black Lung"
    Other          = "Other"


class PatientRelationship(str, Enum):
    """Item 6 — Patient Relationship to Insured (CMS-1500)."""
    Self   = "Self"
    Spouse = "Spouse"
    Child  = "Child"
    Other  = "Other"


class FileType(str, Enum):
    """Allowed document attachment types."""
    pdf  = "pdf"
    doc  = "doc"
    docx = "docx"
    txt  = "txt"
