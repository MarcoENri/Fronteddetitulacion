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

export type IncidentDto = {
  id: number;
  stage: string;
  date: string;
  reason: string;
  action: string;
  createdAt: string;
};

export type ObservationDto = {
  id: number;
  author: string;
  text: string;
  createdAt: string;
};

// Definimos el detalle completo
export type StudentDetailDto = AdminStudentRow & {
  incidents: IncidentDto[];
  observations: ObservationDto[];
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

// Esta función es la que llama tu página de detalle
export async function getStudentDetail(id: string | number) {
  const { data } = await api.get<StudentDetailDto>(`/admin/students/${id}`);
  return data;
}