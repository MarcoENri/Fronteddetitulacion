import {
  Card,
  Descriptions,
  Table,
  Tabs,
  Button,
  message,
  Space,
  Typography,
  Tag,
} from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/api";
import { 
  ArrowLeftOutlined, 
  MailOutlined, 
  ReloadOutlined, 
  LogoutOutlined 
} from "@ant-design/icons";
import { logout } from "../services/authService";

// Componente de modal para correos
import SendEmailModal from "../components/SendEmailModal";

const { Title, Text } = Typography;
const VERDE_INSTITUCIONAL = "#008B8B";

/* ===================== TIPOS DE DATOS ===================== */
type IncidentDto = {
  id: number;
  stage: string;
  date: string;
  reason: string;
  action: string;
  createdAt: string;
};

type ObservationDto = {
  id: number;
  author: string;
  text: string;
  createdAt: string;
};

type StudentDetailDto = {
  id: number;
  dni: string;
  firstName: string;
  lastName: string;
  email: string;
  corte: string;
  section: string;
  modality?: string | null;
  career: string;
  titulationType: string;
  status: string;
  incidentCount: number;
  observationCount: number;
  incidents: IncidentDto[];
  observations: ObservationDto[];
};

export default function StudentDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState<StudentDetailDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  /* LÓGICA DE CARGA MEJORADA */
  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get<StudentDetailDto>(`/admin/students/${id}`);
      console.log("DATOS RECIBIDOS:", res.data);
      
      // Aseguramos que incidents y observations sean siempre arrays, aunque vengan null
      const formattedData = {
        ...res.data,
        incidents: res.data.incidents || [],
        observations: res.data.observations || []
      };
      
      setData(formattedData);
    } catch (e: any) {
      console.error("Error al cargar:", e);
      message.error(e?.response?.data?.message ?? "No se pudo cargar el detalle del alumno");
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        logout();
        nav("/");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "#f4f7f6" }}>
      
      {/* 1. HEADER SUPERIOR */}
      <div style={{ backgroundColor: VERDE_INSTITUCIONAL, padding: "10px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "4px solid #fff" }}>
        <Title level={4} style={{ margin: 0, color: "#fff", fontWeight: 700 }}>Panel Administrativo · Historial Académico</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading} style={{ borderRadius: "20px" }} />
          <Button 
            icon={<LogoutOutlined />} 
            onClick={() => { logout(); nav("/"); }} 
            style={{ borderRadius: "20px", fontWeight: 600, backgroundColor: "#fff", color: "#ff4d4f", border: "none" }}
          >
            Salir
          </Button>
        </Space>
      </div>

      <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        
        <div style={{ width: "100%", maxWidth: "950px" }}>
          
          {/* 2. BOTONES DE ACCIÓN */}
          <Card 
            style={{ marginBottom: 15, borderRadius: "15px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", border: "none" }}
            bodyStyle={{ padding: "12px 20px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={() => nav(-1)}
                style={{ borderRadius: "8px", fontWeight: 600, color: VERDE_INSTITUCIONAL, borderColor: VERDE_INSTITUCIONAL }}
              >
                Volver al listado
              </Button>
              <Button 
                type="primary"
                icon={<MailOutlined />}
                onClick={() => setEmailOpen(true)}
                disabled={!data}
                style={{ backgroundColor: VERDE_INSTITUCIONAL, borderRadius: "8px", fontWeight: 600 }}
              >
                Notificar al Estudiante
              </Button>
            </div>
          </Card>

          {/* 3. CONTENIDO PRINCIPAL */}
          <Card 
            loading={loading}
            style={{ borderRadius: "20px", boxShadow: "0 10px 25px rgba(0,0,0,0.08)", border: "none", overflow: "hidden" }}
            bodyStyle={{ padding: "0" }}
          >
            {data && (
              <>
                <div style={{ backgroundColor: VERDE_INSTITUCIONAL, padding: "12px 25px", color: "white" }}>
                  <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: "10px", fontWeight: 700, letterSpacing: "1px" }}>
                    DETALLES DEL ALUMNO
                  </Text>
                  <Title level={4} style={{ color: "white", margin: 0 }}>
                    {data.firstName} {data.lastName}
                  </Title>
                </div>

                <div style={{ padding: "25px" }}>
                  <Descriptions 
                    bordered 
                    size="small" 
                    column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
                    labelStyle={{ backgroundColor: "#fafafa", fontWeight: 700, color: VERDE_INSTITUCIONAL, width: "180px" }}
                  >
                    <Descriptions.Item label="DNI">{data.dni}</Descriptions.Item>
                    <Descriptions.Item label="Correo">{data.email}</Descriptions.Item>
                    <Descriptions.Item label="Carrera">{data.career}</Descriptions.Item>
                    <Descriptions.Item label="Periodo">{data.corte}</Descriptions.Item>
                    <Descriptions.Item label="Sección">{data.section || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label="Modalidad">{data.modality || "PRESENCIAL"}</Descriptions.Item>
                    <Descriptions.Item label="Titulación">{data.titulationType || "No asignada"}</Descriptions.Item>
                    <Descriptions.Item label="Estado"><Tag color="processing">{data.status}</Tag></Descriptions.Item>
                    <Descriptions.Item label="Incidencias totales">{data.incidents.length}</Descriptions.Item>
                    <Descriptions.Item label="Total de observaciones">{data.observations.length}</Descriptions.Item>
                  </Descriptions>

                  <Tabs
                    style={{ marginTop: 20 }}
                    items={[
                      {
                        key: "inc",
                        label: `Incidencias (${data.incidents.length})`,
                        children: (
                          <Table
                            rowKey="id"
                            dataSource={data.incidents}
                            pagination={{ pageSize: 5 }}
                            size="small"
                            columns={[
                              { title: "Etapa", dataIndex: "stage", key: "stage" },
                              { title: "Fecha", dataIndex: "date", key: "date" },
                              { title: "Motivo", dataIndex: "reason", key: "reason" },
                              { title: "Acción", dataIndex: "action", key: "action" },
                              { title: "Creado", dataIndex: "createdAt", key: "createdAt" },
                            ]}
                            locale={{ emptyText: "No hay incidencias registradas" }}
                          />
                        ),
                      },
                      {
                        key: "obs",
                        label: `Observaciones (${data.observations.length})`,
                        children: (
                          <Table
                            rowKey="id"
                            dataSource={data.observations}
                            pagination={{ pageSize: 5 }}
                            size="small"
                            columns={[
                              { title: "Autor", dataIndex: "author", key: "author" },
                              { title: "Observación", dataIndex: "text", key: "text" },
                              { title: "Fecha", dataIndex: "createdAt", key: "createdAt" },
                            ]}
                            locale={{ emptyText: "No hay observaciones registradas" }}
                          />
                        ),
                      },
                    ]}
                  />
                </div>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* 4. FOOTER */}
      <div style={{ backgroundColor: VERDE_INSTITUCIONAL, padding: "12px", textAlign: "center", borderTop: "4px solid #fff" }}>
        <Text style={{ color: "#fff", fontSize: "11px", fontWeight: 600 }}>
          © 2026 INSTITUTO SUPERIOR TECNOLÓGICO SUDAMERICANO — SISTEMA DE CONTROL
        </Text>
      </div>

      <SendEmailModal
        open={emailOpen}
        studentId={data?.id || 0}
        studentEmail={data?.email || ""}
        onClose={() => setEmailOpen(false)}
      />
    </div>
  );
}