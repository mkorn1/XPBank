import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { UploadJob } from '../types/upload';

interface UploadContextType {
  uploadJobs: Map<string, UploadJob>;
  setUploadJobs: React.Dispatch<React.SetStateAction<Map<string, UploadJob>>>;
  updateUploadJob: (uploadId: string, updates: Partial<UploadJob>) => void;
  getActiveUploads: () => UploadJob[];
  getCompletedUploads: () => UploadJob[];
  getFailedUploads: () => UploadJob[];
  getTotalProgress: () => { uploaded: number; total: number; percentage: number };
  getStatusSummary: () => {
    pending: number;
    uploading: number;
    completed: number;
    failed: number;
    total: number;
  };
  clearCompleted: () => void;
  clearFailed: () => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: ReactNode }) {
  const [uploadJobs, setUploadJobs] = useState<Map<string, UploadJob>>(new Map());

  const updateUploadJob = useCallback((uploadId: string, updates: Partial<UploadJob>) => {
    setUploadJobs((prev) => {
      const updated = new Map(prev);
      const job = updated.get(uploadId);
      if (job) {
        updated.set(uploadId, { ...job, ...updates });
      }
      return updated;
    });
  }, []);

  const getActiveUploads = useCallback((): UploadJob[] => {
    return Array.from(uploadJobs.values()).filter(
      (job) => job.status === 'PENDING' || job.status === 'UPLOADING'
    );
  }, [uploadJobs]);

  const getCompletedUploads = useCallback((): UploadJob[] => {
    return Array.from(uploadJobs.values()).filter(
      (job) => job.status === 'COMPLETED'
    );
  }, [uploadJobs]);

  const getFailedUploads = useCallback((): UploadJob[] => {
    return Array.from(uploadJobs.values()).filter(
      (job) => job.status === 'FAILED'
    );
  }, [uploadJobs]);

  const getTotalProgress = useCallback((): { uploaded: number; total: number; percentage: number } => {
    const activeUploads = getActiveUploads();
    if (activeUploads.length === 0) {
      return { uploaded: 0, total: 0, percentage: 0 };
    }

    const total = activeUploads.reduce((sum, job) => sum + job.fileSize, 0);
    const uploaded = activeUploads.reduce((sum, job) => {
      return sum + (job.fileSize * job.progress) / 100;
    }, 0);

    const percentage = total > 0 ? (uploaded / total) * 100 : 0;

    return { uploaded, total, percentage };
  }, [getActiveUploads]);

  const getStatusSummary = useCallback(() => {
    const allJobs = Array.from(uploadJobs.values());
    return {
      pending: allJobs.filter((job) => job.status === 'PENDING').length,
      uploading: allJobs.filter((job) => job.status === 'UPLOADING').length,
      completed: allJobs.filter((job) => job.status === 'COMPLETED').length,
      failed: allJobs.filter((job) => job.status === 'FAILED').length,
      total: allJobs.length,
    };
  }, [uploadJobs]);

  const clearCompleted = useCallback(() => {
    setUploadJobs((prev) => {
      const updated = new Map(prev);
      Array.from(updated.entries()).forEach(([id, job]) => {
        if (job.status === 'COMPLETED') {
          updated.delete(id);
        }
      });
      return updated;
    });
  }, []);

  const clearFailed = useCallback(() => {
    setUploadJobs((prev) => {
      const updated = new Map(prev);
      Array.from(updated.entries()).forEach(([id, job]) => {
        if (job.status === 'FAILED') {
          updated.delete(id);
        }
      });
      return updated;
    });
  }, []);

  return (
    <UploadContext.Provider
      value={{
        uploadJobs,
        setUploadJobs,
        updateUploadJob,
        getActiveUploads,
        getCompletedUploads,
        getFailedUploads,
        getTotalProgress,
        getStatusSummary,
        clearCompleted,
        clearFailed,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
}

export function useUploadContext() {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error('useUploadContext must be used within an UploadProvider');
  }
  return context;
}

