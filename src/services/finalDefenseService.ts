// src/services/finalDefenseService.ts
import { api } from "../api/api";

// ================== TIPOS ==================
export type FinalDefenseWindowDto = {
  id: number;
  academicPeriodId: number;
  academicPeriodName: string;
  careerId: number | null;
  careerName: string | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  
  hasRubric?: boolean; // ✅ NUEVO: Indica si ya se subió un PDF
};

export type FinalDefenseSlotDto = {
  id: number;
  windowId: number;
  startsAt: string;
  endsAt: string;
  booked: boolean;
  bookingId: number | null;
};

export type FinalDefenseStudentMiniDto = {
  id: number;
  dni: string;
  fullName: string;
  email: string;
  status: string;
  projectName?: string | null; 
};

export type FinalDefenseJuryDto = {
  id: number;
  username: string;
  fullName: string;
  email: string;
};

export type FinalDefenseBookingDto = {
  id: number;
  status: "SCHEDULED" | "FINISHED" | "EVALUATED" | "FINALIZED";
  slotId: number;
  startsAt: string;
  endsAt: string;

  academicPeriodId: number;
  careerId: number;
  careerName: string;

  groupId: number;
  projectName: string | null;

  students: FinalDefenseStudentMiniDto[];
  jury: FinalDefenseJuryDto[];

  finalAverage: number | null;
  verdict: "APROBADO" | "REPROBADO" | null;

  finalObservations: string | null;
  actaPath: string | null;
};

export type FinalDefenseEvaluationDto = {
  id: number;
  bookingId: number;
  juryUserId: number;
  juryName: string;

  rubricScore: number; // 0..50
  extraScore: number;  // 0..50
  totalScore: number;  // 0..100

  observations: string | null;
  createdAt: string;
};

export type CreateFinalDefenseWindowRequest = {
  academicPeriodId?: number | null;
  careerId?: number | null;
  startsAt: string;
  endsAt: string;
};

export type CreateFinalDefenseSlotRequest = {
  startsAt: string;
  endsAt: string;
};

export type CreateFinalDefenseBookingRequest = {
  slotId: number;
  studentIds: number[];   // 1 o 2
  juryUserIds: number[];  // 3
  finalObservations?: string | null;
};

export type CreateFinalDefenseEvaluationRequest = {
  rubricScore: number; // 0..50
  extraScore: number;  // 0..50
  observations?: string | null;
};

// Para /admin/users?role=ROLE_JURY
export type JuryUserDto = {
  id: number;
  username: string;
  fullName: string;
  email: string;
  enabled?: boolean;
  roles: string[];
};

// ================== ADMIN ==================
export async function adminFinalCreateWindow(body: CreateFinalDefenseWindowRequest): Promise<FinalDefenseWindowDto> {
  const res = await api.post<FinalDefenseWindowDto>("/admin/final-defense/windows", body);
  return res.data;
}

export async function adminFinalListWindows(periodId?: number): Promise<FinalDefenseWindowDto[]> {
  const res = await api.get<FinalDefenseWindowDto[]>("/admin/final-defense/windows", {
    params: periodId ? { periodId } : undefined,
  });
  return res.data ?? [];
}

export async function adminFinalCloseWindow(id: number): Promise<void> {
  await api.post(`/admin/final-defense/windows/${id}/close`);
}

// ✅ ADMIN: Subir rúbrica PDF
export async function adminFinalUploadRubric(windowId: number, file: File): Promise<void> {
  const fd = new FormData();
  fd.append("file", file);

  await api.post(`/admin/final-defense/windows/${windowId}/rubric`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function adminFinalCreateSlot(windowId: number, body: CreateFinalDefenseSlotRequest): Promise<FinalDefenseSlotDto> {
  const res = await api.post<FinalDefenseSlotDto>(`/admin/final-defense/windows/${windowId}/slots`, body);
  return res.data;
}

export async function adminFinalListSlots(windowId: number): Promise<FinalDefenseSlotDto[]> {
  const res = await api.get<FinalDefenseSlotDto[]>(`/admin/final-defense/windows/${windowId}/slots`);
  return res.data ?? [];
}

export async function adminFinalListStudentsByCareer(careerId: number, periodId?: number): Promise<FinalDefenseStudentMiniDto[]> {
  const res = await api.get<FinalDefenseStudentMiniDto[]>(`/admin/final-defense/careers/${careerId}/students`, {
    params: periodId ? { periodId } : undefined,
  });
  return res.data ?? [];
}

export async function adminFinalListJuries(): Promise<JuryUserDto[]> {
  const res = await api.get<JuryUserDto[]>("/admin/users", { params: { role: "ROLE_JURY" } });
  return res.data ?? [];
}

export async function adminFinalCreateBooking(body: CreateFinalDefenseBookingRequest): Promise<FinalDefenseBookingDto> {
  const res = await api.post<FinalDefenseBookingDto>("/admin/final-defense/bookings", body);
  return res.data;
}

// ================== JURY ==================
export async function juryFinalMyBookings(): Promise<FinalDefenseBookingDto[]> {
  const res = await api.get<FinalDefenseBookingDto[]>("/jury/final-defense/bookings");
  return res.data ?? [];
}

export async function juryFinalBookingDetail(
  bookingId: number
): Promise<{ booking: FinalDefenseBookingDto; evaluations: FinalDefenseEvaluationDto[] }> {
  const res = await api.get<{ booking: FinalDefenseBookingDto; evaluations: FinalDefenseEvaluationDto[] }>(
    `/jury/final-defense/bookings/${bookingId}`
  );
  return res.data;
}

export async function juryFinalEvaluate(
  bookingId: number,
  body: CreateFinalDefenseEvaluationRequest
): Promise<FinalDefenseEvaluationDto> {
  const res = await api.post<FinalDefenseEvaluationDto>(`/jury/final-defense/bookings/${bookingId}/evaluate`, body);
  return res.data;
}

export async function juryFinalDownloadActaPdf(bookingId: number): Promise<Blob> {
  const res = await api.get(`/jury/final-defense/bookings/${bookingId}/acta.pdf`, {
    responseType: "blob",
  });
  return res.data as Blob;
}

// ✅ JURY: Descargar rúbrica
// ✅ JURY: Descargar rúbrica
export async function juryFinalDownloadRubricPdf(bookingId: number): Promise<Blob> {
  const res = await api.get(`/jury/final-defense/bookings/${bookingId}/rubric.pdf`, {
    responseType: "blob",
  });
  return res.data as Blob;
}

