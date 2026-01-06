import { api } from "../api/api";

export type AdminAssignStudentRequest = {
  coordinatorId: number;
  tutorId?: number | null;
  projectName?: string | null;
};

export async function assignStudent(studentId: number, body: AdminAssignStudentRequest): Promise<void> {
  await api.put(`/admin/students/${studentId}/assign`, body);
}

export type AdminAssignCareerRequest = {
  coordinatorId: number;
  tutorId?: number | null;
  projectName?: string | null;
  onlyUnassigned?: boolean; // opcional
};

export async function assignCareer(careerId: number, body: AdminAssignCareerRequest): Promise<void> {
  await api.put(`/admin/careers/${careerId}/assign`, body);
}
