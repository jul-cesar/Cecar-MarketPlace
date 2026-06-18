export interface UploadLogFile {
  key: string;
  name: string;
  size: number;
  url: string;
}

export function buildUploadLogPayload(file: UploadLogFile) {
  return {
    key: file.key,
    name: file.name,
    size: file.size,
    url: file.url,
  };
}
