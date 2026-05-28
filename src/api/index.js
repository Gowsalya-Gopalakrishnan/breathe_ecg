import client from "./client";

// Auth
export const login = (email, password) =>
  client.post("/auth/token/", { email, password });

export const refreshToken = (refresh) =>
  client.post("/auth/token/refresh/", { refresh });

// Ingestion uploads
export const uploadFile = (source, file, onProgress) => {
  const form = new FormData();
  form.append("file", file);
  form.append("source_type", source);
  return client.post("/ingestion/upload/", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded * 100) / e.total)),
  });
};

// Ingestion jobs
export const getIngestionJobs = (params) =>
  client.get("/ingestion/jobs/", { params });

export const getIngestionJob = (id) =>
  client.get(`/ingestion/jobs/${id}/`);

// Emission records
export const getEmissionRecords = (params) =>
  client.get("/emissions/records/", { params });

export const approveRecord = (id) =>
  client.post(`/emissions/records/${id}/approve/`);

export const rejectRecord = (id, reason) =>
  client.post(`/emissions/records/${id}/reject/`, { reason });

export const bulkApprove = (ids) =>
  client.post("/emissions/records/bulk_approve/", { ids });

export const bulkReject = (ids, reason) =>
  client.post("/emissions/records/bulk_reject/", { ids, reason });

// Dashboard stats
export const getDashboardStats = () =>
  client.get("/dashboard/stats/");
