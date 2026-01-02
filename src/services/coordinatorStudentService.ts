import { api } from "../api/api";

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

export type StudentDetailDto = {
  id: number;
  dni: string;
  firstName: string;
  lastName: string;
  email: string;
  career: string;
  status: string;

  thesisProject?: string;
  tutorId?: number;
  coordinatorId?: number;

  incidentCount: number;
  observationCount: number;

  incidents: IncidentDto[];
  observations: ObservationDto[];
};

export const getStudentDetail = (id: string) =>
  api.get<StudentDetailDto>(`/coordinator/students/${id}`);

export const createIncident = (id: string, data: {
  stage: string;
  date: string;
  reason: string;
  action: string;
}) =>
  api.post(`/coordinator/students/${id}/incidents`, data);

export const createObservation = (id: string, data: {
  text: string;
}) =>
  api.post(`/coordinator/students/${id}/observations`, data);
