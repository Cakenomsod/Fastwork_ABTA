export function googleDriveFileId(url: string): string | undefined {
  const openId = /[?&]id=([a-zA-Z0-9_-]+)/.exec(url);
  if (openId?.[1]) return openId[1];
  const filePath = /\/file\/d\/([a-zA-Z0-9_-]+)/.exec(url);
  return filePath?.[1];
}

export function googleDriveViewUrl(url: string): string {
  const id = googleDriveFileId(url);
  return id ? `https://drive.google.com/file/d/${id}/view` : url;
}

export function googleDriveThumbnailUrl(url: string): string | undefined {
  const id = googleDriveFileId(url);
  return id
    ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w800`
    : undefined;
}
