import { Card, Table, Tag, Button, Space, message } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/authService";
import type { TutorStudentRow } from "../services/tutorService";
import { listTutorStudents } from "../services/tutorService";

export default function TutorStudentsPage() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<TutorStudentRow[]>([]);
  const nav = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const data = await listTutorStudents();
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error("ERROR listTutorStudents:", e?.response?.data ?? e);
      message.error(e?.response?.data?.message ?? "No se pudo cargar estudiantes (TUTOR)");

      if (e?.response?.status === 401 || e?.response?.status === 403) {
        logout();
        nav("/");
      } else {
        setRows([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Tutor · Mis estudiantes</h2>
        <Space>
          <Button onClick={load} loading={loading}>Refrescar</Button>
          <Button danger onClick={() => { logout(); nav("/"); }}>
            Cerrar sesión
          </Button>
        </Space>
      </Space>

      <Card title="Listado">
        <Table<TutorStudentRow>
          rowKey="id"
          loading={loading}
          dataSource={rows}
          pagination={{ pageSize: 10 }}
          onRow={(record) => ({
            onClick: () => nav(`/tutor/students/${record.id}`),
            style: { cursor: "pointer" },
          })}
          columns={[
            { title: "DNI", dataIndex: "dni" },
            { title: "Nombres", dataIndex: "firstName" },
            { title: "Apellidos", dataIndex: "lastName" },
            { title: "Carrera", dataIndex: "career" },
            { title: "Proyecto", dataIndex: "thesisProject", render: (v) => v ?? "-" },
            { title: "Corte", dataIndex: "corte" },
            { title: "Sección", dataIndex: "section" },
            { title: "Estado", dataIndex: "status", render: (v) => <Tag>{v}</Tag> },
          ]}
        />
        <div style={{ marginTop: 8, color: "#666" }}>
          Tip: haz click en una fila para abrir el detalle.
        </div>
      </Card>
    </div>
  );
}
