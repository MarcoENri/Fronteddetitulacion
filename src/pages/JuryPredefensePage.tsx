// src/pages/JuryPredefensePage.tsx
import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
  Paper,
  Stack,
  Avatar,
  Drawer,
  IconButton,
  Divider,
  Tooltip,
  Chip,
  FormControl,
  Select,
  MenuItem,
  Fade,
  AppBar,
  Toolbar,
  ListItemText,
} from "@mui/material";
import {
  Logout as LogoutOutlined,
  Close as CloseIcon,
  PhotoCamera as PhotoCameraIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  AccountCircle as AccountCircleIcon,
  Add as AddIcon,
  BookOnline as BookOnlineIcon,
  Send as SendIcon,
  School as SchoolIcon,
  CalendarMonth as CalendarMonthIcon,
  AccessTime as AccessTimeIcon,
} from "@mui/icons-material";
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";

import { listCareers } from "../services/careerService";
import type { CareerDto } from "../services/careerService";
import {
  juryListStudentsByCareer,
  juryListWindowsByCareer,
  juryListSlots,
  juryBookSlot,
  juryCreateObservation,
  juryCreateSlot,
} from "../services/predefenseService";

const VERDE_INSTITUCIONAL = "#008B8B";

export default function JuryPredefensePage() {
  const nav = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [careers, setCareers] = useState<CareerDto[]>([]);
  const [careerId, setCareerId] = useState<number | null>(null);

  const [students, setStudents] = useState<any[]>([]);
  const [windows, setWindows] = useState<any[]>([]);
  const [windowId, setWindowId] = useState<number | null>(null);

  const [slots, setSlots] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  const [slotStartsAt, setSlotStartsAt] = useState<Dayjs | null>(
    dayjs().add(1, "hour").startOf("hour")
  );
  const [slotEndsAt, setSlotEndsAt] = useState<Dayjs | null>(
    dayjs().add(1, "hour").add(30, "minute").startOf("hour")
  );

  const [obsText, setObsText] = useState("");
  const [loading, setLoading] = useState(false);

  const juryInfo = useMemo(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return {
          username: user.username || user.email?.split("@")[0] || "",
          name: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "",
          email: user.email || "",
          role: user.role || "Jurado",
        };
      } catch {
        return { username: "", name: "", email: "", role: "Jurado" };
      }
    }
    return { username: "", name: "", email: "", role: "Jurado" };
  }, []);

  const periodId = useMemo(() => {
    const ls = localStorage.getItem("periodId");
    if (!ls) return undefined;
    const n = Number(ls);
    return Number.isFinite(n) ? n : undefined;
  }, []);

  useEffect(() => {
    (async () => {
      const cs = await listCareers();
      setCareers(Array.isArray(cs) ? cs : []);
    })();

    const savedPhoto = localStorage.getItem("juryPhoto");
    if (savedPhoto) {
      setPhotoPreview(savedPhoto);
    }
  }, []);

  const handleLogout = () => {
    if (!confirm("¿Estás seguro de que deseas cerrar sesión?")) return;
    localStorage.clear();
    nav("/");
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const photoData = reader.result as string;
        setPhotoPreview(photoData);
        localStorage.setItem("juryPhoto", photoData);
      };
      reader.readAsDataURL(file);
    }
  };

  const loadCareer = async (cid: number) => {
    setLoading(true);
    try {
      const [ss, ws] = await Promise.all([
        juryListStudentsByCareer(cid, periodId),
        juryListWindowsByCareer(cid, periodId),
      ]);

      setStudents(Array.isArray(ss) ? ss : []);
      setWindows(Array.isArray(ws) ? ws : []);

      const firstWindowId = ws?.[0]?.id ?? null;
      setWindowId(firstWindowId);

      setSelectedStudentId(ss?.[0]?.id ?? null);

      if (firstWindowId) {
        const sl = await juryListSlots(firstWindowId);
        setSlots(sl);
      } else {
        setSlots([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWindow = async (wid: number) => {
    setWindowId(wid);
    setSelectedStudentId(null);

    setLoading(true);
    try {
      const sl = await juryListSlots(wid);
      setSlots(sl);
    } finally {
      setLoading(false);
    }
  };

  const loadSlotsOnly = async (wid: number) => {
    setLoading(true);
    try {
      const sl = await juryListSlots(wid);
      setSlots(sl);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = async () => {
    if (!windowId) return alert("Selecciona una ventana");
    if (!slotStartsAt || !slotEndsAt) return alert("Selecciona fechas válidas");

    setLoading(true);
    try {
      const startStr = slotStartsAt.format("YYYY-MM-DDTHH:mm:ss");
      const endStr = slotEndsAt.format("YYYY-MM-DDTHH:mm:ss");

      await juryCreateSlot(windowId, startStr, endStr);
      await loadSlotsOnly(windowId);
      alert("Slot creado correctamente ✅");
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "No se pudo crear slot");
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async (slotId: number) => {
    if (selectedStudentId == null) return alert("Selecciona un estudiante");

    setLoading(true);
    try {
      await juryBookSlot({ slotId, studentId: selectedStudentId });
      await loadSlotsOnly(windowId!);
      alert("Reservado ✅");
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "No se pudo reservar");
    } finally {
      setLoading(false);
    }
  };

  const handleSendObservation = async (bookingId: number) => {
    if (!obsText.trim()) return alert("Escribe una observación");
    setLoading(true);
    try {
      await juryCreateObservation(bookingId, { text: obsText.trim() });
      setObsText("");
      alert("Observación enviada + email ✅");
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "No se pudo enviar observación");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (juryInfo?.name) {
      const parts = juryInfo.name.split(" ");
      if (parts.length >= 2) {
        return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
      }
      return juryInfo.name.charAt(0).toUpperCase();
    }
    if (juryInfo?.username) {
      return juryInfo.username.charAt(0).toUpperCase();
    }
    return "J";
  };

  // ESTILOS PREMIUM
  const cleanPopperStyle = {
    "& .MuiPaper-root": {
      bgcolor: "#fff",
      color: "#333",
      borderRadius: "20px",
      boxShadow: "0 15px 45px rgba(0,0,0,0.15)",
      border: "1px solid #eee",
      "& .MuiTypography-root, & .MuiButtonBase-root": { color: "#444", fontWeight: 700 },
      "& .MuiPickersDay-root": {
        "&.Mui-selected": { bgcolor: VERDE_INSTITUCIONAL, color: "#fff", "&:hover": { bgcolor: VERDE_INSTITUCIONAL } },
        "&.MuiPickersDay-today": { borderColor: VERDE_INSTITUCIONAL },
      },
      "& .MuiClock-pin": { bgcolor: VERDE_INSTITUCIONAL },
      "& .MuiClockPointer-root": { bgcolor: VERDE_INSTITUCIONAL },
      "& .MuiClockPointer-thumb": { bgcolor: VERDE_INSTITUCIONAL, borderColor: VERDE_INSTITUCIONAL },
      "& .MuiClockNumber-root": { fontWeight: 800 },
      "& .MuiDialogActions-root .MuiButton-root": { color: VERDE_INSTITUCIONAL, fontWeight: 900 }
    }
  };

  const premiumInputStyle = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "14px",
      transition: "all 0.2s ease-in-out",
      backgroundColor: "#fff",
      "& input": { fontWeight: 900, color: "#000", fontSize: "0.95rem" },
      "& fieldset": { borderColor: "#dcdde1", borderWidth: "1.5px" },
      "&:hover": { transform: "scale(1.01)", "& fieldset": { borderColor: "#000" } },
      "&.Mui-focused": { "& fieldset": { borderColor: VERDE_INSTITUCIONAL, borderWidth: "2px" } },
    },
    "& .MuiInputLabel-root": { fontWeight: 800, color: "#666" },
    "& .MuiInputLabel-root.Mui-focused": { color: VERDE_INSTITUCIONAL },
  };

  const ovalSelectStyle = {
    "&.MuiOutlinedInput-root": {
      borderRadius: "50px",
      backgroundColor: "#fff",
      "& .MuiSelect-select": { fontWeight: 900, px: 3, py: 1 },
      "& fieldset": { borderColor: "#dcdde1", borderWidth: "1.5px" },
      "&.Mui-focused": { "& fieldset": { borderColor: VERDE_INSTITUCIONAL, borderWidth: "2px" } },
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Box sx={{ minHeight: "100vh", background: "#f5f7f9", display: "flex", flexDirection: "column" }}>
        
        {/* HEADER DELGADO */}
        <AppBar position="static" sx={{ bgcolor: VERDE_INSTITUCIONAL, elevation: 2, zIndex: 1100 }}>
          <Toolbar sx={{ justifyContent: "space-between", px: { md: 5 }, minHeight: "56px !important", py: 0.8 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                Predefensas
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)", fontWeight: 700, fontSize: "0.65rem" }}>
                PANEL DE JURADO {periodId ? `— Periodo: ${periodId}` : ""}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Button 
                variant="contained" 
                size="small"
                startIcon={<ArrowBackIosNewRoundedIcon sx={{ fontSize: '12px !important' }} />}
                onClick={() => nav("/jury/final-defense")} 
                sx={{ 
                  bgcolor: "#fff", 
                  color: VERDE_INSTITUCIONAL, 
                  fontWeight: 900, 
                  borderRadius: "50px", 
                  px: 2, 
                  fontSize: "0.75rem", 
                  textTransform: 'none', 
                  "&:hover": { bgcolor: "#f1f2f6" } 
                }}
              >
                Defensa Final
              </Button>

              <IconButton
                onClick={() => setDrawerOpen(true)}
                sx={{
                  color: "white",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                  p: 0,
                }}
              >
                <Avatar
                  src={photoPreview || undefined}
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: "white",
                    color: VERDE_INSTITUCIONAL,
                    fontWeight: 900,
                  }}
                >
                  {getInitials()}
                </Avatar>
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        {/* CONTENIDO CON ANIMACIÓN */}
        <Fade in={true} timeout={800}>
          <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
            <Stack spacing={3}>
              
              {/* CARRERA */}
              <Fade in={true} timeout={400}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: "25px", border: "1px solid #e1e8ed", boxShadow: "0 10px 30px rgba(0,0,0,0.04)" }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <SchoolIcon sx={{ color: VERDE_INSTITUCIONAL }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "#333" }}>
                      Seleccionar Carrera
                    </Typography>
                  </Box>

                  <FormControl fullWidth>
                    <Select
                      size="small"
                      displayEmpty
                      value={careerId ?? ""}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setCareerId(v);
                        loadCareer(v);
                      }}
                      sx={ovalSelectStyle}
                      renderValue={(selected: any) => {
                        if (!selected) return <span style={{ color: "#95a5a6" }}>SELECCIONA UNA CARRERA</span>;
                        return careers.find(c => c.id === selected)?.name.toUpperCase() || "CARRERA";
                      }}
                      MenuProps={{
                        PaperProps: { 
                          sx: { 
                            borderRadius: "16px", 
                            mt: 1, 
                            maxHeight: 300, 
                            "&::-webkit-scrollbar": { width: "5px" },
                            "&::-webkit-scrollbar-thumb": { background: VERDE_INSTITUCIONAL, borderRadius: "10px" }
                          } 
                        },
                      }}
                    >
                      <MenuItem value="" disabled>SELECCIONA UNA CARRERA</MenuItem>
                      {careers.map((c) => (
                        <MenuItem key={c.id} value={c.id} sx={{ mb: 0.5, borderRadius: "10px", px: 2 }}>
                          <ListItemText 
                            primary={c.name} 
                            primaryTypographyProps={{ fontWeight: 900, fontSize: "0.8rem", textTransform: "uppercase" }} 
                          />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Paper>
              </Fade>

              {/* VENTANA ACTIVA + CREAR SLOT */}
              <Fade in={true} timeout={600}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: "25px", border: "1px solid #e1e8ed", boxShadow: "0 10px 30px rgba(0,0,0,0.04)" }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <CalendarMonthIcon sx={{ color: VERDE_INSTITUCIONAL }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "#333" }}>
                      Ventana Activa
                    </Typography>
                  </Box>

                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <Select
                      size="small"
                      displayEmpty
                      value={windowId ?? ""}
                      onChange={(e) => handleSelectWindow(Number(e.target.value))}
                      sx={ovalSelectStyle}
                      disabled={!windows.length}
                      renderValue={(selected: any) => {
                        if (!selected) return <span style={{ color: "#95a5a6" }}>SELECCIONA UNA VENTANA</span>;
                        const win = windows.find(w => w.id === selected);
                        if (!win) return "Ventana";
                        
                        const start = dayjs(win.startsAt).format("DD/MM/YY HH:mm");
                        const end = dayjs(win.endsAt).format("DD/MM/YY HH:mm");
                        return `${start} → ${end} (${win.isActive ? "ACTIVA" : "CERRADA"})`;
                      }}
                    >
                      <MenuItem value="" disabled>SELECCIONA UNA VENTANA</MenuItem>
                      {windows.map((w) => {
                        const start = dayjs(w.startsAt).format("DD/MM/YYYY HH:mm");
                        const end = dayjs(w.endsAt).format("DD/MM/YYYY HH:mm");
                        
                        return (
                          <MenuItem key={w.id} value={w.id} sx={{ mb: 0.5, borderRadius: "10px", px: 2 }}>
                            <ListItemText 
                              primary={`${start} → ${end}`}
                              secondary={w.isActive ? "ACTIVA" : "CERRADA"}
                              primaryTypographyProps={{ fontWeight: 900, fontSize: "0.8rem" }}
                              secondaryTypographyProps={{ fontSize: "0.7rem", fontWeight: 700, color: w.isActive ? VERDE_INSTITUCIONAL : "#c62828" }}
                            />
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <AccessTimeIcon sx={{ color: VERDE_INSTITUCIONAL }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: "#555" }}>
                      Crear Nuevo Slot de Tiempo
                    </Typography>
                  </Box>

                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
                    <DateTimePicker
                      label="Inicio del Slot"
                      value={slotStartsAt}
                      onChange={(v) => setSlotStartsAt(v)}
                      ampm={false}
                      viewRenderers={{ hours: renderTimeViewClock, minutes: renderTimeViewClock }}
                      slotProps={{ 
                        textField: { fullWidth: true, size: "small", sx: premiumInputStyle },
                        popper: { sx: { ...cleanPopperStyle, zIndex: 1300 } }
                      }}
                    />
                    <DateTimePicker
                      label="Fin del Slot"
                      value={slotEndsAt}
                      onChange={(v) => setSlotEndsAt(v)}
                      ampm={false}
                      viewRenderers={{ hours: renderTimeViewClock, minutes: renderTimeViewClock }}
                      slotProps={{ 
                        textField: { fullWidth: true, size: "small", sx: premiumInputStyle },
                        popper: { sx: { ...cleanPopperStyle, zIndex: 1300 } }
                      }}
                    />
                  </Box>

                  <Button
                    onClick={handleCreateSlot}
                    disabled={loading || !windowId}
                    variant="contained"
                    startIcon={<AddIcon />}
                    fullWidth
                    sx={{
                      bgcolor: VERDE_INSTITUCIONAL,
                      fontWeight: 900,
                      borderRadius: "50px",
                      py: 1.5,
                      textTransform: 'none',
                      "&:hover": { bgcolor: "#007070", transform: 'scale(1.02)' },
                    }}
                  >
                    Crear Slot
                  </Button>
                </Paper>
              </Fade>

              {/* ESTUDIANTE A RESERVAR */}
              <Fade in={true} timeout={700}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: "25px", border: "1px solid #e1e8ed", boxShadow: "0 10px 30px rgba(0,0,0,0.04)" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2, color: "#333" }}>
                    Estudiante a Reservar ({students.length})
                  </Typography>

                  <FormControl fullWidth>
                    <Select
                      size="small"
                      displayEmpty
                      value={selectedStudentId ?? ""}
                      onChange={(e) => setSelectedStudentId(Number(e.target.value))}
                      sx={ovalSelectStyle}
                      disabled={!students.length}
                      renderValue={(selected: any) => {
                        if (!selected) return <span style={{ color: "#95a5a6" }}>SELECCIONA UN ESTUDIANTE</span>;
                        const st = students.find(s => s.id === selected);
                        return st ? `${st.fullName} — ${st.dni}` : "Estudiante";
                      }}
                    >
                      <MenuItem value="" disabled>SELECCIONA UN ESTUDIANTE</MenuItem>
                      {students.map((s) => (
                        <MenuItem key={s.id} value={s.id} sx={{ mb: 0.5, borderRadius: "10px", px: 2 }}>
                          <ListItemText 
                            primary={s.fullName}
                            secondary={`${s.dni} — ${s.status}`}
                            primaryTypographyProps={{ fontWeight: 900, fontSize: "0.8rem" }}
                            secondaryTypographyProps={{ fontSize: "0.7rem" }}
                          />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Paper>
              </Fade>

              {/* SLOTS */}
              <Fade in={true} timeout={800}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: "25px", border: "1px solid #e1e8ed", boxShadow: "0 10px 30px rgba(0,0,0,0.04)" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2, color: "#333" }}>
                    Slots de Tiempo ({slots.length})
                  </Typography>

                  {slots.map((sl, index) => {
                    const start = dayjs(sl.startsAt).format("DD/MM/YYYY HH:mm");
                    const end = dayjs(sl.endsAt).format("DD/MM/YYYY HH:mm");
                    
                    return (
                      <Fade in={true} timeout={300 + index * 100} key={sl.id}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2.5,
                            mb: 2,
                            border: `2px solid ${sl.booked ? "#ff7675" : VERDE_INSTITUCIONAL}`,
                            borderRadius: "20px",
                            bgcolor: sl.booked ? "#fff5f5" : "#f0fff4",
                            transition: "all 0.2s",
                            "&:hover": { transform: 'scale(1.01)', boxShadow: "0 5px 15px rgba(0,0,0,0.08)" }
                          }}
                        >
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                            <Typography sx={{ fontWeight: 900, fontSize: "0.95rem" }}>
                              {start} → {end}
                            </Typography>
                            <Chip
                              label={sl.booked ? "RESERVADO" : "LIBRE"}
                              size="small"
                              sx={{
                                bgcolor: sl.booked ? "#ff7675" : VERDE_INSTITUCIONAL,
                                color: "#fff",
                                fontWeight: 900,
                                fontSize: "0.7rem"
                              }}
                            />
                          </Box>

                          {!sl.booked ? (
                            <Button
                              onClick={() => handleReserve(sl.id)}
                              disabled={loading}
                              variant="contained"
                              startIcon={<BookOnlineIcon />}
                              fullWidth
                              sx={{
                                bgcolor: VERDE_INSTITUCIONAL,
                                fontWeight: 900,
                                borderRadius: "50px",
                                textTransform: 'none',
                                py: 1.2,
                                "&:hover": { bgcolor: "#007070" },
                              }}
                            >
                              Reservar con estudiante seleccionado
                            </Button>
                          ) : (
                            <Box sx={{ mt: 1.5 }}>
                              <Typography variant="caption" sx={{ color: "#666", fontWeight: 700, display: 'block', mb: 1 }}>
                                Booking ID: {sl.bookingId}
                              </Typography>
                              <TextField
                                label="Observación (envía email al estudiante)"
                                value={obsText}
                                onChange={(e) => setObsText(e.target.value)}
                                fullWidth
                                multiline
                                minRows={2}
                                size="small"
                                sx={premiumInputStyle}
                              />
                              <Button
                                onClick={() => handleSendObservation(sl.bookingId)}
                                disabled={loading}
                                variant="contained"
                                startIcon={<SendIcon />}
                                fullWidth
                                sx={{
                                  mt: 1.5,
                                  bgcolor: "#0b7f7a",
                                  fontWeight: 900,
                                  borderRadius: "50px",
                                  textTransform: 'none',
                                  py: 1.2,
                                  "&:hover": { bgcolor: "#096b66" },
                                }}
                              >
                                Enviar observación
                              </Button>
                            </Box>
                          )}
                        </Paper>
                      </Fade>
                    );
                  })}

                  {!slots.length && (
                    <Typography sx={{ color: "#777", textAlign: "center", py: 4, fontStyle: "italic" }}>
                      No hay slots todavía. Crea uno arriba.
                    </Typography>
                  )}
                </Paper>
              </Fade>
            </Stack>
          </Container>
        </Fade>

        {/* FOOTER DELGADO */}
        <Box sx={{ width: "100%", bgcolor: VERDE_INSTITUCIONAL, color: "#fff", py: 0.5, mt: "auto", textAlign: "center" }}>
          <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.8, fontSize: "0.65rem" }}>
            © {new Date().getFullYear()} - Panel de Jurado - Predefensas
          </Typography>
        </Box>

        {/* DRAWER PERFIL */}
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{
            sx: {
              width: { xs: "100%", sm: 360 },
              bgcolor: "rgba(255, 255, 255, 0.98)",
              backdropFilter: "blur(10px)",
            },
          }}
        >
          <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Box
              sx={{
                p: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #eee",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 900, color: VERDE_INSTITUCIONAL }}>
                Mi Perfil
              </Typography>

              <Box sx={{ display: "flex", gap: 0.5 }}>
                <Tooltip title="Cerrar Sesión" arrow>
                  <IconButton
                    onClick={handleLogout}
                    size="small"
                    sx={{ color: "#d32f2f", "&:hover": { bgcolor: "rgba(211, 47, 47, 0.08)" } }}
                  >
                    <LogoutOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>

                <IconButton onClick={() => setDrawerOpen(false)} size="small">
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            <Box sx={{ flex: 1, overflow: "auto", p: 2.5 }}>
              <Box sx={{ textAlign: "center", mb: 2.5 }}>
                <Avatar
                  src={photoPreview || undefined}
                  sx={{
                    width: 90,
                    height: 90,
                    fontSize: "2.2rem",
                    mx: "auto",
                    mb: 1.5,
                    bgcolor: VERDE_INSTITUCIONAL,
                    border: "3px solid #f0f2f5",
                  }}
                >
                  {getInitials()}
                </Avatar>

                <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.5, fontSize: "1rem" }}>
                  {juryInfo?.name || juryInfo?.username || "Usuario"}
                </Typography>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                  accept="image/*"
                  style={{ display: "none" }}
                />

                <Button
                  variant="text"
                  startIcon={<PhotoCameraIcon fontSize="small" />}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    color: VERDE_INSTITUCIONAL,
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    "&:hover": { bgcolor: "rgba(0, 139, 139, 0.05)" },
                  }}
                >
                  Cambiar Foto
                </Button>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Stack spacing={1.2}>
                <Paper elevation={0} sx={{ p: 1.2, bgcolor: "rgba(248, 249, 250, 0.9)", borderRadius: 5, border: "1px solid #e9ecef" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                    <AccountCircleIcon sx={{ color: VERDE_INSTITUCIONAL, fontSize: 20 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ color: "#6c757d", fontWeight: 600, fontSize: "0.65rem" }}>
                        Username
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: juryInfo?.username ? "#212529" : "#adb5bd", fontSize: "0.813rem" }}>
                        {juryInfo?.username || "Sin asignar"}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                <Paper elevation={0} sx={{ p: 1.2, bgcolor: "rgba(248, 249, 250, 0.9)", borderRadius: 5, border: "1px solid #e9ecef" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                    <PersonIcon sx={{ color: VERDE_INSTITUCIONAL, fontSize: 20 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ color: "#6c757d", fontWeight: 600, fontSize: "0.65rem" }}>
                        Nombre Completo
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: juryInfo?.name ? "#212529" : "#adb5bd", fontSize: "0.813rem" }}>
                        {juryInfo?.name || "Sin asignar"}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                <Paper elevation={0} sx={{ p: 1.2, bgcolor: "rgba(248, 249, 250, 0.9)", borderRadius: 5, border: "1px solid #e9ecef" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                    <EmailIcon sx={{ color: VERDE_INSTITUCIONAL, fontSize: 20 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ color: "#6c757d", fontWeight: 600, fontSize: "0.65rem" }}>
                        Email
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: juryInfo?.email ? "#212529" : "#adb5bd", fontSize: "0.813rem", wordBreak: "break-word" }}>
                        {juryInfo?.email || "Sin asignar"}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                <Paper elevation={0} sx={{ p: 1.2, bgcolor: "rgba(248, 249, 250, 0.9)", borderRadius: 5, border: "1px solid #e9ecef" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                    <BadgeIcon sx={{ color: VERDE_INSTITUCIONAL, fontSize: 20 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ color: "#6c757d", fontWeight: 600, fontSize: "0.65rem", mb: 0.3, display: "block" }}>
                        Rol
                      </Typography>
                      <Chip
                        label={juryInfo?.role || "Sin asignar"}
                        size="small"
                        sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", fontWeight: 700, fontSize: "0.7rem", height: "22px" }}
                      />
                    </Box>
                  </Box>
                </Paper>
              </Stack>
            </Box>
          </Box>
        </Drawer>
      </Box>
    </LocalizationProvider>
  );
}