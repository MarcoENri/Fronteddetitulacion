import { api } from "../api/api";

export type CreateUserRequest = {
  username: string;
  password: string;
  fullName: string;
  email: string;
  roles: string[]; // ["COORDINATOR"] o ["TUTOR"] o ["ADMIN"]
};

export async function createUser(req: CreateUserRequest) {
  const res = await api.post("/admin/users", req);
  return res.data;
}
