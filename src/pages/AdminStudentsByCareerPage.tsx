import {
  Button,
  Input,
  Space,
  Table,
  Tag,
  message,
  Typography,
  Badge,
  Popover,
  Empty,
  Dropdown,
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
  BellOutlined,
  GlobalOutlined,
  BookOutlined,
} from "@ant-design/icons";

import logoImg from "../assets/imagenes/LogoTec-Photoroom.png";
import AssignStudentModal from "../components/AssignStudentModal";

const { Title, Text } = Typography;
const VERDE_INSTITUCIONAL = "#008B8B";

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
  if (v.includes("DIUR")) return <Tag color="cyan" style={{ borderRadius: 10 }}>DIURNA</Tag>;
  if (v.includes("VESP")) return <Tag color="orange" style={{ borderRadius: 10 }}>VESPERTINA</Tag>;
  if (v.includes("NOCT")) return <Tag color="geekblue" style={{ borderRadius: 10 }}>NOCTURNA</Tag>;
  return <Tag style={{ borderRadius: 10 }}>{section ?? "-"}</Tag>;
}

function statusTag(status?: string) {
  const v = (status ?? "").toUpperCase();
  if (v.includes("EN_CURSO")) return <Tag color="processing" bordered={false}>EN CURSO</Tag>;
  if (v.includes("APROB")) return <Tag color="success" bordered={false}>APROBADO</Tag>;
  if (v.includes("REPROB")) return <Tag color="error" bordered={false}>REPROBADO</Tag>;
  return <Tag bordered={false}>{status ?? "-"}</Tag>;
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

  const [openAssign, setOpenAssign] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  const [notifications] = useState([]);

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

    const s = q.trim().toLowerCase();
    if (s) {
      result = result.filter((r: any) => 
        `${r.dni} ${r.firstName} ${r.lastName} ${r.email}`.toLowerCase().includes(s)
      );
    }
    return result;
  }, [rows, q, career, filterSection]);

  const headerButtonStyle = {
    backgroundColor: "#fff",
    color: VERDE_INSTITUCIONAL,
    fontWeight: "bold" as const,
    border: "none",
    borderRadius: "20px",
    height: "32px"
  };

  const columns = [
    { title: "DNI", dataIndex: "dni", width: 120, render: (v: string) => <Text strong>{v}</Text> },
    { title: "Nombres", dataIndex: "firstName", minWidth: 150 },
    { title: "Apellidos", dataIndex: "lastName", minWidth: 150 },
    { title: "Email Institucional", dataIndex: "email", minWidth: 220 },
    { title: "Sección", dataIndex: "section", width: 130, render: (v: string) => sectionTag(v) },
    { title: "Estado", dataIndex: "status", width: 120, render: (v: string) => statusTag(v) },
    {
      title: "Acción",
      width: 180,
      render: (_: unknown, row: any) => (
        <Space>
          <Button type="primary" ghost size="small" style={{ borderRadius: 6 }} onClick={() => nav(`/admin/students/${row.id}`)}>Detalle</Button>
          <Button size="small" icon={<UserSwitchOutlined />} style={{ borderRadius: 6, backgroundColor: "#0b7f7a", color: "white" }} onClick={() => { setSelectedStudentId(row.id); setOpenAssign(true); }}>Asignar</Button>
        </Space>
      ),
    },
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
        .header-title { font-size: 16px !important; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        @media (max-width: 768px) {
           .main-header { padding: 0 10px !important; }
           .header-btn-text { display: none; }
           .header-title { font-size: 14px !important; max-width: 120px; }
           .search-container { flex-direction: column !important; align-items: stretch !important; height: auto !important; gap: 12px; }
           .search-input { width: 100% !important; }
           .jornada-filters { overflow-x: auto; white-space: nowrap; display: flex !important; padding: 5px 0; width: 100%; }
           .jornada-filters::-webkit-scrollbar { display: none; }
        }

        .custom-table .ant-table-thead > tr > th { 
          background-color: ${VERDE_INSTITUCIONAL} !important; 
          color: white !important; 
          text-align: center !important; 
        }

        /* ✅ Quita el scroll innecesario en Mac si hay espacio */
        .ant-table-content {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch;
        }
      `}</style>

      {/* HEADER */}
      <div className="main-header" style={{ backgroundColor: VERDE_INSTITUCIONAL, height: "60px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2.5px solid #fff", flexShrink: 0 }}>
        <Space size="middle">
          <Dropdown menu={{ items }} trigger={['click']} placement="bottomLeft">
            <img src={logoImg} alt="TEC" className="logo-clickable" style={{ height: "30px", cursor: 'pointer' }} />
          </Dropdown>
          <Title level={4} className="header-title" style={{ margin: 0, color: "#fff", fontWeight: 500 }}>{career}</Title>
        </Space>
        
        <Space size="small">
          <Popover content={<Empty description="No hay notificaciones" image={Empty.PRESENTED_IMAGE_SIMPLE} />} title="Notificaciones" trigger="click" placement="bottomRight">
            <Badge count={notifications.length} size="small" offset={[-2, 5]}>
              <Button type="text" icon={<BellOutlined style={{ fontSize: "20px", color: "white" }} />} />
            </Badge>
          </Popover>

          <Button icon={<ArrowLeftOutlined />} onClick={() => nav("/admin/students")} style={headerButtonStyle}><span className="header-btn-text">Atrás</span></Button>
          <Button icon={<ReloadOutlined />} onClick={() => load()} loading={loading} style={headerButtonStyle}><span className="header-btn-text">Actualizar</span></Button>
          <Button icon={<LogoutOutlined />} onClick={handleLogout} style={headerButtonStyle} danger><span className="header-btn-text">Salir</span></Button>
        </Space>
      </div>

      <div style={{ flex: 1, padding: "15px 10px", display: "flex", justifyContent: "center", overflow: "hidden" }}>
        <div style={{ width: "100%", maxWidth: "1200px", display: "flex", flexDirection: "column" }}>
          
          <div className="search-container" style={{ backgroundColor: "#fff", padding: "12px 15px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", border: "1px solid #e8e8e8" }}>
            <Input className="search-input" allowClear value={q} onChange={(e) => setQ(e.target.value)} prefix={<SearchOutlined style={{ color: VERDE_INSTITUCIONAL }} />} placeholder="Buscar estudiante..." style={{ width: "320px", borderRadius: "8px" }} />
            
            <Space className="jornada-filters" size="small">
              <Text strong style={{ fontSize: 11, color: "#555" }}>JORNADA:</Text>
              {[
                { label: "TODOS", val: null }, 
                { label: "DIURNA", val: "DIUR" }, 
                { label: "VESPERTINA", val: "VESP" }, 
                { label: "NOCTURNA", val: "NOCT" }
              ].map((item) => (
                <Button key={item.label} size="small" shape="round" onClick={() => setFilterSection(item.val)} style={{ fontSize: "11px", backgroundColor: filterSection === item.val ? VERDE_INSTITUCIONAL : "#fff", color: filterSection === item.val ? "#fff" : VERDE_INSTITUCIONAL, borderColor: VERDE_INSTITUCIONAL, fontWeight: 600 }}>{item.label}</Button>
              ))}
            </Space>
          </div>

          <div style={{ flex: 1, overflow: "hidden", backgroundColor: 'white', borderRadius: '12px', border: "1px solid #e8e8e8" }}>
            <Table<AdminStudentRow> 
              className="custom-table" 
              rowKey="id" 
              loading={loading} 
              dataSource={filtered as any} 
              columns={columns as any} 
              size="middle" 
              // ✅ scroll x: "max-content" hace que en Mac se vea completo y en móvil active el scroll
              scroll={{ x: 'max-content', y: 'calc(100vh - 290px)' }} 
              pagination={{ 
                pageSize: 10, 
                size: "default", 
                showSizeChanger: false,
                style: { marginRight: 15 }
              }} 
            />
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: VERDE_INSTITUCIONAL, height: "35px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Text style={{ color: "#fff", fontSize: "11px", fontWeight: 500 }}>© 2026 INSTITUTO SUPERIOR TECNOLÓGICO SUDAMERICANO</Text>
      </div>

      <AssignStudentModal open={openAssign} studentId={selectedStudentId} onClose={() => setOpenAssign(false)} onSuccess={load} />
    </div>
  );
}