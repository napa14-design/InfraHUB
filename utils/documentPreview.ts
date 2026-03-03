export const toEmbeddedDocumentUrl = (rawUrl: string): string => {
  const url = (rawUrl || '').trim();
  if (!url) return '';

  try {
    const parsed = new URL(url);

    if (parsed.hostname === 'drive.google.com') {
      const parts = parsed.pathname.split('/').filter(Boolean);

      if (parts[0] === 'file' && parts[1] === 'd' && parts[2]) {
        return `https://drive.google.com/file/d/${parts[2]}/preview`;
      }

      if (parts[0] === 'open') {
        const id = parsed.searchParams.get('id');
        if (id) return `https://drive.google.com/file/d/${id}/preview`;
      }

      if (parts[0] === 'uc') {
        const id = parsed.searchParams.get('id');
        if (id) return `https://drive.google.com/file/d/${id}/preview`;
      }
    }

    if (parsed.hostname === 'docs.google.com') {
      const parts = parsed.pathname.split('/').filter(Boolean);
      const docType = parts[0];
      const docId = parts[2];

      if (
        (docType === 'document' || docType === 'spreadsheets' || docType === 'presentation' || docType === 'forms') &&
        parts[1] === 'd' &&
        docId
      ) {
        return `https://docs.google.com/${docType}/d/${docId}/preview`;
      }
    }

    return url;
  } catch {
    return url;
  }
};
