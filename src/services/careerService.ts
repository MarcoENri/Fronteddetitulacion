import { api } from "../api/api";

export type CareerDto = { id: number; name: string };

export async function listCareers() {
  const res = await api.get<CareerDto[]>("/careers");
  return res.data;
}
