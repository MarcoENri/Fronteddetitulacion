import { Card, Table, Tag, Button, Space, message } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/authService";
import type { CoordinatorStudentRow } from "../services/coordinatorService";
import { listCoordinatorStudents } from "../services/coordinatorService";

export default function CoordinatorStudentsPage() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<CoordinatorStudentRow[]>([]);
  const nav = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const data: any = await listCoordinatorStudents();

      // ✅ Antd Table necesita SIEMPRE un array
      // soporta respuestas tipo: []  ó {data: []}
      const list: CoordinatorStudentRow[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];

      setRows(list);
    } catch (e: any) {
      console.error("ERROR listCoordinatorStudents:", e?.response?.data ?? e);

      message.error(
        e?.response?.data?.message ??
          "No se pudo cargar estudiantes (COORDINATOR)"
      );

      if (e?.response?.status === 401 || e?.response?.status === 403) {
        logout();
        nav("/");
      } else {
        setRows([]); // ✅ evita que quede undefined
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
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <h2 style={{ margin: 0 }}>Coordinador · Mis estudiantes</h2>
        <Space>
          <Button onClick={load} loading={loading}>
            Refrescar
          </Button>
          <Button
            danger
            onClick={() => {
              logout();
              nav("/");
            }}
          >
            Cerrar sesión
          </Button>
        </Space>
      </Space>

      <Card title="Listado">
        <Table<CoordinatorStudentRow>
          rowKey="id"
          loading={loading}
          dataSource={Array.isArray(rows) ? rows : []} // ✅ blindaje final
          pagination={{ pageSize: 10 }}
          onRow={(record) => ({
            onClick: () => nav(`/coordinator/students/${record.id}`),
            style: { cursor: "pointer" },
          })}
          columns={[
            { title: "DNI", dataIndex: "dni" },
            { title: "Nombres", dataIndex: "firstName" },
            { title: "Apellidos", dataIndex: "lastName" },
            { title: "Carrera", dataIndex: "career" },
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
