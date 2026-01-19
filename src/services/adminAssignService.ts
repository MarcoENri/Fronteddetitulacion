import { api } from "../api/api";

// Cambiamos el tipo a 'any' o 'FormData' para que acepte el archivo de imagen
export async function assignStudent(studentId: number, body: FormData): Promise<void> {
  await api.put(`/admin/students/${studentId}/assign`, body, {
    headers: {
      // Importante: Esto le dice al servidor que va un archivo incluido
      "Content-Type": "multipart/form-data",
    },
  });
}

export type AdminAssignCareerRequest = {
  coordinatorId: number;
  tutorId?: number | null;
  projectName?: string | null;
  onlyUnassigned?: boolean; 
};

export async function assignCareer(careerId: number, body: AdminAssignCareerRequest): Promise<void> {
  await api.put(`/admin/careers/${careerId}/assign`, body);
}