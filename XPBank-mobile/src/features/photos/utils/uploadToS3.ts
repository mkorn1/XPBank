import * as FileSystem from 'expo-file-system';

export interface UploadProgress {
  loaded: number;
  total: number;
}

export async function uploadToS3(
  presignedUrl: string,
  fileUri: string,
  mimeType: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<void> {
  const uploadTask = FileSystem.createUploadTask(
    presignedUrl,
    fileUri,
    {
      httpMethod: 'PUT',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        'Content-Type': mimeType,
      },
    },
    (uploadProgress) => {
      if (onProgress) {
        onProgress({
          loaded: uploadProgress.totalBytesWritten,
          total: uploadProgress.totalBytesExpectedToWrite,
        });
      }
    }
  );

  const result = await uploadTask.uploadAsync();
  
  if (result.status !== 200) {
    throw new Error(`Upload failed with status ${result.status}`);
  }
}

