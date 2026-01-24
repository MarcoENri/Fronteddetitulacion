import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  message,
  Typography,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/authService";
import type { TutorStudentRow } from "../services/tutorService";
import { listTutorStudents } from "../services/tutorService";
import { ReloadOutlined, LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { useActivePeriod } from "../hooks/useActivePeriod"; // ✅ Importado

const { Title, Text } = Typography;
const VERDE_INSTITUCIONAL = "#008B8B";

export default function TutorStudentsPage() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<TutorStudentRow[]>([]);
  const nav = useNavigate();
  
  // ✅ Hook de periodo activo
  const ap = useActivePeriod();

  const headerButtonStyle = useMemo(
    () => ({
      backgroundColor: "#fff",
      color: VERDE_INSTITUCIONAL,
      fontWeight: "bold" as const,
      border: "none",
      borderRadius: "20px",
    }),
    []
  );

  const load = async () => {
    // ✅ Si no hay periodId, no hacemos la petición
    if (!ap.periodId) return;

    setLoading(true);
    try {
      const data = await listTutorStudents(ap.periodId);
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error("ERROR listTutorStudents:", e?.response?.data ?? e);
      message.error(
        e?.response?.data?.message ?? "No se pudo cargar estudiantes (TUTOR)"
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ap.periodId]); // ✅ Depende del periodo del hook

  // ✅ Manejo de estados de carga y error del periodo
  if (ap.loading) return null; 

  if (ap.error) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Card>
          <Title level={4}>Tutor</Title>
          <Text type="danger">{ap.error}</Text>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f0f2f5" }}>
      <style>{`
        .tutor-table .ant-table { background: transparent !important; border-collapse: separate !important; border-spacing: 0 8px !important; }
        .tutor-table .ant-table-thead > tr > th { background-color: ${VERDE_INSTITUCIONAL} !important; color: white !important; text-align: center; border: 1px solid white !important; white-space: nowrap; }
        .tutor-table .ant-table-thead > tr > th:first-child { border-radius: 8px 0 0 8px; }
        .tutor-table .ant-table-thead > tr > th:last-child { border-radius: 0 8px 8px 0; }
        .tutor-table .ant-table-tbody > tr > td { background: white !important; border-top: 1px solid ${VERDE_INSTITUCIONAL} !important; border-bottom: 1px solid ${VERDE_INSTITUCIONAL} !important; white-space: nowrap; }
        .tutor-table .ant-table-tbody > tr > td:first-child { border-left: 1px solid ${VERDE_INSTITUCIONAL} !important; border-radius: 8px 0 0 8px; }
        .tutor-table .ant-table-tbody > tr > td:last-child { border-right: 1px solid ${VERDE_INSTITUCIONAL} !important; border-radius: 0 8px 8px 0; }
        .tutor-table .ant-table-row:hover > td { background: #f0ffff !important; }

        .tutor-header {
          background-color: ${VERDE_INSTITUCIONAL};
          padding: 10px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        @media (max-width: 576px) {
          .tutor-header { justify-content: center; padding: 15px; }
          .header-title { font-size: 16px !important; text-align: center; width: 100%; }
        }
      `}</style>

      <div className="tutor-header">
        <Space>
          <UserOutlined style={{ color: "#fff", fontSize: "24px" }} />
          <Title level={4} className="header-title" style={{ margin: 0, color: "#fff" }}>
            Tutor · Mis estudiantes
          </Title>
        </Space>

        <Space wrap style={{ justifyContent: "center" }}>
          {/* ✅ Periodo mostrado como información fija (ya no es un input editable) */}
          <Text style={{ color: "#fff", fontWeight: 600 }}>
            Período Activo: {ap.periodId}
          </Text>

          <Button
            icon={<ReloadOutlined />}
            onClick={load}
            loading={loading}
            style={headerButtonStyle}
          >
            Refrescar
          </Button>

          <Button
            danger
            icon={<LogoutOutlined />}
            style={{ ...headerButtonStyle, color: "#ff4d4f" }}
            onClick={() => {
              logout();
              nav("/");
            }}
          >
            Cerrar sesión
          </Button>
        </Space>
      </div>

      <div style={{ padding: "clamp(12px, 3vw, 24px)", maxWidth: 1300, margin: "0 auto" }}>
        <Card
          style={{ borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
          title={
            <Title level={5} style={{ margin: 0, color: VERDE_INSTITUCIONAL }}>
              Estudiantes Asignados
            </Title>
          }
        >
          <Table<TutorStudentRow>
            className="tutor-table"
            rowKey="id"
            loading={loading}
            dataSource={rows}
            scroll={{ x: "max-content" }}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            onRow={(record) => ({
              onClick: () => nav(`/tutor/students/${record.id}?periodId=${ap.periodId}`),
              style: { cursor: "pointer" },
            })}
            columns={[
              { title: "DNI", dataIndex: "dni", key: "dni" },
              { title: "Nombres", dataIndex: "firstName", key: "firstName" },
              { title: "Apellidos", dataIndex: "lastName", key: "lastName" },
              { title: "Carrera", dataIndex: "career", key: "career" },
              {
                title: "Proyecto",
                dataIndex: "thesisProject",
                key: "project",
                render: (v) => v || <Text type="secondary">-</Text>,
              },
              { title: "Corte", dataIndex: "corte", key: "corte" },
              { title: "Sección", dataIndex: "section", key: "section" },
              {
                title: "Estado",
                dataIndex: "status",
                key: "status",
                render: (v) => (
                  <Tag color="blue" style={{ borderRadius: "10px" }}>{v}</Tag>
                ),
              },
            ]}
          />

          <div style={{ marginTop: 12, textAlign: "center" }}>
            <Text type="secondary" italic>
              Haz click en un estudiante para gestionar sus incidencias y observaciones.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}