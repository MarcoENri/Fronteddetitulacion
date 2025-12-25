import { Button, Card, Form, Input, message } from "antd";
import { login } from "../services/authService";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const nav = useNavigate();

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      await login(values.username, values.password);
      message.success("Login exitoso");
      nav("/admin");
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "Error de login");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 16 }}>
      <Card title="Iniciar sesión" style={{ width: 380 }}>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="Usuario" name="username" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Contraseña" name="password" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Entrar
          </Button>
        </Form>
      </Card>
    </div>
  );
}
