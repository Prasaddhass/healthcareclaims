export const FILE_TYPE_CONFIG = {
  pdf: { color: 'red', label: 'PDF' },
  doc: { color: 'blue', label: 'DOC' },
  docx: { color: 'blue', label: 'DOCX' },
  txt: { color: 'default', label: 'TXT' },
  jpg: { color: 'orange', label: 'JPG' },
  png: { color: 'orange', label: 'PNG' },
} as const;

export const formatBytes = (bytes: number): string => {
  if (bytes >= 1_048_576) {
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
  }

  return `${Math.max(0, Math.round(bytes / 1024))} KB`;
};
