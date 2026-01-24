import { api } from "../api/api";

export type UpdateIncidentRequest = {
  stage: string;
  date: string;   // "YYYY-MM-DD"
  reason: string;
  action: string;
};

export async function updateIncident(
  studentId: number,
  incidentId: number,
  periodId: number,
  body: UpdateIncidentRequest
) {
  const res = await api.put(
    `/incidents/students/${studentId}/${incidentId}`,
    body,
    { params: { periodId } }
  );
  return res.data;
}

export async function deleteIncident(
  studentId: number,
  incidentId: number,
  periodId: number
) {
  const res = await api.delete(
    `/incidents/students/${studentId}/${incidentId}`,
    { params: { periodId } }
  );
  return res.data; // trae remainingIncidents y studentStatus
}
