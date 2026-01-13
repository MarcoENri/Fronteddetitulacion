import { 
  Card, 
  Table, 
  Tag, 
  Button, 
  Space, 
  message, 
  Typography, 
  Badge, 
  Popover, 
  Empty 
} from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/authService";
import type { CoordinatorStudentRow } from "../services/coordinatorService";
import { listCoordinatorStudents } from "../services/coordinatorService";
import { 
  ReloadOutlined, 
  LogoutOutlined, 
  BellOutlined 
} from "@ant-design/icons";

const { Title, Text } = Typography;
const VERDE_INSTITUCIONAL = "#008B8B";

export default function CoordinatorStudentsPage() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<CoordinatorStudentRow[]>([]);
  const nav = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const data = await listCoordinatorStudents();
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error("ERROR listCoordinatorStudents:", e?.response?.data ?? e);
      message.error(e?.response?.data?.message ?? "No se pudo cargar estudiantes");

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

  const headerButtonStyle = {
    backgroundColor: "#fff",
    color: VERDE_INSTITUCIONAL,
    fontWeight: "bold" as const,
    border: "none",
    borderRadius: "20px",
    height: "32px", // Botones más pequeños
    padding: "0 15px"
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f0f2f5", display: "flex", flexDirection: "column" }}>
      
      <style>{`
        /* Header Adaptable */
        .coord-header { padding: 0 40px !important; }
        .coord-title { font-size: 18px !important; }

        /* Estilo para reducir el alto de las filas (Compacto) */
        .custom-table .ant-table-thead > tr > th { 
          background-color: ${VERDE_INSTITUCIONAL} !important; 
          color: white !important; 
          padding: 8px 12px !important; /* Encabezado más delgado */
          text-align: center; 
          border: 1px solid white !important;
          font-size: 13px;
        }

        .custom-table .ant-table-tbody > tr > td { 
          padding: 6px 12px !important; /* Celdas más delgadas */
          background: white !important; 
          border-bottom: 1px solid #f0f0f0 !important;
          font-size: 13px;
        }

        /* Quitar espacios innecesarios */
        .ant-card-head { min-height: 40px !important; padding: 0 16px !important; }
        .ant-card-head-title { padding: 8px 0 !important; }

        @media (max-width: 768px) {
           .coord-header { padding: 0 15px !important; }
           .btn-text-hide { display: none; }
           .main-content { padding: 10px !important; }
        }
      `}</style>

      {/* HEADER INSTITUCIONAL */}
      <div className="coord-header" style={{ 
        backgroundColor: VERDE_INSTITUCIONAL, 
        height: "56px", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        flexShrink: 0
      }}>
        <Title level={4} className="coord-title" style={{ margin: 0, color: "#fff" }}>Mis estudiantes</Title>
        
        <Space size="middle">
          <Badge count={0} size="small">
            <Button type="text" icon={<BellOutlined style={{ fontSize: "18px", color: "white" }} />} />
          </Badge>

          <Button icon={<ReloadOutlined />} onClick={load} loading={loading} style={headerButtonStyle}>
            <span className="btn-text-hide">Refrescar</span>
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
            <span className="btn-text-hide">Salir</span>
          </Button>
        </Space>
      </div>

      {/* CONTENIDO CENTRALIZADO */}
      <div className="main-content" style={{ 
        padding: "20px 40px", 
        flex: 1, 
        display: "flex", 
        justifyContent: "center" // Centraliza el contenido
      }}>
        <div style={{ width: "100%", maxWidth: "1200px" }}> {/* Limita el ancho máximo */}
          <Card 
            style={{ borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}
            title={<Title level={5} style={{ margin: 0, color: VERDE_INSTITUCIONAL }}>Listado General</Title>}
          >
            <Table<CoordinatorStudentRow>
              className="custom-table"
              rowKey="id"
              size="small" // Hace la tabla más compacta automáticamente
              loading={loading}
              dataSource={Array.isArray(rows) ? rows : []}
              pagination={{ pageSize: 12, showSizeChanger: false, size: "small" }}
              scroll={{ x: 'max-content' }}
              onRow={(record) => ({
                onClick: () => nav(`/coordinator/students/${record.id}`),
                style: { cursor: "pointer" },
              })}
              columns={[
                { title: "DNI", dataIndex: "dni", key: "dni", width: 100 },
                { title: "Nombres", dataIndex: "firstName", key: "firstName" },
                { title: "Apellidos", dataIndex: "lastName", key: "lastName" },
                { title: "Carrera", dataIndex: "career", key: "career" },
                { title: "Corte", dataIndex: "corte", key: "corte", align: "center" as const },
                { title: "Sección", dataIndex: "section", key: "section", align: "center" as const },
                { 
                  title: "Estado", 
                  dataIndex: "status", 
                  key: "status",
                  align: "center" as const,
                  render: (v) => (
                    <Tag color={v === "EN_CURSO" ? "processing" : v === "REPROBADO" ? "error" : "success"} style={{ borderRadius: "10px", fontSize: "11px" }}>
                      {v}
                    </Tag>
                  ) 
                },
              ]}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}