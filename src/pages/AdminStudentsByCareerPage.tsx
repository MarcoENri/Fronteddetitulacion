import {
  Button,
  Input,
  Space,
  Table,
  Tag,
  message,
  Typography,
  Dropdown,
  Select,
  Tooltip,
  Avatar,
} from "antd";
import type { MenuProps } from "antd";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { listStudents } from "../services/adminStudentService";
import type { AdminStudentRow } from "../services/adminStudentService";
import { logout } from "../services/authService";
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  SearchOutlined,
  LogoutOutlined,
  UserSwitchOutlined,
  GlobalOutlined,
  BookOutlined,
  InfoCircleOutlined,
  DownOutlined,
  UserOutlined,
} from "@ant-design/icons";

import logoImg from "../assets/imagenes/LogoTec-Photoroom.png";
import AssignStudentModal from "../components/AssignStudentModal";

const { Title, Text } = Typography;
const { Option } = Select;
const VERDE_INSTITUCIONAL = "#008B8B";

const API_URL = "http://localhost:8081";

/* ===================== FUNCIONES DE FORMATO ===================== */

function sectionTag(section?: string) {
  const v = (section ?? "").toUpperCase();
  if (v.includes("DIUR")) return <Tag color="cyan" style={{ borderRadius: 20, fontWeight: 600 }}>DIURNA</Tag>;
  if (v.includes("VESP")) return <Tag color="orange" style={{ borderRadius: 20, fontWeight: 600 }}>VESPERTINA</Tag>;
  if (v.includes("NOCT")) return <Tag color="geekblue" style={{ borderRadius: 20, fontWeight: 600 }}>NOCTURNA</Tag>;
  return <Tag style={{ borderRadius: 20 }}>{section ?? "-"}</Tag>;
}

function statusTag(status?: string) {
  const v = (status ?? "").toUpperCase();
  if (v.includes("EN_CURSO")) return <Tag color="processing" bordered={false} style={{ borderRadius: 20 }}>EN CURSO</Tag>;
  if (v.includes("APROB")) return <Tag color="success" bordered={false} style={{ borderRadius: 20 }}>APROBADO</Tag>;
  if (v.includes("REPROB")) return <Tag color="error" bordered={false} style={{ borderRadius: 20 }}>REPROBADO</Tag>;
  return <Tag bordered={false} style={{ borderRadius: 20 }}>{status ?? "-"}</Tag>;
}

/* ===================== COMPONENTE PRINCIPAL ===================== */

export default function AdminStudentsByCareerPage() {
  const nav = useNavigate();

  // ✅ 2) Inicio del componente: Params y State
  const [searchParams] = useSearchParams();
  const careerId = Number(searchParams.get("careerId"));
  const periodIdFromUrl = searchParams.get("periodId");
  
  // ✅ CAMBIO 1: Capturar el nombre de la carrera desde la URL como fallback
  const careerNameFromUrl = searchParams.get("careerName");

  const [careerTitle, setCareerTitle] = useState("Carrera");

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AdminStudentRow[]>([]);
  const [q, setQ] = useState("");
  const [filterSection, setFilterSection] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const [openAssign, setOpenAssign] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  // ✅ 3) Lógica de periodo: URL > localStorage
  const getSelectedPeriodId = () => {
    // 1) prioridad: periodId en la URL
    if (periodIdFromUrl && Number.isFinite(Number(periodIdFromUrl))) return Number(periodIdFromUrl);

    // 2) fallback: localStorage
    const pidStr = localStorage.getItem("adminPeriodId");
    if (!pidStr) return undefined;
    const n = Number(pidStr);
    return Number.isFinite(n) ? n : undefined;
  };

  // ✅ 4) Load: Valida ID y calcula título
  const load = useCallback(async () => {
    if (!Number.isFinite(careerId) || careerId === 0) {
      message.error("Falta careerId en la URL");
      setRows([]);
      return;
    }

    setLoading(true);
    try {
      const pid = getSelectedPeriodId();
      const data = await listStudents(pid);
      const arr = Array.isArray(data) ? data : [];
      setRows(arr);

      // ✅ CAMBIO 1 (Continuación): Lógica robusta para el título
      // Intenta buscar en la lista de estudiantes
      const match = arr.find((r: any) => Number(r.careerId) === careerId);
      
      // Si hay match usa el de la API, sino usa el de la URL, sino "Carrera"
      setCareerTitle(match?.career ?? careerNameFromUrl ?? "Carrera");

    } catch (e: any) {
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        logout();
        window.location.href = "/";
      } else {
        message.error(e?.response?.data?.message ?? "No se pudo cargar estudiantes");
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [careerId, periodIdFromUrl, careerNameFromUrl]); 

  // Carga inicial
  useEffect(() => {
    load();
  }, [load]);

  // ✅ CAMBIO 2: Listener para recargar si cambia el periodo en otra pestaña
  useEffect(() => {
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === "adminPeriodId") {
        console.log("Detectado cambio de periodo en localStorage, recargando...");
        load();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [load]);


  // ✅ 5) Filtro principal: SOLO por careerId
  const filtered = useMemo(() => {
    // A) Filtro base: careerId
    let result = rows.filter((r: any) => Number(r.careerId) === careerId);

    // B) Filtros secundarios
    if (filterSection) {
      result = result.filter((r: any) => (r.section ?? "").toUpperCase().includes(filterSection));
    }

    if (filterStatus) {
      result = result.filter((r: any) => (r.status ?? "").toUpperCase().includes(filterStatus));
    }

    const s = q.trim().toLowerCase();
    if (s) {
      result = result.filter(
        (r: any) =>
          String(r.dni).toLowerCase().includes(s) ||
          `${r.firstName} ${r.lastName}`.toLowerCase().includes(s)
      );
    }
    return result;
  }, [rows, careerId, q, filterSection, filterStatus]);

  const columns = [
    {
      title: "FOTO",
      dataIndex: "fotoUrl",
      width: 70,
      render: (fotoUrl: string) => (
        <Avatar
          src={fotoUrl ? `${API_URL}/uploads/${fotoUrl}` : undefined}
          icon={<UserOutlined />}
          style={{ backgroundColor: "#ccc" }}
        />
      ),
    },
    { title: "DNI/CÉDULA", dataIndex: "dni", width: 120, render: (v: string) => <Text strong>{v}</Text> },
    { title: "Nombres", dataIndex: "firstName", width: 160 },
    { title: "Apellidos", dataIndex: "lastName", width: 160 },
    { title: "Sección", dataIndex: "section", width: 130, render: (v: string) => sectionTag(v) },
    { title: "Estado", dataIndex: "status", width: 130, render: (v: string) => statusTag(v) },
    {
      title: "Acción",
      width: 160,
      render: (_: unknown, row: any) => (
        <Space size="middle">
          <Tooltip title="Mayor información">
            <Button
              type="text"
              shape="circle"
              icon={<InfoCircleOutlined style={{ fontSize: "18px", color: VERDE_INSTITUCIONAL }} />}
              onClick={() => nav(`/admin/students/${row.id}`)}
            />
          </Tooltip>
          <Button
            size="small"
            shape="round"
            icon={<UserSwitchOutlined />}
            style={{ backgroundColor: "#0b7f7a", color: "white", border: "none" }}
            onClick={() => {
              setSelectedStudentId(row.id);
              setOpenAssign(true);
            }}
          >
            Asignar
          </Button>
        </Space>
      ),
    },
  ];

  const sessionItems: MenuProps["items"] = [
    { key: "null", label: "TODOS", onClick: () => setFilterSection(null) },
    { key: "DIUR", label: "DIURNA", onClick: () => setFilterSection("DIUR") },
    { key: "VESP", label: "VESPERTINA", onClick: () => setFilterSection("VESP") },
    { key: "NOCT", label: "NOCTURNA", onClick: () => setFilterSection("NOCT") },
  ];

  const items: MenuProps["items"] = [
    {
      key: "sga",
      label: (
        <a
          href="https://sudamericano.edu.ec/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: VERDE_INSTITUCIONAL, fontWeight: "500" }}
        >
          Ir al SGA
        </a>
      ),
      icon: <GlobalOutlined style={{ color: VERDE_INSTITUCIONAL }} />,
    },
    {
      key: "eva",
      label: (
        <a
          href="https://eva.sudamericano.edu.ec/login/index.php"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: VERDE_INSTITUCIONAL, fontWeight: "500" }}
        >
          Ir al EVA
        </a>
      ),
      icon: <BookOutlined style={{ color: VERDE_INSTITUCIONAL }} />,
    },
  ];

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f0f2f5", overflow: "hidden" }}>
      <style>{`
        .main-header { padding: 0 20px !important; }
        .header-title { font-size: 16px !important; }
        .custom-table .ant-table-thead > tr > th {
          background-color: ${VERDE_INSTITUCIONAL} !important;
          color: white !important;
          text-align: center !important;
          font-weight: 800 !important;
        }
        .ant-input-affix-wrapper {
          border-radius: 30px !important;
          padding-left: 15px !important;
        }
        .green-border-left {
          border-left: 5px solid ${VERDE_INSTITUCIONAL} !important;
        }
      `}</style>

      {/* HEADER */}
      <div
        className="main-header"
        style={{
          backgroundColor: VERDE_INSTITUCIONAL,
          height: "60px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "2.5px solid #fff",
          flexShrink: 0,
        }}
      >
        <Space size="middle">
          <Dropdown menu={{ items }} trigger={["click"]}>
            <img src={logoImg} alt="TEC" style={{ height: "30px", cursor: "pointer" }} />
          </Dropdown>
          {/* Título dinámico */}
          <Title level={4} style={{ margin: 0, color: "#fff", fontWeight: 700 }}>
            {careerTitle}
          </Title>
        </Space>

        <Space size="small">
          <Button icon={<ArrowLeftOutlined />} onClick={() => nav("/admin/students")} shape="round" style={{ fontWeight: "bold", color: VERDE_INSTITUCIONAL }}>
            Atrás
          </Button>
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading} shape="round" style={{ fontWeight: "bold", color: VERDE_INSTITUCIONAL }}>
            Actualizar
          </Button>
          <Button icon={<LogoutOutlined />} onClick={() => { logout(); window.location.href = "/"; }} shape="round" style={{ fontWeight: "bold", color: VERDE_INSTITUCIONAL }}>
            Salir
          </Button>
        </Space>
      </div>

      <div style={{ flex: 1, padding: "15px 10px", display: "flex", justifyContent: "center", overflow: "hidden" }}>
        <div style={{ width: "100%", maxWidth: "1300px", display: "flex", flexDirection: "column" }}>
          <div
            className="search-container green-border-left"
            style={{
              backgroundColor: "#fff",
              padding: "15px 20px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px",
            }}
          >
            <Space size="large">
              <Input
                className="search-input"
                allowClear
                value={q}
                onChange={(e) => setQ(e.target.value)}
                prefix={<SearchOutlined style={{ color: VERDE_INSTITUCIONAL }} />}
                placeholder="Buscar por estudiante o cédula..."
                style={{ width: "350px" }}
              />

              <Select placeholder="Filtrar por Estado" style={{ width: 180 }} allowClear onChange={(val) => setFilterStatus(val)}>
                <Option value="EN_CURSO">EN CURSO</Option>
                <Option value="APROB">APROBADO</Option>
                <Option value="REPROB">REPROBADO</Option>
              </Select>
            </Space>

            <Dropdown menu={{ items: sessionItems }} trigger={["click"]}>
              <Button shape="round" icon={<DownOutlined />} style={{ borderColor: VERDE_INSTITUCIONAL, color: VERDE_INSTITUCIONAL, fontWeight: 700 }}>
                {filterSection ? `SESIÓN: ${filterSection}` : "SESIONES"}
              </Button>
            </Dropdown>
          </div>

          <div className="green-border-left" style={{ flex: 1, overflow: "hidden", backgroundColor: "white", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <Table<AdminStudentRow>
              className="custom-table"
              rowKey="id"
              loading={loading}
              dataSource={filtered as any}
              columns={columns as any}
              size="middle"
              scroll={{ x: "max-content", y: "calc(100vh - 310px)" }}
              pagination={{ pageSize: 10, showSizeChanger: false }}
            />
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: VERDE_INSTITUCIONAL, height: "35px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Text style={{ color: "#fff", fontSize: "11px", fontWeight: 600 }}>© 2026 INSTITUTO SUPERIOR TECNOLÓGICO SUDAMERICANO</Text>
      </div>

      <AssignStudentModal
        open={openAssign}
        studentId={selectedStudentId}
        onClose={() => setOpenAssign(false)}
        onSuccess={load}
      />
    </div>
  );
}