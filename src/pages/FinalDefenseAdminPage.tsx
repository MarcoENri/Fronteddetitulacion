import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Chip,
  Fade,
  Paper,
  MenuItem,
  Select,
  FormControl,
  Tooltip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";

import { listCareers } from "../services/careerService";
import type { CareerDto } from "../services/careerService";

import {
  adminFinalCreateWindow,
  adminFinalListWindows,
  adminFinalCloseWindow,
  adminFinalListSlots,
  adminFinalListStudentsByCareer,
  adminFinalListJuries,
  type FinalDefenseWindowDto,
  type FinalDefenseSlotDto,
  type FinalDefenseStudentMiniDto,
  type JuryUserDto,
} from "../services/finalDefenseService";

const VERDE = "#008B8B";

export default function FinalDefenseAdminPage() {
  const nav = useNavigate();
  const [careers, setCareers] = useState<CareerDto[]>([]);
  const [windows, setWindows] = useState<FinalDefenseWindowDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [careerId, setCareerId] = useState<number | "ALL">("ALL");

  const [startsAt, setStartsAt] = useState<Dayjs | null>(dayjs().add(1, "day").hour(8).minute(0));
  const [endsAt, setEndsAt] = useState<Dayjs | null>(dayjs().add(7, "day").hour(18).minute(0));

  const periodId = useMemo(() => {
    const ls = localStorage.getItem("adminPeriodId");
    if (!ls) return undefined;
    const n = Number(ls);
    return Number.isFinite(n) ? n : undefined;
  }, []);

  const [openManage, setOpenManage] = useState(false);
  const [activeWindow, setActiveWindow] = useState<FinalDefenseWindowDto | null>(null);
  const [manageCareerId, setManageCareerId] = useState<number | "">("");
  const [slots, setSlots] = useState<FinalDefenseSlotDto[]>([]);
  const [students, setStudents] = useState<FinalDefenseStudentMiniDto[]>([]);
  const [juries, setJuries] = useState< JuryUserDto[]>([]);

  const loadMain = async () => {
    setLoading(true);
    try {
      const [cs, ws] = await Promise.all([listCareers(), adminFinalListWindows(periodId)]);
      setCareers(Array.isArray(cs) ? cs : []);
      setWindows(Array.isArray(ws) ? ws : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMain(); }, []);

  const handleCreateWindow = async () => {
    if (!startsAt || !endsAt) return alert("Selecciona fecha inicio/fin válida");
    setLoading(true);
    try {
      await adminFinalCreateWindow({
        academicPeriodId: periodId ?? null,
        careerId: careerId === "ALL" ? null : careerId,
        startsAt: startsAt.format("YYYY-MM-DDTHH:mm:ss"),
        endsAt: endsAt.format("YYYY-MM-DDTHH:mm:ss"),
      });
      await loadMain();
      alert("Ventana creada ✅");
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Error");
    } finally { setLoading(false); }
  };

  const handleCloseWindow = async (id: number) => {
    if (!confirm("¿Cerrar esta ventana?")) return;
    setLoading(true);
    try {
      await adminFinalCloseWindow(id);
      await loadMain();
    } finally { setLoading(false); }
  };

  const openWindowManage = async (w: FinalDefenseWindowDto) => {
    setActiveWindow(w);
    setOpenManage(true);
    setManageCareerId(w.careerId ?? "");
    setLoading(true);
    try {
      const [sl, ju] = await Promise.all([adminFinalListSlots(w.id), adminFinalListJuries()]);
      setSlots(sl);
      setJuries(ju);
      if (w.careerId) {
        const st = await adminFinalListStudentsByCareer(w.careerId, periodId);
        setStudents(st);
      } else { setStudents([]); }
    } finally { setLoading(false); }
  };

  const ovalButtonStyle = {
    borderRadius: "50px",
    textTransform: "none",
    fontWeight: 900,
    px: 3,
    transition: "all 0.2s ease-in-out",
    "&:hover": { transform: "scale(1.05)" }
  };

  const premiumInputStyle = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "14px",
      backgroundColor: "#fff",
      "& fieldset": { borderColor: "#dcdde1" },
      "&.Mui-focused fieldset": { borderColor: VERDE, borderWidth: "2px" },
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f7f9" }}>
      
      {/* HEADER: AHORA MÁS DELGADO (Altura mínima) */}
      <Box sx={{ 
        width: "100%", 
        bgcolor: VERDE, 
        color: "#fff", 
        py: 0.8, // Padding vertical súper reducido
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        display: "flex",
        justifyContent: "center"
      }}>
        <Box sx={{ 
          width: "100%", 
          px: { xs: 2, md: 6 }, 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center" 
        }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1 }}>
              Defensa Final
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 700, fontSize: "0.65rem", textTransform: "uppercase" }}>
              Panel de Administración
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<ArrowBackIosNewRoundedIcon sx={{ fontSize: "12px !important" }} />}
            onClick={() => nav("/admin")}
            sx={{ 
              ...ovalButtonStyle, 
              bgcolor: "#fff", 
              color: VERDE, 
              fontSize: "0.75rem",
              py: 0.3, // Botón más pequeño
              "&:hover": { bgcolor: "#f0f0f0" } 
            }}
          >
            Volver
          </Button>
        </Box>
      </Box>

      {/* CUERPO PRINCIPAL */}
      <Container maxWidth="md" sx={{ mt: 3, mb: 3, flexGrow: 1 }}>
        <Fade in timeout={800}>
          <Box>
            <Paper sx={{ p: 4, borderRadius: "24px", mb: 4, boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
              <Typography sx={{ fontWeight: 900, mb: 3, display: "flex", alignItems: "center", gap: 1, color: "#333" }}>
                <CalendarMonthRoundedIcon sx={{ color: VERDE }} /> Programar Nueva Ventana
              </Typography>

              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr auto" }, gap: 2, alignItems: "center" }}>
                  <DateTimePicker
                    label="Fecha Inicio"
                    value={startsAt}
                    onChange={(v) => setStartsAt(v)}
                    viewRenderers={{ hours: renderTimeViewClock, minutes: renderTimeViewClock }}
                    slotProps={{ textField: { fullWidth: true, size: "small", sx: premiumInputStyle } }}
                  />
                  <DateTimePicker
                    label="Fecha Fin"
                    value={endsAt}
                    onChange={(v) => setEndsAt(v)}
                    viewRenderers={{ hours: renderTimeViewClock, minutes: renderTimeViewClock }}
                    slotProps={{ textField: { fullWidth: true, size: "small", sx: premiumInputStyle } }}
                  />
                  
                  <FormControl fullWidth size="small" sx={{ 
                    "& .MuiOutlinedInput-root": { 
                      borderRadius: "14px",
                      border: `2px solid ${VERDE}`,
                      fontWeight: 900,
                      transition: "transform 0.3s ease",
                      "&:hover": { transform: "scale(1.02)" }
                    }
                  }}>
                    <Select
                      value={careerId}
                      onChange={(e) => setCareerId(e.target.value as any)}
                      sx={{ "& .MuiSelect-select": { py: 1.2 } }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            maxHeight: 250, // Menú desplegable con scroll
                            borderRadius: "12px",
                            "&::-webkit-scrollbar": { width: "5px" },
                            "&::-webkit-scrollbar-thumb": { background: VERDE, borderRadius: "10px" }
                          }
                        }
                      }}
                    >
                      <MenuItem value="ALL" sx={{ fontWeight: 800 }}>TODAS LAS CARRERAS</MenuItem>
                      {careers.map((c) => (
                        <MenuItem key={c.id} value={c.id} sx={{ fontWeight: 700 }}>
                          {c.name.toUpperCase()}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Tooltip title="Crear ventana de defensa" arrow>
                    <Button
                      onClick={handleCreateWindow}
                      disabled={loading}
                      variant="contained"
                      sx={{
                        minWidth: "40px",
                        width: "40px",
                        height: "40px",
                        borderRadius: "50px",
                        bgcolor: VERDE,
                        p: 0,
                        overflow: "hidden",
                        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": { width: "160px", bgcolor: VERDE },
                        "& .btn-text": { display: "none", whiteSpace: "nowrap", ml: 1, fontSize: "0.8rem" },
                        "&:hover .btn-text": { display: "inline-block" }
                      }}
                    >
                      <AddRoundedIcon fontSize="small" />
                      <span className="btn-text">Crear defensa</span>
                    </Button>
                  </Tooltip>
                </Box>
              </LocalizationProvider>
            </Paper>

            <Typography sx={{ fontWeight: 900, mb: 2, px: 1, color: "#444" }}>Ventanas Existentes</Typography>
            
            <Box sx={{ 
              maxHeight: "450px", 
              overflowY: "auto", 
              pr: 1,
              "&::-webkit-scrollbar": { width: "6px" },
              "&::-webkit-scrollbar-thumb": { backgroundColor: "#ccc", borderRadius: "10px" }
            }}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
                {windows.map((w, index) => (
                  <Fade in timeout={400 + index * 100} key={w.id}>
                    <Paper sx={{ p: 3, borderRadius: "20px", borderLeft: `6px solid ${w.isActive ? VERDE : "#ccc"}`, position: "relative" }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography sx={{ fontWeight: 900, fontSize: "1rem", color: "#222" }}>
                          {w.careerName || "MULTICARRERA"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#666", fontWeight: 700 }}>
                          {dayjs(w.startsAt).format("DD/MM/YYYY HH:mm")} — {dayjs(w.endsAt).format("DD/MM/YYYY HH:mm")}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Chip 
                          label={w.isActive ? "ACTIVA" : "CERRADA"} 
                          size="small"
                          sx={{ fontWeight: 900, fontSize: "0.65rem", bgcolor: w.isActive ? "#e0f2f1" : "#f5f5f5", color: w.isActive ? VERDE : "#999" }} 
                        />
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button size="small" variant="outlined" onClick={() => openWindowManage(w)} sx={{ ...ovalButtonStyle, py: 0.2, fontSize: "0.7rem", borderColor: VERDE, color: VERDE }}>
                            Gestionar
                          </Button>
                          {w.isActive && (
                            <Button size="small" variant="contained" onClick={() => handleCloseWindow(w.id)} sx={{ ...ovalButtonStyle, py: 0.2, fontSize: "0.7rem", bgcolor: "#ff5252" }}>
                              Cerrar
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </Paper>
                  </Fade>
                ))}
              </Box>
            </Box>
          </Box>
        </Fade>
      </Container>

      {/* FOOTER: AHORA MÁS DELGADO (Altura mínima) */}
      <Box sx={{ width: "100%", bgcolor: VERDE, color: "#fff", py: 0.5, mt: "auto" }}>
        <Container maxWidth={false} sx={{ display: "flex", justifyContent: "center" }}>
          <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.8, fontSize: "0.65rem" }}>
            © {new Date().getFullYear()} - Sistema de Gestión de Defensas Finales
          </Typography>
        </Container>
      </Box>

      {/* Modal Gestionar */}
      <Dialog open={openManage} onClose={() => setOpenManage(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "20px" } }}>
        <DialogTitle sx={{ fontWeight: 900, bgcolor: "#fafafa", py: 1.5, borderBottom: "1px solid #eee" }}>
          Gestión de Ventana #{activeWindow?.id}
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Typography sx={{ color: "#666" }}>Contenido de gestión aquí...</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 1, bgcolor: "#fafafa" }}>
          <Button onClick={() => setOpenManage(false)} sx={{ fontWeight: 900, color: VERDE }}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}