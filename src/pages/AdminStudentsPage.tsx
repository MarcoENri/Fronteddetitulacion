import {
  Badge,
  Button,
  Card,
  Col,
  Row,
  Space,
  Typography,
  Upload,
  message,
  Popover,
  Empty,
} from "antd";
import type { UploadProps } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogoutOutlined,
  ReloadOutlined,
  CloudUploadOutlined,
  UserAddOutlined,
  GroupOutlined,
  BellOutlined,
} from "@ant-design/icons";

import { importStudentsXlsx, listStudents } from "../services/adminStudentService";
import type { AdminStudentRow } from "../services/adminStudentService";
import { logout } from "../services/authService";

import AssignCareerModal from "../components/AssignCareerModal";
import CreateUserModal from "../components/CreateUserModal";

import softwareImg from "../assets/imagenes/Desarrollo de Software.png";
import disenoImg from "../assets/imagenes/Diseno-Grafico.png";
import gastronomiaImg from "../assets/imagenes/Gastronomia.png";
import marketingImg from "../assets/imagenes/Marketing Digital y Negocios.png";
import talentoImg from "../assets/imagenes/Talento Humano.png"; 
import turismoImg from "../assets/imagenes/Turismo.png";
import enfermeriaImg from "../assets/imagenes/Enfermeria.png";

const { Title, Text } = Typography;

const VERDE_INSTITUCIONAL = "#008B8B";

type CareerKey =
  | "Desarrollo de software"
  | "Diseño gráfico"
  | "Gastronomía"
  | "Marketing digital y negocios"
  | "Turismo"
  | "Talento humano"
  | "Enfermería"
  | "Electricidad"
  | "Contabilidad y asesoría tributaria"
  | "Redes y Telecomunicaciones";

const CAREERS: { key: CareerKey; label: string; cover?: string; color: string; imgPos?: string }[] = [
  { key: "Desarrollo de software", label: "DESARROLLO DE SOFTWARE", cover: softwareImg, color: "#6a1b9a", imgPos: "center 25%" },
  { key: "Diseño gráfico", label: "DISEÑO GRÁFICO", cover: disenoImg, color: "#00acc1", imgPos: "center 30%" },
  { key: "Gastronomía", label: "GASTRONOMÍA", cover: gastronomiaImg, color: "#2e7d32", imgPos: "center 25%" },
  { key: "Marketing digital y negocios", label: "MARKETING DIGITAL", cover: marketingImg, color: "#ef6c00", imgPos: "center 25%" },
  { key: "Turismo", label: "TURISMO", cover: turismoImg, color: "#9e9d24", imgPos: "center 28%" },
  { key: "Talento humano", label: "TALENTO HUMANO", cover: talentoImg, color: "#1565c0", imgPos: "center 25%" },
  { key: "Enfermería", label: "ENFERMERÍA", cover: enfermeriaImg, color: "#26a69a", imgPos: "center 35%" },
  { key: "Electricidad", label: "ELECTRICIDAD", color: "#f9a825", imgPos: "center center" },
  { key: "Contabilidad y asesoría tributaria", label: "CONTABILIDAD", color: "#c62828", imgPos: "center center" },
  { key: "Redes y Telecomunicaciones", label: "REDES Y TELECOM.", color: "#37474f", imgPos: "center center" },
];

function normalizeCareer(v?: string): CareerKey | "Sin carrera" {
  const x = (v ?? "").toLowerCase();
  if (x.includes("software")) return "Desarrollo de software";
  if (x.includes("graf")) return "Diseño gráfico";
  if (x.includes("gastr")) return "Gastronomía";
  if (x.includes("marketing")) return "Marketing digital y negocios";
  if (x.includes("turismo")) return "Turismo";
  if (x.includes("talento")) return "Talento humano";
  if (x.includes("enfer")) return "Enfermería";
  if (x.includes("electr")) return "Electricidad";
  if (x.includes("contab") || x.includes("tribut")) return "Contabilidad y asesoría tributaria";
  if (x.includes("redes") || x.includes("telecom")) return "Redes y Telecomunicaciones";
  return "Sin carrera";
}

export default function AdminStudentsPage() {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [rows, setRows] = useState<AdminStudentRow[]>([]);
  const nav = useNavigate();

  const [openAssignCareer, setOpenAssignCareer] = useState(false);
  const [openCreateUser, setOpenCreateUser] = useState(false);
  const [notifications] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listStudents();
      setRows(data);
    } catch (e: any) {
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        logout(); nav("/");
      } else { message.error("No se pudo cargar la información"); }
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const uploadProps: UploadProps = {
    accept: ".xlsx",
    maxCount: 1,
    beforeUpload: async (file) => {
      setImporting(true);
      try {
        await importStudentsXlsx(file as File);
        message.success(`Listado oficial cargado correctamente`);
        await load();
      } catch (e: any) { message.error("Error al procesar el archivo"); }
      finally { setImporting(false); }
      return false;
    },
  };

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => {
      const c = normalizeCareer(r.career);
      if (c !== "Sin carrera") map.set(c, (map.get(c) ?? 0) + 1);
    });
    return map;
  }, [rows]);

  const buttonHeaderStyle = {
    borderRadius: "20px",
    fontWeight: 600,
    border: "none",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "#f4f7f6" }}>
      
      {/* CSS ADICIONAL SOLO PARA MÓVIL (NO AFECTA A LA MAC) */}
      <style>{`
        @media (max-width: 768px) {
          .header-main { padding: 10px 15px !important; }
          .header-title { font-size: 14px !important; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .btn-text { display: none !important; } /* Oculta texto de botones en móvil */
          .main-container { padding: 15px 10px !important; }
          .career-card-box { width: 145px !important; height: 210px !important; border-radius: 18px !important; }
          .career-col-wrapper { width: 155px !important; }
        }
      `}</style>

      {/* HEADER PRINCIPAL */}
      <div className="header-main" style={{ backgroundColor: VERDE_INSTITUCIONAL, padding: "10px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "4px solid #fff", position: 'sticky', top: 0, zIndex: 100 }}>
        <Title level={4} className="header-title" style={{ margin: 0, color: "#fff", fontWeight: 700 }}>Administración · Seguimiento de Titulación</Title>
        <Space>
          <Popover 
            content={<Empty description="No hay notificaciones" image={Empty.PRESENTED_IMAGE_SIMPLE} />} 
            title="Notificaciones" 
            trigger="click" 
            placement="bottomRight"
          >
            <Badge count={notifications.length} size="small" offset={[-2, 5]}>
              <Button type="text" icon={<BellOutlined style={{ fontSize: "20px", color: "white" }} />} />
            </Badge>
          </Popover>

          <Button icon={<GroupOutlined />} onClick={() => setOpenAssignCareer(true)} style={buttonHeaderStyle}>
            <span className="btn-text">Asignación masiva</span>
          </Button>
          <Button type="primary" icon={<UserAddOutlined />} onClick={() => setOpenCreateUser(true)} style={{ ...buttonHeaderStyle, backgroundColor: "#fff", color: VERDE_INSTITUCIONAL }}>
            <span className="btn-text">Crear usuario</span>
          </Button>
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading} style={buttonHeaderStyle} />
          <Button danger icon={<LogoutOutlined />} onClick={() => { logout(); nav("/"); }} style={{ ...buttonHeaderStyle, backgroundColor: "#fff", color: "#ff4d4f" }}>
            <span className="btn-text">Cerrar sesión</span>
          </Button>
        </Space>
      </div>

      <div className="main-container" style={{ flex: 1, padding: "30px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: "100%", maxWidth: "1050px" }}> 
          
          <Card style={{ marginBottom: 25, borderRadius: "15px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", border: "none" }}>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Text strong style={{ color: "#555", fontSize: "14px", letterSpacing: "0.5px" }}>LISTADO OFICIAL DE TITULADOS</Text>
              <Upload {...uploadProps}>
                <Button 
                  type="primary" 
                  icon={<CloudUploadOutlined />} 
                  loading={importing} 
                  style={{ borderRadius: "8px", height: "40px", backgroundColor: VERDE_INSTITUCIONAL, fontWeight: 600, padding: "0 20px" }}
                >
                  Subir lista de estudiantes titulados
                </Button>
              </Upload>
            </Space>
          </Card>

          <Card 
            style={{ 
              borderRadius: "20px", 
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
              border: "none",
              borderLeft: `8px solid ${VERDE_INSTITUCIONAL}`
            }}
          >
            <div style={{ marginBottom: "25px", padding: "10px 10px", borderBottom: "1px solid #f0f0f0" }}>
              <Title level={4} style={{ color: VERDE_INSTITUCIONAL, margin: 0 }}>Listado de Estudiantes por Carrera</Title>
              <Text style={{ fontSize: "14px", color: "#888", fontWeight: 500 }}>
                Periodo Titulación: Septiembre 2025 - Febrero 2026
              </Text>
            </div>

            <div style={{ padding: "0 5px 15px 5px" }}>
              <Row gutter={[12, 24]} justify="center">
                {CAREERS.map((c) => (
                  <Col 
                    key={c.key} 
                    className="career-col-wrapper"
                    style={{ width: "190px", display: 'flex', justifyContent: 'center' }}
                  >
                    <div
                      className="career-card-box"
                      onClick={() => nav(`/admin/students/career/${encodeURIComponent(c.key)}`)}
                      style={{
                        width: "175px", 
                        height: "260px",
                        borderRadius: "24px", 
                        overflow: "hidden",
                        cursor: "pointer",
                        position: "relative",
                        backgroundColor: c.color,
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        border: "3px solid #fff"
                      }}
                      onMouseEnter={(e) => {
                        if (window.innerWidth > 768) {
                          e.currentTarget.style.transform = "translateY(-8px)";
                          e.currentTarget.style.boxShadow = `0 12px 24px rgba(0,0,0,0.2)`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (window.innerWidth > 768) {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                        }
                      }}
                    >
                      {c.cover && (
                        <div style={{
                          position: "absolute",
                          inset: 0,
                          backgroundImage: `url('${c.cover}')`,
                          backgroundSize: "cover", 
                          backgroundPosition: c.imgPos || "center center",
                          backgroundRepeat: "no-repeat",
                          opacity: 0.85
                        }} />
                      )}

                      <div style={{ 
                        position: "absolute", 
                        inset: 0, 
                        backgroundColor: c.color, 
                        mixBlendMode: "multiply", 
                        opacity: 0.6 
                      }} />

                      <div style={{ 
                        position: "absolute", 
                        inset: 0, 
                        background: "linear-gradient(to top, rgba(0,0,0,0.2) 0%, transparent 40%)" 
                      }} />
                      
                      <div style={{ position: "absolute", top: 12, right: 12 }}>
                        <Badge 
                          count={counts.get(c.key) ?? 0} 
                          showZero 
                          style={{ backgroundColor: "#fff", color: c.color, fontWeight: "900", border: "none", boxShadow: "0 2px 5px rgba(0,0,0,0.2)" }} 
                        />
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          </Card>
        </div>
      </div>

      <div style={{ backgroundColor: VERDE_INSTITUCIONAL, padding: "15px", textAlign: "center", borderTop: "4px solid #fff" }}>
        <Text style={{ color: "#fff", fontSize: "12px", fontWeight: 600, letterSpacing: "0.5px" }}>
          © 2026 INSTITUTO SUPERIOR TECNOLÓGICO SUDAMERICANO · SISTEMA DE TITULACIÓN
        </Text>
      </div>

      <AssignCareerModal open={openAssignCareer} onClose={() => setOpenAssignCareer(false)} onSuccess={load} />
      <CreateUserModal open={openCreateUser} onClose={() => setOpenCreateUser(false)} onSuccess={() => message.success("Usuario creado")} />
    </div>
  );
}