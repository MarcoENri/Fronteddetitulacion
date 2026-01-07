import { Card, Table, Tag, Button, Space, message } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/authService";
import type { CoordinatorStudentRow } from "../services/coordinatorService";
import { listCoordinatorStudents } from "../services/coordinatorService";
import AssignTutorBulkModal from "../components/AssignTutorBulkModal";
import type { Key } from "react";

export default function CoordinatorStudentsPage() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<CoordinatorStudentRow[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [openBulk, setOpenBulk] = useState(false);

  const nav = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const data = await listCoordinatorStudents();
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error("ERROR listCoordinatorStudents:", e?.response?.data ?? e);

      message.error(
        e?.response?.data?.message ?? "No se pudo cargar estudiantes (COORDINATOR)"
      );

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

  const selectedIds = selectedRowKeys
    .map((k) => Number(k))
    .filter((n) => Number.isFinite(n));

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
          <Button onClick={() => setOpenBulk(true)} disabled={selectedIds.length === 0}>
            Asignar tutor/proyecto ({selectedIds.length})
          </Button>

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
          dataSource={rows}
          pagination={{ pageSize: 10 }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          onRow={(record) => ({
            onDoubleClick: () => nav(`/coordinator/students/${record.id}`),
            style: { cursor: "pointer" },
          })}
          columns={[
            { title: "DNI", dataIndex: "dni" },
            { title: "Nombres", dataIndex: "firstName" },
            { title: "Apellidos", dataIndex: "lastName" },
            { title: "Carrera", dataIndex: "career" },
            { title: "Corte", dataIndex: "corte" },
            { title: "Sección", dataIndex: "section" },
            {
              title: "Estado",
              dataIndex: "status",
              render: (v) => <Tag>{v}</Tag>,
            },
          ]}
        />

        <div style={{ marginTop: 8, color: "#666" }}>
          Tip: selecciona varios con el checkbox. Doble click abre detalle.
        </div>
      </Card>

      <AssignTutorBulkModal
        open={openBulk}
        studentIds={selectedIds}
        onClose={() => setOpenBulk(false)}
        onSuccess={() => {
          setSelectedRowKeys([]);
          load();
        }}
      />
    </div>
  );
}
