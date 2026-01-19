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
  Avatar, // Para mostrar la foto
} from "antd";
import type { MenuProps } from "antd";
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
  UserSwitchOutlined,
  GlobalOutlined,
  BookOutlined,
  InfoCircleOutlined,
  DownOutlined,
  UserOutlined, // Icono por defecto
} from "@ant-design/icons";

import logoImg from "../assets/imagenes/LogoTec-Photoroom.png";
import AssignStudentModal from "../components/AssignStudentModal";

const { Title, Text } = Typography;
const { Option } = Select;
const VERDE_INSTITUCIONAL = "#008B8B";

// =================================================================
// 1. CONFIGURACIÓN DE LA URL (Aquí es donde pones la ruta de tu API)
// =================================================================
const API_URL = "http://localhost:3000"; // Cambia esto por la URL real de tu servidor

/* ===================== FUNCIONES DE FORMATO ===================== */

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
  const { careerName } = useParams();
  const career = decodeURIComponent(careerName ?? "");
  const nav = useNavigate();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AdminStudentRow[]>([]);
  const [q, setQ] = useState("");
  const [filterSection, setFilterSection] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const [openAssign, setOpenAssign] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listStudents();
      setRows(data);
    } catch (e: any) {
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        handleLogout();
      } else {
        message.error(e?.response?.data?.message ?? "No se pudo cargar estudiantes");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleLogout = () => { logout(); window.location.href = "/"; };

  const filtered = useMemo(() => {
    let result = rows
      .map((r) => ({ ...r, careerNorm: normalizeCareer(r.career) }))
      .filter((r: any) => r.careerNorm === career);

    if (filterSection) {
      result = result.filter((r: any) => (r.section ?? "").toUpperCase().includes(filterSection));
    }

    if (filterStatus) {
      result = result.filter((r: any) => (r.status ?? "").toUpperCase().includes(filterStatus));
    }

    const s = q.trim().toLowerCase();
    if (s) {
      result = result.filter((r: any) => 
        String(r.dni).toLowerCase().includes(s) || 
        `${r.firstName} ${r.lastName}`.toLowerCase().includes(s)
      );
    }
    return result;
  }, [rows, q, career, filterSection, filterStatus]);

  const columns = [
    // COLUMNA PARA VER LA FOTO AUTOMÁTICAMENTE
    {
      title: "FOTO",
      dataIndex: "fotoUrl", // Asegúrate que tu DB devuelva este nombre
      width: 70,
      render: (fotoUrl: string) => (
        <Avatar 
          src={fotoUrl ? `${API_URL}/uploads/${fotoUrl}` : null} 
          icon={<UserOutlined />} 
          style={{ backgroundColor: '#ccc' }}
        />
      ),
    },
    { title: "DNI/CÉDULA", dataIndex: "dni", width: 120, render: (v: string) => <Text strong>{v}</Text> },
    { title: "Nombres", dataIndex: "firstName", minWidth: 150 },
    { title: "Apellidos", dataIndex: "lastName", minWidth: 150 },
    { title: "Sección", dataIndex: "section", width: 130, render: (v: string) => sectionTag(v) },
    { title: "Estado", dataIndex: "status", width: 120, render: (v: string) => statusTag(v) },
    {
      title: "Acción",
      width: 150,
      render: (_: unknown, row: any) => (
        <Space size="middle">
          <Tooltip title="Mayor información">
            <Button 
              type="text" 
              shape="circle"
              icon={<InfoCircleOutlined style={{ fontSize: '18px', color: VERDE_INSTITUCIONAL }} />}
              onClick={() => nav(`/admin/students/${row.id}`)}
            />
          </Tooltip>
          <Button 
            size="small" 
            shape="round"
            icon={<UserSwitchOutlined />} 
            style={{ backgroundColor: "#0b7f7a", color: "white", border: 'none' }} 
            onClick={() => { setSelectedStudentId(row.id); setOpenAssign(true); }}
          >
            Asignar
          </Button>
        </Space>
      ),
    },
  ];

  const sessionItems: MenuProps['items'] = [
    { key: 'null', label: 'TODOS', onClick: () => setFilterSection(null) },
    { key: 'DIUR', label: 'DIURNA', onClick: () => setFilterSection('DIUR') },
    { key: 'VESP', label: 'VESPERTINA', onClick: () => setFilterSection('VESP') },
    { key: 'NOCT', label: 'NOCTURNA', onClick: () => setFilterSection('NOCT') },
  ];

  const items: MenuProps['items'] = [
    {
      key: 'sga',
      label: <a href="https://sudamericano.edu.ec/" target="_blank" rel="noopener noreferrer" style={{ color: VERDE_INSTITUCIONAL, fontWeight: '500' }}>Ir al SGA</a>,
      icon: <GlobalOutlined style={{ color: VERDE_INSTITUCIONAL }} />,
    },
    {
      key: 'eva',
      label: <a href="https://eva.sudamericano.edu.ec/login/index.php" target="_blank" rel="noopener noreferrer" style={{ color: VERDE_INSTITUCIONAL, fontWeight: '500' }}>Ir al EVA</a>,
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
      <div className="main-header" style={{ backgroundColor: VERDE_INSTITUCIONAL, height: "60px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2.5px solid #fff", flexShrink: 0 }}>
        <Space size="middle">
          <Dropdown menu={{ items }} trigger={['click']}>
            <img src={logoImg} alt="TEC" style={{ height: "30px", cursor: 'pointer' }} />
          </Dropdown>
          <Title level={4} style={{ margin: 0, color: "#fff", fontWeight: 700 }}>{career}</Title>
        </Space>
        
        <Space size="small">
          <Button icon={<ArrowLeftOutlined />} onClick={() => nav("/admin/students")} shape="round" style={{ fontWeight: 'bold', color: VERDE_INSTITUCIONAL }}>Atrás</Button>
          <Button icon={<ReloadOutlined />} onClick={() => load()} loading={loading} shape="round" style={{ fontWeight: 'bold', color: VERDE_INSTITUCIONAL }}>Actualizar</Button>
          <Button icon={<LogoutOutlined />} onClick={handleLogout} shape="round" style={{ fontWeight: 'bold', color: VERDE_INSTITUCIONAL }}>Salir</Button>
        </Space>
      </div>

      <div style={{ flex: 1, padding: "15px 10px", display: "flex", justifyContent: "center", overflow: "hidden" }}>
        <div style={{ width: "100%", maxWidth: "1300px", display: "flex", flexDirection: "column" }}>
          
          <div className="search-container green-border-left" style={{ backgroundColor: "#fff", padding: "15px 20px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            
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

              <Select
                placeholder="Filtrar por Estado"
                style={{ width: 180 }}
                allowClear
                onChange={(val) => setFilterStatus(val)}
              >
                <Option value="EN_CURSO">EN CURSO</Option>
                <Option value="APROB">APROBADO</Option>
                <Option value="REPROB">REPROBADO</Option>
              </Select>
            </Space>
            
            <Dropdown menu={{ items: sessionItems }} trigger={['click']}>
              <Button shape="round" icon={<DownOutlined />} style={{ borderColor: VERDE_INSTITUCIONAL, color: VERDE_INSTITUCIONAL, fontWeight: 700 }}>
                {filterSection ? `SESIÓN: ${filterSection}` : "SESIONES"}
              </Button>
            </Dropdown>
          </div>

          <div className="green-border-left" style={{ flex: 1, overflow: "hidden", backgroundColor: 'white', borderRadius: '12px', boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <Table<AdminStudentRow> 
              className="custom-table" 
              rowKey="id" 
              loading={loading} 
              dataSource={filtered as any} 
              columns={columns as any} 
              size="middle" 
              scroll={{ x: 'max-content', y: 'calc(100vh - 310px)' }} 
              pagination={{ pageSize: 10, showSizeChanger: false }} 
            />
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: VERDE_INSTITUCIONAL, height: "35px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Text style={{ color: "#fff", fontSize: "11px", fontWeight: 600 }}>© 2026 INSTITUTO SUPERIOR TECNOLÓGICO SUDAMERICANO</Text>
      </div>

      <AssignStudentModal open={openAssign} studentId={selectedStudentId} onClose={() => setOpenAssign(false)} onSuccess={load} />
    </div>
  );
}