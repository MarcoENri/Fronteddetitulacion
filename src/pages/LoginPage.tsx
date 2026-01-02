import { Button, Card, Form, Input, message } from "antd";
import type { FormProps } from "antd";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";

type LoginValues = { username: string; password: string };
type LoginResponse = { token: string };
type MeDto = { username: string; roles: string[] };

export default function LoginPage() {
  const nav = useNavigate();

  const onFinish: FormProps<LoginValues>["onFinish"] = async (values) => {
    try {
      // 1) login
      const res = await api.post<LoginResponse>("/auth/login", values);
      const token = res.data.token;

      localStorage.setItem("token", token);

      // 2) leer roles
      const me = await api.get<MeDto>("/me");
      const roles = me.data.roles ?? [];

      if (roles.includes("ROLE_ADMIN")) nav("/admin", { replace: true });
      else if (roles.includes("ROLE_COORDINATOR")) nav("/coordinator", { replace: true });
      else if (roles.includes("ROLE_TUTOR")) nav("/tutor", { replace: true });
      else {
        message.error("Tu usuario no tiene rol asignado");
        localStorage.removeItem("token");
      }
    } catch (e: any) {
      localStorage.removeItem("token");
      message.error(e?.response?.data?.message ?? "Credenciales incorrectas");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 16 }}>
      <Card title="Sistema de Titulación" style={{ width: 360 }}>
        <Form<LoginValues> layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Usuario"
            name="username"
            rules={[{ required: true, message: "Ingresa tu usuario" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Contraseña"
            name="password"
            rules={[{ required: true, message: "Ingresa tu contraseña" }]}
          >
            <Input.Password />
          </Form.Item>

          <Button type="primary" htmlType="submit" block>
            Iniciar sesión
          </Button>
        </Form>
      </Card>
    </div>
  );
}
