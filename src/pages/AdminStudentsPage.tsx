import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Container,
} from "@mui/material";

import { importStudentsXlsx, listStudents } from "../services/adminStudentService";
import type { AdminStudentRow } from "../services/adminStudentService";
import { logout } from "../services/authService";
import { createCareer } from "../services/careerService"; 
import { api } from "../api/api";

import AssignCareerModal from "../components/AssignCareerModal";
import CreateUserModal from "../components/CreateUserModal";
import AdminHeaderBar from "../components/AdminHeaderBar";
import CareersSection from "../components/CareersSection";
import GeneralListSection from "../components/GeneralListSection";

import softwareImg from "../assets/imagenes/Desarrollo de Software.png";
import disenoImg from "../assets/imagenes/Diseno-Grafico.png";
import gastronomiaImg from "../assets/imagenes/Gastronomia.png";
import marketingImg from "../assets/imagenes/Marketing Digital y Negocios.png";
import talentoImg from "../assets/imagenes/Talento Humano.png";
import turismoImg from "../assets/imagenes/Turismo.png";
import enfermeriaImg from "../assets/imagenes/Enfermeria.png";

const VERDE_INSTITUCIONAL = "#008B8B";

export type CareerItem = {
  key: string;
  label: string;
  cover?: string;
  imageUrl?: string;
  color: string;
  imgPos?: string;
  isFixed?: boolean;
};

const INITIAL_CAREERS: CareerItem[] = [
  { key: "Desarrollo de software", label: "DESARROLLO DE SOFTWARE", cover: softwareImg, color: "#6a1b9a", imgPos: "center 25%", isFixed: true },
  { key: "Diseño gráfico", label: "DISEÑO GRÁFICO", cover: disenoImg, color: "#00acc1", imgPos: "center 5%", isFixed: true },
  { key: "Gastronomía", label: "GASTRONOMÍA", cover: gastronomiaImg, color: "#2e7d32", imgPos: "center 25%", isFixed: true },
  { key: "Marketing digital y negocios", label: "MARKETING DIGITAL", cover: marketingImg, color: "#ef6c00", imgPos: "center 5%", isFixed: true },
  { key: "Turismo", label: "TURISMO", cover: turismoImg, color: "#9e9d24", imgPos: "center 28%", isFixed: true },
  { key: "Talento humano", label: "TALENTO HUMANO", cover: talentoImg, color: "#1565c0", imgPos: "center 25%", isFixed: true },
  { key: "Enfermería", label: "ENFERMERÍA", cover: enfermeriaImg, color: "#26a69a", imgPos: "center 2%", isFixed: true },
  { key: "Electricidad", label: "ELECTRICIDAD", color: "#f9a825", isFixed: true },
  { key: "Contabilidad y asesoría tributaria", label: "CONTABILIDAD", color: "#c62828", isFixed: true },
  { key: "Redes y Telecomunicaciones", label: "REDES Y TELECOM.", color: "#37474f", isFixed: true },
];

export default function AdminStudentsPage() {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [rows, setRows] = useState<AdminStudentRow[]>([]);
  const nav = useNavigate();

  const [openAssignCareer, setOpenAssignCareer] = useState(false);
  const [openCreateUser, setOpenCreateUser] = useState(false);
  const [openAddCareer, setOpenAddCareer] = useState(false);
  const [openAdminProfile, setOpenAdminProfile] = useState(false);
  const [openTotalsMatriculados, setOpenTotalsMatriculados] = useState(false);
  const [openTotalsReprobados, setOpenTotalsReprobados] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [adminProfile, setAdminProfile] = useState<any | null>(null);

  const [careers, setCareers] = useState<CareerItem[]>(() => {
    const saved = localStorage.getItem("ist_custom_careers");
    return saved ? [...INITIAL_CAREERS, ...JSON.parse(saved)] : INITIAL_CAREERS;
  });

  const [newCareerName, setNewCareerName] = useState("");
  const [newCareerColor, setNewCareerColor] = useState("#546e7a");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listStudents();
      setRows(data || []);
    } catch (e: any) {
      if (e?.response?.status === 401) { logout(); nav("/"); }
    } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const loadMe = async () => {
      try { const res = await api.get("/me"); setAdminProfile(res.data); } catch { setAdminProfile(null); }
    };
    loadMe();
  }, []);

  // ✅ ESTA FUNCIÓN HARÁ QUE LA PÁGINA SE RECARGUE COMO TÚ QUIERES
  const handleHardRefresh = () => {
    window.location.reload();
  };

  const normalizeCareer = (v?: string) => {
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
    return v?.trim() || "Otras Carreras";
  };

  const handleFileUpload = async (file: File) => {
    setImporting(true);
    try {
      await importStudentsXlsx(file);
      await load();
    } catch (e) { console.error("Error"); } finally { setImporting(false); }
  };

  const totalMatriculados = rows.length;
  const totalReprobados = useMemo(() => {
    return rows.filter((s: any) => {
      const st = (s.status || s.estado)?.toUpperCase();
      return st === "RETIRADO" || st === "REPROBADO";
    }).length;
  }, [rows]);

  const totalsByCareer = useMemo(() => {
    return careers.map((c) => {
      const students = rows.filter((r: any) => normalizeCareer(r.career) === c.key);
      const repros = students.filter((s: any) => {
        const st = (s.status || s.estado)?.toUpperCase();
        return st === "RETIRADO" || st === "REPROBADO";
      }).length;
      return { key: c.key, label: c.label, total: students.length, reprobados: repros, color: c.color };
    });
  }, [rows, careers]);

  const groupedStudents = useMemo(() => {
    const groups: Record<string, AdminStudentRow[]> = {};
    const q = searchTerm.toLowerCase().trim();
    rows.forEach((s: any) => {
      const name = `${s.firstName} ${s.lastName}`.toLowerCase();
      if (!q || name.includes(q) || String(s.dni).includes(q)) {
        const key = normalizeCareer(s.career);
        if (!groups[key]) groups[key] = [];
        groups[key].push(s);
      }
    });
    return groups;
  }, [rows, searchTerm]);

  const handleAddCareer = async () => {
    if (!newCareerName.trim()) return;
    try {
      const formData = new FormData();
      formData.append("name", newCareerName.trim());
      formData.append("color", newCareerColor);
      if (selectedFile) formData.append("image", selectedFile);
      try { await createCareer(formData); } catch (err) {}
      let tempUrl = selectedFile ? URL.createObjectURL(selectedFile) : "";
      const newEntry: CareerItem = { key: newCareerName.trim(), label: newCareerName.toUpperCase(), color: newCareerColor, isFixed: false, imageUrl: tempUrl };
      const updated = [...careers, newEntry];
      setCareers(updated);
      localStorage.setItem("ist_custom_careers", JSON.stringify(updated.filter(c => !c.isFixed)));
      setOpenAddCareer(false);
      setNewCareerName("");
      setSelectedFile(null);
    } catch (e) {}
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "#f4f7f6" }}>
      <AdminHeaderBar
        verde={VERDE_INSTITUCIONAL}
        importing={loading || importing}
        onOpenAssignCareer={() => setOpenAssignCareer(true)}
        onOpenCreateUser={() => setOpenCreateUser(true)}
        onRefresh={handleHardRefresh} // ✅ AHORA RECARGA LA PÁGINA COMPLETA
        onLogout={() => { logout(); nav("/"); }}
        userMenuAnchor={userMenuAnchor}
        openUserMenu={Boolean(userMenuAnchor)}
        onOpenMenu={(e) => setUserMenuAnchor(e.currentTarget)}
        onCloseMenu={() => setUserMenuAnchor(null)}
        onOpenProfile={() => { setOpenAdminProfile(true); setUserMenuAnchor(null); }}
        onOpenTotalsMatriculados={() => { setOpenTotalsMatriculados(true); setUserMenuAnchor(null); }}
        onOpenTotalsRetirados={() => { setOpenTotalsReprobados(true); setUserMenuAnchor(null); }}
        onUploadFile={handleFileUpload} 
      />

      <Container maxWidth={false} sx={{ py: 4, display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
        <CareersSection
          verde={VERDE_INSTITUCIONAL}
          careers={careers}
          rows={rows}
          normalizeCareer={normalizeCareer}
          onCareerClick={(key) => nav(`/admin/students/career/${encodeURIComponent(key)}`)}
          onOpenAddCareer={() => setOpenAddCareer(true)}
          onDeleteCareer={(key) => {
            const updated = careers.filter(c => c.key !== key);
            setCareers(updated);
            localStorage.setItem("ist_custom_careers", JSON.stringify(updated.filter(c => !c.isFixed)));
          }}
        />

        <GeneralListSection
          verde={VERDE_INSTITUCIONAL}
          careersVisible={careers}
          groupedStudents={groupedStudents}
          statsByCareer={{}}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          normalizeCareer={normalizeCareer}
          getStudentName={(s) => `${s.firstName || ""} ${s.lastName || ""}`}
          getSemaforo={() => ({ bg: "#e8f5e9", border: "#2e7d32", chipBg: "#2e7d32", chipText: "#fff", label: "SIN NOVEDAD" })}
          onViewProfile={(id) => nav(`/admin/students/${id}`)}
          onClearIncidents={() => {}}
        />
      </Container>

      {/* MODALES ESTADÍSTICAS */}
      <Dialog open={openTotalsMatriculados} onClose={() => setOpenTotalsMatriculados(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, bgcolor: VERDE_INSTITUCIONAL, color: "#fff" }}>
          Total Matriculados: {totalMatriculados}
        </DialogTitle>
        <DialogContent dividers>
          {totalsByCareer.map((c) => (
            <Box key={c.key} sx={{ display: "flex", justifyContent: "space-between", mb: 1, p: 1, borderBottom: "1px solid #eee" }}>
              <Typography sx={{ fontWeight: 600 }}>{c.label}</Typography>
              <Typography sx={{ fontWeight: 700, color: c.color }}>{c.total}</Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenTotalsMatriculados(false)}>Cerrar</Button></DialogActions>
      </Dialog>

      <Dialog open={openTotalsReprobados} onClose={() => setOpenTotalsReprobados(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, bgcolor: "#d32f2f", color: "#fff" }}>
          Total Reprobados: {totalReprobados}
        </DialogTitle>
        <DialogContent dividers>
          {totalsByCareer.map((c) => (
            <Box key={c.key} sx={{ display: "flex", justifyContent: "space-between", mb: 1, p: 1, borderBottom: "1px solid #eee" }}>
              <Typography sx={{ fontWeight: 600 }}>{c.label}</Typography>
              <Typography sx={{ fontWeight: 700, color: "#d32f2f" }}>{c.reprobados}</Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenTotalsReprobados(false)}>Cerrar</Button></DialogActions>
      </Dialog>

      <Dialog open={openAdminProfile} onClose={() => setOpenAdminProfile(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Perfil del Administrador</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ mb: 1 }}><b>Nombre:</b> {adminProfile?.fullName || "-"}</Typography>
          <Typography><b>Cédula:</b> {adminProfile?.dni || "-"}</Typography>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenAdminProfile(false)}>Cerrar</Button></DialogActions>
      </Dialog>

      <Dialog open={openAddCareer} onClose={() => setOpenAddCareer(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Añadir Carrera</DialogTitle>
        <DialogContent>
          <TextField label="Nombre" fullWidth margin="dense" value={newCareerName} onChange={(e) => setNewCareerName(e.target.value)} />
          <Typography variant="caption" sx={{ mt: 2, display: 'block' }}>Color:</Typography>
          <input type="color" value={newCareerColor} onChange={(e) => setNewCareerColor(e.target.value)} style={{ width: "100%", height: 40, marginTop: 5 }} />
          <Button variant="outlined" component="label" fullWidth sx={{ mt: 3 }}>
            {selectedFile ? selectedFile.name : "Subir Portada"}
            <input type="file" hidden accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
          </Button>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenAddCareer(false)}>Cancelar</Button>
          <Button onClick={handleAddCareer} variant="contained" sx={{ bgcolor: VERDE_INSTITUCIONAL }}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <AssignCareerModal open={openAssignCareer} onClose={() => setOpenAssignCareer(false)} onSuccess={load} availableCareers={careers} />
      <CreateUserModal open={openCreateUser} onClose={() => setOpenCreateUser(false)} onSuccess={load} />
    </Box>
  );
}