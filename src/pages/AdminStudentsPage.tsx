import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Container,
  FormControlLabel,
  Checkbox,
} from "@mui/material";

// --- FECHAS ---
import dayjs, { Dayjs } from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

// Servicios
import { importStudentsXlsx, listStudents } from "../services/adminStudentService";
import type { AdminStudentRow } from "../services/adminStudentService";
import { logout } from "../services/authService";
import { createCareer } from "../services/careerService";
import { api } from "../api/api";
import {
  createAcademicPeriod,
  listAcademicPeriods,
  type AcademicPeriodDto,
} from "../services/periodService";
import { listCareerCards, type CareerCardDto } from "../services/adminCareerCardsService";

// Componentes
import AssignCareerModal from "../components/AssignCareerModal";
import CreateUserModal from "../components/CreateUserModal";
import AdminHeaderBar from "../components/AdminHeaderBar";
import CareersSection from "../components/CareersSection";
import GeneralListSection from "../components/GeneralListSection";

import { useActivePeriod } from "../hooks/useActivePeriod";

const VERDE_INSTITUCIONAL = "#008B8B";

// Tipos legacy (necesario para que Typescript no llore en el Modal, 
// aunque ya no usamos la data hardcodeada)
export type CareerItem = {
  key: string;
  label: string;
  cover?: string;
  imageUrl?: string;
  color: string;
  imgPos?: string;
  isFixed?: boolean;
};

export default function AdminStudentsPage() {
  const nav = useNavigate();

  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [rows, setRows] = useState<AdminStudentRow[]>([]);

  // Cards del backend (Fuente de verdad única para carreras)
  const [careerCards, setCareerCards] = useState<CareerCardDto[]>([]);

  // Hook periodo activo
  const activePeriod = useActivePeriod();

  // Periodos (selector)
  const [periods, setPeriods] = useState<AcademicPeriodDto[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | "ALL">("ALL");

  // Modales
  const [openAssignCareer, setOpenAssignCareer] = useState(false);
  const [openCreateUser, setOpenCreateUser] = useState(false);
  const [openAddCareer, setOpenAddCareer] = useState(false);
  const [openAdminProfile, setOpenAdminProfile] = useState(false);

  // Modal crear periodo
  const [openPeriodModal, setOpenPeriodModal] = useState(false);
  const [periodStart, setPeriodStart] = useState<Dayjs | null>(dayjs());
  const [periodEnd, setPeriodEnd] = useState<Dayjs | null>(dayjs().add(5, "month"));
  const [periodIsActive, setPeriodIsActive] = useState(true);

  // Misc
  const [searchTerm, setSearchTerm] = useState("");
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [adminProfile, setAdminProfile] = useState<any | null>(null);

  // Modal añadir carrera (inputs)
  const [newCareerName, setNewCareerName] = useState("");
  const [newCareerColor, setNewCareerColor] = useState("#546e7a");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleHardRefresh = () => window.location.reload();

  // -------------------------
  // LOADERS
  // -------------------------
  const loadPeriods = async () => {
    try {
      const ps = await listAcademicPeriods();
      setPeriods(Array.isArray(ps) ? ps : []);
    } catch {
      setPeriods([]);
    }
  };

  const loadCareerCards = async (periodId: number | "ALL") => {
    try {
      const pid = periodId === "ALL" ? (activePeriod.periodId ?? undefined) : periodId;
      const data = await listCareerCards(pid);
      setCareerCards(Array.isArray(data) ? data : []);
    } catch {
      setCareerCards([]);
    }
  };

  const loadStudents = async (periodId: number | "ALL") => {
    setLoading(true);
    try {
      const data = periodId === "ALL" ? await listStudents() : await listStudents(periodId);
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        logout();
        nav("/");
      }
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // INIT
  // -------------------------
  useEffect(() => {
    (async () => {
      await loadPeriods();

      const ls = localStorage.getItem("adminPeriodId");
      if (ls && Number.isFinite(Number(ls))) {
        const pid = Number(ls);
        setSelectedPeriodId(pid);
        await loadStudents(pid);
        await loadCareerCards(pid);
        return;
      }

      if (activePeriod?.periodId) {
        setSelectedPeriodId(activePeriod.periodId);
        localStorage.setItem("adminPeriodId", String(activePeriod.periodId));
        await loadStudents(activePeriod.periodId);
        await loadCareerCards(activePeriod.periodId);
        return;
      }

      setSelectedPeriodId("ALL");
      await loadStudents("ALL");
      await loadCareerCards("ALL");
    })();

    (async () => {
      try {
        const res = await api.get("/me");
        setAdminProfile(res.data);
      } catch {
        setAdminProfile(null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si activePeriod carga después
  useEffect(() => {
    if (!activePeriod.loading && activePeriod.periodId && selectedPeriodId === "ALL") {
      const ls = localStorage.getItem("adminPeriodId");
      if (!ls) {
        setSelectedPeriodId(activePeriod.periodId);
        localStorage.setItem("adminPeriodId", String(activePeriod.periodId));
        loadStudents(activePeriod.periodId);
        loadCareerCards(activePeriod.periodId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePeriod.periodId, activePeriod.loading]);

  // Cambiar periodo
  const handleSelectPeriod = async (val: number | "ALL") => {
    setSelectedPeriodId(val);
    if (val === "ALL") localStorage.removeItem("adminPeriodId");
    else localStorage.setItem("adminPeriodId", String(val));

    await loadStudents(val);
    await loadCareerCards(val);
  };

  // -------------------------
  // IMPORT EXCEL
  // -------------------------
  const handleFileUpload = async (file: File) => {
    setImporting(true);
    try {
      const pid = selectedPeriodId !== "ALL" ? selectedPeriodId : activePeriod.periodId ?? null;

      if (!pid) {
        alert(activePeriod.error ?? "No hay periodo activo.");
        setOpenPeriodModal(true);
        return;
      }

      await importStudentsXlsx(file, pid);

      const refreshPid = selectedPeriodId !== "ALL" ? selectedPeriodId : pid;
      await loadStudents(refreshPid);
      await loadCareerCards(refreshPid);

      alert("Importación completada ✅");
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "No se pudo importar el Excel");
    } finally {
      setImporting(false);
    }
  };

  // -------------------------
  // ✅ ADAPTER: Convertir backend data -> formato Modal
  // -------------------------
  const availableCareersFromBackend: CareerItem[] = useMemo(() => {
    return careerCards.map((c) => ({
      key: String(c.id), // ID real del backend convertido a string
      label: c.name.toUpperCase(),
      color: c.color ?? "#546e7a",
      // Construimos la URL completa si existe imagen
      imageUrl: c.coverImage 
        ? `${api.defaults.baseURL}/admin/careers/cover/${c.coverImage}` 
        : undefined,
      isFixed: true 
    }));
  }, [careerCards]);

  // -------------------------
  // AGRUPAR POR careerId (para UI)
  // -------------------------
  const groupedStudents = useMemo(() => {
    const groups: Record<number, AdminStudentRow[]> = {};
    const q = searchTerm.toLowerCase().trim();

    rows.forEach((s: any) => {
      const name = `${s.firstName || ""} ${s.lastName || ""}`.toLowerCase();
      const dni = String(s.dni ?? s.cedula ?? "");

      if (!q || name.includes(q) || dni.includes(q)) {
        const cid = Number(s.careerId);
        if (!Number.isFinite(cid)) return;

        if (!groups[cid]) groups[cid] = [];
        groups[cid].push(s);
      }
    });

    return groups;
  }, [rows, searchTerm]);

  // Stats por carrera
  const careerStats = useMemo(() => {
    return careerCards.map((c) => {
      const students = groupedStudents[c.id] || [];
      const reprobados = students.filter((s: any) => {
        const st = (s.status || s.estado || "").toUpperCase();
        return st === "REPROBADO" || st === "RETIRADO";
      }).length;

      return {
        key: String(c.id),
        label: c.name,
        total: students.length,
        reprobados,
        color: c.color ?? "#546e7a",
      };
    });
  }, [careerCards, groupedStudents]);

  // -------------------------
  // CREATE CAREER (Limpio: solo backend)
  // -------------------------
  const handleAddCareer = async () => {
    if (!newCareerName.trim()) return;

    try {
      const formData = new FormData();
      formData.append("name", newCareerName.trim());
      formData.append("color", newCareerColor);
      if (selectedFile) formData.append("image", selectedFile);

      // 1. Guardar en backend
      await createCareer(formData);
      
      // 2. Recargar lista real
      const pid = selectedPeriodId === "ALL" ? (activePeriod.periodId ?? "ALL") : selectedPeriodId;
      await loadCareerCards(pid);

      // 3. Resetear modal
      setOpenAddCareer(false);
      setNewCareerName("");
      setSelectedFile(null);
    } catch (e) {
      console.error("Error creating career", e);
    }
  };

  // -------------------------
  // CREATE PERIOD
  // -------------------------
  const handleCreatePeriod = async () => {
    try {
      if (!periodStart || !periodEnd) {
        alert("Debes seleccionar fecha inicio y fin");
        return;
      }

      const created = await createAcademicPeriod({
        startDate: periodStart.format("YYYY-MM-DD"),
        endDate: periodEnd.format("YYYY-MM-DD"),
        isActive: periodIsActive,
      });

      alert(`Periodo creado ✅: ${created.name}`);
      setOpenPeriodModal(false);
      await loadPeriods();

      if (created.isActive) {
        setSelectedPeriodId(created.id);
        localStorage.setItem("adminPeriodId", String(created.id));
        await loadStudents(created.id);
        await loadCareerCards(created.id);
      }
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "No se pudo crear el periodo");
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "#f4f7f6" }}>
        <AdminHeaderBar
          verde={VERDE_INSTITUCIONAL}
          importing={loading || importing}
          onOpenAssignCareer={() => setOpenAssignCareer(true)}
          onOpenCreateUser={() => setOpenCreateUser(true)}
          onRefresh={handleHardRefresh}
          onLogout={() => {
            logout();
            nav("/");
          }}
          userMenuAnchor={userMenuAnchor}
          openUserMenu={Boolean(userMenuAnchor)}
          onOpenMenu={(e) => setUserMenuAnchor(e.currentTarget)}
          onCloseMenu={() => setUserMenuAnchor(null)}
          onOpenProfile={() => {
            setOpenAdminProfile(true);
            setUserMenuAnchor(null);
          }}
          onUploadFile={handleFileUpload}
          onOpenPeriodModal={() => setOpenPeriodModal(true)}
          periods={periods}
          selectedPeriodId={selectedPeriodId}
          activePeriod={activePeriod}
          onChangePeriod={handleSelectPeriod}
          onReloadPeriods={loadPeriods}
          careerStats={careerStats}
        />

        <Container maxWidth={false} sx={{ py: 4, display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
          <CareersSection
            verde={VERDE_INSTITUCIONAL}
            cards={careerCards}
            onCareerClick={(careerId) => {
              const pid = selectedPeriodId === "ALL" ? (activePeriod.periodId ?? "") : selectedPeriodId;
              const card = careerCards.find((c) => c.id === careerId);
              const cName = card?.name ?? "Carrera";

              const base = `/admin/students/by-career?careerId=${careerId}&careerName=${encodeURIComponent(cName)}`;
              nav(pid ? `${base}&periodId=${pid}` : base);
            }}
            onOpenAddCareer={() => setOpenAddCareer(true)}
            onGoPredefense={() => nav("/admin/predefense")}
            onGoFinalDefense={() => nav("/admin/final-defense")}
            onReloadCards={() => loadCareerCards(selectedPeriodId)}
          />

          <GeneralListSection
            verde={VERDE_INSTITUCIONAL}
            careerCards={careerCards}
            groupedStudents={groupedStudents}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            getStudentName={(s) => `${(s as any).firstName || ""} ${(s as any).lastName || ""}`}
            getSemaforo={() => ({
              bg: "#e8f5e9",
              border: "#2e7d32",
              chipBg: "#2e7d32",
              chipText: "#fff",
              label: "SIN NOVEDAD",
            })}
            onViewProfile={(id) => nav(`/admin/students/${id}`)}
            onClearIncidents={() => {}}
          />
        </Container>

        {/* MODAL: Crear período */}
        <Dialog open={openPeriodModal} onClose={() => setOpenPeriodModal(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, bgcolor: VERDE_INSTITUCIONAL, color: "#fff" }}>
            Crear Período Académico
          </DialogTitle>

          <DialogContent dividers>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}>
              <DatePicker
                label="Fecha de Inicio"
                value={periodStart}
                onChange={(newValue) => setPeriodStart(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />

              <DatePicker
                label="Fecha de Fin"
                value={periodEnd}
                onChange={(newValue) => setPeriodEnd(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={periodIsActive}
                    onChange={(e) => setPeriodIsActive(e.target.checked)}
                    sx={{ color: VERDE_INSTITUCIONAL, "&.Mui-checked": { color: VERDE_INSTITUCIONAL } }}
                  />
                }
                label="Marcar como período activo"
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenPeriodModal(false)}>Cancelar</Button>
            <Button onClick={handleCreatePeriod} variant="contained" sx={{ bgcolor: VERDE_INSTITUCIONAL, fontWeight: 800 }}>
              Crear
            </Button>
          </DialogActions>
        </Dialog>

        {/* MODAL: Perfil admin */}
        <Dialog open={openAdminProfile} onClose={() => setOpenAdminProfile(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>Perfil del Administrador</DialogTitle>
          <DialogContent dividers>
            <Typography sx={{ mb: 1 }}>
              <b>Nombre:</b> {adminProfile?.fullName || "-"}
            </Typography>
            <Typography>
              <b>Cédula:</b> {adminProfile?.dni || "-"}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAdminProfile(false)}>Cerrar</Button>
          </DialogActions>
        </Dialog>

        {/* MODAL: Añadir carrera (legacy UI, pero backend logic) */}
        <Dialog open={openAddCareer} onClose={() => setOpenAddCareer(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>Añadir Carrera</DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
              <input
                placeholder="Nombre"
                value={newCareerName}
                onChange={(e) => setNewCareerName(e.target.value)}
                style={{ padding: 12, borderRadius: 8, border: "1px solid #ddd" }}
              />

              <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                Color:
              </Typography>

              <input
                type="color"
                value={newCareerColor}
                onChange={(e) => setNewCareerColor(e.target.value)}
                style={{ width: "100%", height: 40 }}
              />

              <Button variant="outlined" component="label" fullWidth sx={{ mt: 1 }}>
                {selectedFile ? selectedFile.name : "Subir Portada"}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </Button>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenAddCareer(false)}>Cancelar</Button>
            <Button onClick={handleAddCareer} variant="contained" sx={{ bgcolor: VERDE_INSTITUCIONAL }}>
              Guardar
            </Button>
          </DialogActions>
        </Dialog>

        {/* ✅ MODAL ASIGNAR: Usa datos reales del backend */}
        <AssignCareerModal
          open={openAssignCareer}
          onClose={() => setOpenAssignCareer(false)}
          onSuccess={() => loadStudents(selectedPeriodId)}
          availableCareers={availableCareersFromBackend}
        />

        <CreateUserModal
          open={openCreateUser}
          onClose={() => setOpenCreateUser(false)}
          onSuccess={() => loadStudents(selectedPeriodId)}
        />
      </Box>
    </LocalizationProvider>
  );
}