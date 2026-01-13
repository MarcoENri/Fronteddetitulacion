import { api } from "../api/api";

export type CoordinatorStudentRow = {
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

  tutorId?: number | null;
  coordinatorId?: number | null;

  // ✅ NUEVO
  tutorName?: string | null;
  tutorUsername?: string | null;
  coordinatorName?: string | null;
  coordinatorUsername?: string | null;

  thesisProject?: string | null;
  thesisProjectSetAt?: string | null;
};

export type IncidentDto = {
  id: number;
  stage: string;
  date: string;      // LocalDate -> string en JSON
  reason: string;
  action: string;
  createdAt: string; // LocalDateTime -> string
  createdByUserId?: number | null;
};

export type ObservationDto = {
  id: number;
  author: string;
  text: string;
  createdAt: string;
  authorUserId?: number | null;
};

export type StudentDetailDto = {
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

  tutorId?: number | null;
  coordinatorId?: number | null;
  thesisProject?: string | null;
  thesisProjectSetAt?: string | null;

  incidentCount: number;
  observationCount: number;
  incidents: IncidentDto[];
  observations: ObservationDto[];
};

export type CreateIncidentRequest = {
  stage: string;
  date: string; // "2026-01-01"
  reason: string;
  action: string;
};

export type CreateObservationRequest = {
  text: string;
};

export async function listCoordinatorStudents() {
  const res = await api.get<CoordinatorStudentRow[]>("/coordinator/students");
  return res.data;
}

export async function getCoordinatorStudentDetail(id: number | string) {
  const res = await api.get<StudentDetailDto>(`/coordinator/students/${id}`);
  return res.data;
}

export async function createCoordinatorIncident(studentId: number | string, body: CreateIncidentRequest) {
  await api.post(`/coordinator/students/${studentId}/incidents`, body);
}

export async function createCoordinatorObservation(studentId: number | string, body: CreateObservationRequest) {
  await api.post(`/coordinator/students/${studentId}/observations`, body);
}
