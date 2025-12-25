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
} from "antd";
import type { UploadProps } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogoutOutlined, ReloadOutlined, UploadOutlined } from "@ant-design/icons";

import { importStudentsXlsx, listStudents } from "../services/adminStudentService";
import type { AdminStudentRow } from "../services/adminStudentService";
import { logout } from "../services/authService";

// 📸 Imágenes
import softwareImg from "../assets/imagenes/Desarrollo de Software.png";
import disenoImg from "../assets/imagenes/Diseño Grafico.png";
import gastronomiaImg from "../assets/imagenes/Gastronomia.png";
import marketingImg from "../assets/imagenes/Marketing Digital y Negocios.png";
import talentoImg from "../assets/imagenes/Talento Humano.png";
import turismoImg from "../assets/imagenes/Turismo.png";
import enfermeriaImg from "../assets/imagenes/Enfermeria.png";

const { Title, Text } = Typography;

/* ===================== TIPOS ===================== */

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

type CareerCard = {
  key: CareerKey;
  label: string;
  cover?: string;
  fallbackGradient?: string;
};

/* ===================== CARRERAS ===================== */

const CAREERS: CareerCard[] = [
  { key: "Desarrollo de software", label: "DESARROLLO\nDE SOFTWARE", cover: softwareImg },
  { key: "Diseño gráfico", label: "DISEÑO\nGRÁFICO", cover: disenoImg },
  { key: "Gastronomía", label: "GASTRONOMÍA", cover: gastronomiaImg },
  { key: "Marketing digital y negocios", label: "MARKETING\nDIGITAL\nY NEGOCIOS", cover: marketingImg },
  { key: "Turismo", label: "TURISMO", cover: turismoImg },
  { key: "Talento humano", label: "TALENTO\nHUMANO", cover: talentoImg },
  { key: "Enfermería", label: "ENFERMERÍA", cover: enfermeriaImg },
  {
    key: "Electricidad",
    label: "ELECTRICIDAD",
    fallbackGradient: "linear-gradient(135deg, #0b7f7a, #5fc0c0)",
  },
  {
    key: "Contabilidad y asesoría tributaria",
    label: "CONTABILIDAD\nY ASESORÍA\nTRIBUTARIA",
    fallbackGradient: "linear-gradient(135deg, #0a6e6a, #7dd8cf)",
  },
  {
    key: "Redes y Telecomunicaciones",
    label: "REDES Y\nTELECOMUNICACIONES",
    fallbackGradient: "linear-gradient(135deg, #075e5a, #78c8dc)",
  },
];

/* ===================== NORMALIZADOR ===================== */

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

/* ===================== COMPONENTE ===================== */

export default function AdminStudentsPage() {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [rows, setRows] = useState<AdminStudentRow[]>([]);
  const nav = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      setRows(await listStudents());
    } catch {
      message.error("No se pudo cargar estudiantes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const uploadProps: UploadProps = {
    accept: ".xlsx",
    beforeUpload: async (file) => {
      setImporting(true);
      try {
        await importStudentsXlsx(file as File);
        await load();
        message.success("Importación correcta");
      } catch {
        message.error("Error al importar Excel");
      } finally {
        setImporting(false);
      }
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

  return (
    <div style={{ padding: 20 }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        {/* HEADER SUPERIOR (solo admin) */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <Title level={3} style={{ margin: 0, color: "#0b7f7a" }}>
            Administración · Estudiantes
          </Title>

          <Space>
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading} />
            <Button danger icon={<LogoutOutlined />} onClick={() => { logout(); nav("/"); }}>
              Cerrar sesión
            </Button>
          </Space>
        </div>

        {/* EXCEL */}
        <Card style={{ marginBottom: 14, borderRadius: 14 }}>
          <Upload {...uploadProps}>
            <Button type="primary" icon={<UploadOutlined />} loading={importing}>
              Subir Excel
            </Button>
          </Upload>
        </Card>

        {/* CARD DE CARRERAS */}
        <Card style={{ borderRadius: 16 }}>
          {/* ✅ AQUÍ VA EL TEXTO (COMO PEDISTE) */}
          <Title level={4} style={{ margin: "0 0 4px 0", color: "#0b7f7a" }}>
            Sistema · Lista de estudiantes de titulación
          </Title>

          <Text
            style={{
              display: "block",
              marginBottom: 16,
              fontWeight: 600,
              color: "#0b7f7a",
            }}
          >
            Corte · Septiembre 2025 – Febrero 2026
          </Text>

          {/* GRID 5x2 */}
          <Row gutter={[18, 18]} justify="center">
            {CAREERS.map((c) => (
              <Col key={c.key} flex="20%">
                <div
                  onClick={() => nav(`/admin/students/career/${encodeURIComponent(c.key)}`)}
                  style={{
                    height: 260,
                    borderRadius: 18,
                    overflow: "hidden",
                    cursor: "pointer",
                    position: "relative",
                    backgroundImage: c.cover ? `url('${c.cover}')` : c.fallbackGradient,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    backgroundSize: c.cover ? "contain" : "cover",
                    boxShadow: "0 8px 22px rgba(0,0,0,.14)",
                    transition: "transform .18s ease, box-shadow .18s ease",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.transform = "scale(1.02)";
                    el.style.boxShadow = "0 14px 30px rgba(0,0,0,.22)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.transform = "none";
                    el.style.boxShadow = "0 8px 22px rgba(0,0,0,.14)";
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(180deg, rgba(0,0,0,.08), rgba(0,0,0,.55))",
                    }}
                  />

                  <div
                    style={{
                      position: "absolute",
                      bottom: 12,
                      left: 12,
                      right: 12,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-end",
                      color: "#fff",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 900,
                        whiteSpace: "pre-line",
                        maxWidth: 140,
                        textTransform: "uppercase",
                        textShadow: "0 2px 14px rgba(0,0,0,.45)",
                      }}
                    >
                      {c.label}
                    </div>

                    <Badge
                      count={counts.get(c.key) ?? 0}
                      showZero
                      style={{ background: "#0b7f7a" }}
                    />
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      </div>
    </div>
  );
}
