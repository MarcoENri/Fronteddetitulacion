import { api } from "../api/api";

export type ImportBatchResponse = {
  batchId: number;
  status: string;
  fileName: string;
  totalRows: number;
  insertedRows: number;
  updatedRows: number;
  failedRows: number;
};

export type AdminStudentRow = {
  id: number;
  dni: string;
  firstName: string;
  lastName: string;
  email: string;
  corte: string;
  section: string;
  modality?: string | null;
  career: string;
  titulationType: string;
  status: string;
  incidentCount: number;
  observationCount: number;
};

export async function importStudentsXlsx(file: File) {
  const form = new FormData();
  form.append("file", file);

  const { data } = await api.post<ImportBatchResponse>("/admin/students/import/xlsx", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function listStudents() {
  const { data } = await api.get<AdminStudentRow[]>("/admin/students");
  return data;
}
