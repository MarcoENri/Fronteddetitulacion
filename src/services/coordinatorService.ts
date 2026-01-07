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
};

export type IncidentDto = {
  id: number;
  stage: string;
  date: string;
  reason: string;
  action: string;
  createdAt: string;
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
  date: string;
  reason: string;
  action: string;
};

export type CreateObservationRequest = {
  text: string;
};

export async function listCoordinatorStudents(): Promise<CoordinatorStudentRow[]> {
  const res = await api.get<CoordinatorStudentRow[]>("/coordinator/students");
  return res.data;
}

export async function getCoordinatorStudentDetail(id: number | string): Promise<StudentDetailDto> {
  const res = await api.get<StudentDetailDto>(`/coordinator/students/${id}`);
  return res.data;
}

export async function createCoordinatorIncident(
  studentId: number | string,
  body: CreateIncidentRequest
): Promise<void> {
  await api.post(`/coordinator/students/${studentId}/incidents`, body);
}

export async function createCoordinatorObservation(
  studentId: number | string,
  body: CreateObservationRequest
): Promise<void> {
  await api.post(`/coordinator/students/${studentId}/observations`, body);
}

// ✅ NUEVO: asignar tutor + proyecto
export type AssignProjectRequest = { projectName: string; tutorId: number };

export async function assignProject(studentId: number, body: AssignProjectRequest): Promise<void> {
  await api.put(`/coordinator/students/${studentId}/project`, body);
}
