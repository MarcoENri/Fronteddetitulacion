import { Button, Card, Form, Input, message } from "antd";
import {
  UserOutlined,
  LockOutlined,
  LoginOutlined,
} from "@ant-design/icons";
import { login } from "../services/authService";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const nav = useNavigate();

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      await login(values.username, values.password);
      message.success("Bienvenido al Sistema de Titulación");
      nav("/admin");
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "Error de login");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: "url('/fondo-titulacion.jpg')", // tu imagen
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Card
        style={{
          width: 420,
          borderRadius: 14,
          background: "rgba(255,255,255,0.92)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        }}
      >
        {/* LOGO */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <img
            src="/logo-sudamericano.png"
            alt="Sudamericano"
            style={{ width: 180 }}
          />
          <h2 style={{ color: "#0b7f7a", marginTop: 10 }}>
            Sistema de Titulación
          </h2>
          <p style={{ color: "#555" }}>
            Instituto Tecnológico Sudamericano
          </p>
        </div>

        {/* FORM */}
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Usuario"
            name="username"
            rules={[{ required: true, message: "Ingrese su usuario" }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: "#0b7f7a" }} />}
              placeholder="Usuario"
            />
          </Form.Item>

          <Form.Item
            label="Contraseña"
            name="password"
            rules={[{ required: true, message: "Ingrese su contraseña" }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "#0b7f7a" }} />}
              placeholder="Contraseña"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            icon={<LoginOutlined />}
            style={{
              background: "#0b7f7a",
              borderRadius: 8,
              height: 40,
              fontWeight: "bold",
            }}
          >
            Iniciar Sesión
          </Button>
        </Form>
      </Card>
    </div>
  );
}
