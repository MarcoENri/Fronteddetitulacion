import {
  Button,
  Card,
  Input,
  Space,
  Table,
  Tag,
  message,
  Typography,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { listStudents } from "../services/adminStudentService";
import type { AdminStudentRow } from "../services/adminStudentService";
import { logout } from "../services/authService";
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  SearchOutlined,
  LogoutOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

function normalizeCareer(v?: string) {
  const x = (v ?? "").trim().toLowerCase();
  if (x.includes("desarrollo") && x.includes("software")) return "Desarrollo de software";
  if (x.includes("dise") && x.includes("gr")) return "Diseño gráfico";
  if (x.includes("gastr")) return "Gastronomía";
  if (x.includes("marketing")) return "Marketing digital y negocios";
  if (x.includes("turismo")) return "Turismo";
  if (x.includes("talento")) return "Talento humano";
  if (x.includes("enfer")) return "Enfermería";
  if (x.includes("electr")) return "Electricidad";
  if (x.includes("contab") || x.includes("tribut")) return "Contabilidad y asesoría tributaria";
  if (x.includes("redes") || x.includes("telecom")) return "Redes y Telecomunicaciones";
  return v?.trim() || "Sin carrera";
}

function sectionTag(section?: string) {
  const v = (section ?? "").toUpperCase();
  if (v.includes("DIUR")) return <Tag color="green">DIURNA</Tag>;
  if (v.includes("VESP")) return <Tag color="gold">VESPERTINA</Tag>;
  if (v.includes("NOCT")) return <Tag color="blue">NOCTURNA</Tag>;
  return <Tag>{section ?? "-"}</Tag>;
}

function statusTag(status?: string) {
  const v = (status ?? "").toUpperCase();
  if (v.includes("EN_CURSO")) return <Tag color="processing">EN CURSO</Tag>;
  if (v.includes("APROB")) return <Tag color="success">APROBADO</Tag>;
  if (v.includes("REPROB")) return <Tag color="error">REPROBADO</Tag>;
  return <Tag>{status ?? "-"}</Tag>;
}

export default function AdminStudentsByCareerPage() {
  const { careerName } = useParams(); // viene url-encoded
  const career = decodeURIComponent(careerName ?? "");
  const nav = useNavigate();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AdminStudentRow[]>([]);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setRows(await listStudents());
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "No se pudo cargar estudiantes");
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
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows
      .map((r) => ({ ...r, careerNorm: normalizeCareer(r.career) }))
      .filter((r: any) => r.careerNorm === career)
      .filter((r: any) => {
        if (!s) return true;
        return `${r.dni} ${r.firstName} ${r.lastName} ${r.email}`.toLowerCase().includes(s);
      });
  }, [rows, q, career]);

  const columns = [
    { title: "DNI", dataIndex: "dni", width: 120 },
    { title: "Nombres", dataIndex: "firstName", width: 140 },
    { title: "Apellidos", dataIndex: "lastName", width: 140 },
    { title: "Email", dataIndex: "email" },
    { title: "Corte", dataIndex: "corte", width: 90 },
    {
      title: "Sección",
      dataIndex: "section",
      width: 120,
      render: (v: string) => sectionTag(v),
    },
    { title: "Modalidad", dataIndex: "modality", width: 120 },
    {
      title: "Tipo",
      dataIndex: "titulationType",
      width: 180,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: "Estado",
      dataIndex: "status",
      width: 120,
      render: (v: string) => statusTag(v),
    },
    { title: "Incidencias", dataIndex: "incidentCount", width: 110 },
    { title: "Obs.", dataIndex: "observationCount", width: 80 },
    {
      title: "Acción",
      fixed: "right" as const,
      width: 110,
      render: (_: unknown, row: any) => (
        <Button type="link" onClick={() => nav(`/admin/students/${row.id}`)}>
          Ver detalle
        </Button>
      ),
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 18,
        background: "linear-gradient(180deg, #e9f7f6 0%, #ffffff 40%)",
      }}
    >
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
          <div>
            <Title level={3} style={{ margin: 0, color: "#0b7f7a" }}>
              {career}
            </Title>
            <Text type="secondary">
              Lista de estudiantes por carrera · Sección marcada con color (Diurna/Vespertina/Nocturna)
            </Text>
          </div>

          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => nav("/admin/students")}>
              Volver
            </Button>
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
              Actualizar
            </Button>
            <Button
              danger
              icon={<LogoutOutlined />}
              onClick={() => {
                logout();
                nav("/");
              }}
            >
              Cerrar sesión
            </Button>
          </Space>
        </div>

        <Card style={{ borderRadius: 14, marginBottom: 12 }}>
          <Input
            allowClear
            value={q}
            onChange={(e) => setQ(e.target.value)}
            prefix={<SearchOutlined />}
            placeholder="Buscar por DNI, nombres, apellidos o email..."
            style={{ maxWidth: 420 }}
          />
          <div style={{ marginTop: 10 }}>
            <Tag color="green">DIURNA</Tag>
            <Tag color="gold">VESPERTINA</Tag>
            <Tag color="blue">NOCTURNA</Tag>
          </div>
        </Card>

        <Card style={{ borderRadius: 14 }}>
          <Table<AdminStudentRow>
            rowKey="id"
            loading={loading}
            dataSource={filtered as any}
            columns={columns as any}
            size="middle"
            scroll={{ x: 1100 }}
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
        </Card>
      </div>
    </div>
  );
}
