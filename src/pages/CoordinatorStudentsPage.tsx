import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Avatar,
  Drawer,
  IconButton,
  Divider,
  Stack,
  Paper,
  Tooltip,
  Button,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Logout as LogoutOutlined,
  Close as CloseIcon,
  PhotoCamera as PhotoCameraIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  AccountCircle as AccountCircleIcon,
  Gavel as GavelIcon,
} from "@mui/icons-material";

import { logout } from "../services/authService";
import type { CoordinatorStudentRow } from "../services/coordinatorService";
import { listCoordinatorStudents } from "../services/coordinatorService";
import { getActiveAcademicPeriod } from "../services/periodService";

const VERDE_INSTITUCIONAL = "#008B8B";

export default function CoordinatorStudentsPage() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<CoordinatorStudentRow[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nav = useNavigate();
  const [sp] = useSearchParams();

  const coordinatorInfo = useMemo(() => {
    const possibleKeys = ["user", "currentUser", "userData", "authUser"];
    let user = null;
    for (const key of possibleKeys) {
      const userStr = localStorage.getItem(key);
      if (userStr) {
        try {
          user = JSON.parse(userStr);
          break;
        } catch (e) {}
      }
    }
    if (!user) return { username: "", name: "", email: "", role: "Coordinador" };

    return {
      username: user.username || user.userName || user.user || user.email?.split("@")[0] || "",
      name: user.name || user.fullName || user.displayName ||
            (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : "") ||
            (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : "") || "",
      email: user.email || user.correo || user.mail || "",
      role: user.role || user.rol || user.type || user.userType || "Coordinador",
    };
  }, []);

  const fallbackPeriodId = useMemo(() => {
    const q = sp.get("periodId");
    if (q && !Number.isNaN(Number(q))) return Number(q);
    const ls = localStorage.getItem("periodId");
    if (ls && !Number.isNaN(Number(ls))) return Number(ls);
    return null;
  }, [sp]);

  const [periodId, setPeriodId] = useState<number | null>(fallbackPeriodId);

  const resolvePeriod = async (): Promise<number | null> => {
    if (periodId) return periodId;
    if (fallbackPeriodId) {
      setPeriodId(fallbackPeriodId);
      return fallbackPeriodId;
    }
    try {
      const p = await getActiveAcademicPeriod();
      if (!p?.id) return null;
      localStorage.setItem("periodId", String(p.id));
      setPeriodId(p.id);
      return p.id;
    } catch (e: any) {
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        logout();
        nav("/");
        return null;
      }
      return null;
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const pid = await resolvePeriod();
      if (!pid) {
        alert("No hay período académico activo. Pide al administrador que lo active.");
        setRows([]);
        return;
      }
      const data = await listCoordinatorStudents(pid);
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error(e?.response?.data ?? e);
      alert(e?.response?.data?.message ?? "No se pudo cargar estudiantes");
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        logout();
        nav("/");
      } else setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const savedPhoto = localStorage.getItem("coordinatorPhoto");
    if (savedPhoto) setPhotoPreview(savedPhoto);
  }, []);

  const handleLogout = () => {
    if (!confirm("¿Estás seguro de que deseas cerrar sesión?")) return;
    logout();
    nav("/");
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Archivo inválido"); return; }
    if (file.size > 5 * 1024 * 1024) { alert("Imagen muy grande"); return; }

    const reader = new FileReader();
    reader.onloadend = () => {
      const photoData = reader.result as string;
      setPhotoPreview(photoData);
      localStorage.setItem("coordinatorPhoto", photoData);
    };
    reader.readAsDataURL(file);
  };

  const getStatusColor = (status: string) => {
    if (status === "EN_CURSO") return "primary";
    if (status === "REPROBADO") return "error";
    return "success";
  };

  const getDisplayName = () => coordinatorInfo?.name || coordinatorInfo?.username || "Usuario";
  const getInitials = () => {
    if (coordinatorInfo?.name) {
      const parts = coordinatorInfo.name.split(" ");
      if (parts.length >= 2) return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
      return coordinatorInfo.name.charAt(0).toUpperCase();
    }
    if (coordinatorInfo?.username) return coordinatorInfo.username.charAt(0).toUpperCase();
    return "U";
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "#f0f2f5", display: "flex", flexDirection: "column" }}>
      {/* HEADER VERDE */}
      <Box sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", py: 2, px: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>Mis Estudiantes</Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>Listado general {periodId ? `— Periodo: ${periodId}` : ""}</Typography>
          </Box>

          {/* BOTONES DERECHA */}
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            {/* Predefensa */}
            <Tooltip title="Predefensa (como jurado)" arrow>
              <IconButton
                onClick={() => nav("/jury/predefense")}
                sx={{ color: "white", bgcolor: "rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.3)" } }}
              >
                <GavelIcon />
              </IconButton>
            </Tooltip>
            {/* Defensa Final */}
            <Tooltip title="Defensa Final (como jurado)" arrow>
              <IconButton
                onClick={() => nav("/jury/final-defense")}
                sx={{ color: "white", bgcolor: "rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.3)" } }}
              >
                <GavelIcon />
              </IconButton>
            </Tooltip>
            {/* Recargar */}
            <Tooltip title="Recargar página" arrow>
              <IconButton
                onClick={load}
                disabled={loading}
                sx={{ color: "white", bgcolor: "rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.3)" }, "&:disabled": { bgcolor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" } }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: "white" }} /> : <RefreshIcon />}
              </IconButton>
            </Tooltip>
            {/* Avatar */}
            <Tooltip title={`Perfil de ${getDisplayName()}`} arrow placement="bottom">
              <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: "white", "&:hover": { bgcolor: "rgba(255,255,255,0.1)" }, p: 0 }}>
                <Avatar src={photoPreview || undefined} sx={{ width: 40, height: 40, bgcolor: "white", color: VERDE_INSTITUCIONAL, fontWeight: 900, border: "2px solid rgba(255,255,255,0.3)", transition: "all 0.3s ease", "&:hover": { transform: "scale(1.05)", border: "2px solid white" } }}>{getInitials()}</Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* CONTENIDO */}
      <Box sx={{ flex: 1, py: 3 }}>
        <Container maxWidth="lg">
          <Card sx={{ borderRadius: 2, boxShadow: "0 4px 12px rgba(0,0,0,0.06)", borderLeft: `6px solid ${VERDE_INSTITUCIONAL}` }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 2, borderBottom: "1px solid #eee" }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: VERDE_INSTITUCIONAL }}>Listado General</Typography>
              </Box>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                  <CircularProgress sx={{ color: VERDE_INSTITUCIONAL }} />
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", fontWeight: 900, textAlign: "center" }}>Inicial</TableCell>
                        <TableCell sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", fontWeight: 900, textAlign: "center" }}>DNI</TableCell>
                        <TableCell sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", fontWeight: 900 }}>Nombres</TableCell>
                        <TableCell sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", fontWeight: 900 }}>Apellidos</TableCell>
                        <TableCell sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", fontWeight: 900 }}>Carrera</TableCell>
                        <TableCell sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", fontWeight: 900, textAlign: "center" }}>Corte</TableCell>
                        <TableCell sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", fontWeight: 900, textAlign: "center" }}>Sección</TableCell>
                        <TableCell sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", fontWeight: 900, textAlign: "center" }}>Estado</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 4, color: "#777" }}>No hay estudiantes registrados</TableCell>
                        </TableRow>
                      ) : (
                        rows.map(row => (
                          <TableRow key={row.id} onClick={() => nav(`/coordinator/students/${row.id}?periodId=${periodId ?? ""}`)} sx={{ cursor: "pointer", "&:hover": { bgcolor: "#f5f5f5" } }}>
                            <TableCell align="center"><Avatar sx={{ bgcolor: VERDE_INSTITUCIONAL, width: 32, height: 32, fontSize: "0.875rem", mx: "auto" }}>{row.firstName?.charAt(0) || "?"}</Avatar></TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600 }}>{row.dni}</TableCell>
                            <TableCell>{row.firstName}</TableCell>
                            <TableCell>{row.lastName}</TableCell>
                            <TableCell>{row.career}</TableCell>
                            <TableCell align="center">{row.corte}</TableCell>
                            <TableCell align="center">{row.section}</TableCell>
                            <TableCell align="center"><Chip label={row.status} color={getStatusColor(row.status)} size="small" sx={{ fontWeight: 900, fontSize: "0.75rem", borderRadius: "10px" }} /></TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Container>
      </Box>

      {/* FOOTER */}
      <Box sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", py: 2, textAlign: "center" }}>
        <Typography variant="body2">© 2025 - Panel de Coordinador</Typography>
      </Box>

      {/* DRAWER PERFIL */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: "100%", sm: 360 }, bgcolor: "rgba(255,255,255,0.98)", backdropFilter: "blur(10px)", height: "calc(100vh - 56px)", top: 0 } }}
        ModalProps={{ sx: { "& .MuiBackdrop-root": { backgroundColor: "rgba(0,0,0,0.3)" } } }}
      >
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee" }}>
            <Typography variant="h6" sx={{ fontWeight: 900, color: VERDE_INSTITUCIONAL }}>Mi Perfil</Typography>
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <Tooltip title="Cerrar Sesión" arrow>
                <IconButton onClick={handleLogout} size="small" sx={{ color: "#d32f2f", "&:hover": { bgcolor: "rgba(211, 47, 47, 0.08)" } }}><LogoutOutlined fontSize="small" /></IconButton>
              </Tooltip>
              <IconButton onClick={() => setDrawerOpen(false)} size="small"><CloseIcon fontSize="small" /></IconButton>
            </Box>
          </Box>
          <Box sx={{ flex: 1, overflow: "auto", p: 2.5 }}>
            <Box sx={{ textAlign: "center", mb: 2.5 }}>
              <Box sx={{ position: "relative", display: "inline-block" }}>
                <Avatar
                  src={photoPreview || undefined}
                  sx={{ width: 90, height: 90, fontSize: "2.2rem", mx: "auto", mb: 1.5, bgcolor: VERDE_INSTITUCIONAL, border: "3px solid #f0f2f5", cursor: "pointer", transition: "all 0.3s ease", "&:hover": { transform: "scale(1.05)", border: `3px solid ${VERDE_INSTITUCIONAL}` } }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {getInitials()}
                </Avatar>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.5, fontSize: "1rem" }}>
                {coordinatorInfo?.name || coordinatorInfo?.username || "Usuario"}
              </Typography>
              <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" style={{ display: "none" }} />
              <Button variant="text" startIcon={<PhotoCameraIcon fontSize="small" />} onClick={() => fileInputRef.current?.click()} sx={{ color: VERDE_INSTITUCIONAL, textTransform: "none", fontWeight: 600, fontSize: "0.75rem", "&:hover": { bgcolor: "rgba(0, 139, 139, 0.05)" } }}>
                Cambiar Foto
              </Button>
            </Box>

            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1.2}>
              {[
                { icon: <AccountCircleIcon sx={{ color: VERDE_INSTITUCIONAL, fontSize: 20 }} />, label: "Username", value: coordinatorInfo?.username },
                { icon: <PersonIcon sx={{ color: VERDE_INSTITUCIONAL, fontSize: 20 }} />, label: "Nombre Completo", value: coordinatorInfo?.name },
                { icon: <EmailIcon sx={{ color: VERDE_INSTITUCIONAL, fontSize: 20 }} />, label: "Email", value: coordinatorInfo?.email },
              ].map((item, idx) => (
                <Paper key={idx} elevation={0} sx={{ p: 1.2, bgcolor: "rgba(248, 249, 250, 0.9)", borderRadius: 5, border: "1px solid #e9ecef" }}>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    {item.icon}
                    <Typography sx={{ fontWeight: 600, fontSize: "0.875rem" }}>{item.label}:</Typography>
                    <Typography sx={{ fontSize: "0.875rem", opacity: 0.8 }}>{item.value}</Typography>
                  </Box>
                </Paper>
              ))}
            </Stack>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}
