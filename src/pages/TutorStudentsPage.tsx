import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Button,
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
} from "@mui/icons-material";

import { logout } from "../services/authService";
import type { TutorStudentRow } from "../services/tutorService";
import { listTutorStudents } from "../services/tutorService";
import { useActivePeriod } from "../hooks/useActivePeriod";

const VERDE_INSTITUCIONAL = "#008B8B";

export default function TutorStudentsPage() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<TutorStudentRow[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nav = useNavigate();
  const ap = useActivePeriod();

  const tutorInfo = useMemo(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return {
          username: user.username || user.email?.split("@")[0] || "",
          name: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "",
          email: user.email || "",
          role: user.role || "Tutor",
        };
      } catch {
        return { username: "", name: "", email: "", role: "Tutor" };
      }
    }
    return { username: "", name: "", email: "", role: "Tutor" };
  }, []);

  const load = async () => {
    if (!ap.periodId) return;
    setLoading(true);
    try {
      const data = await listTutorStudents(ap.periodId);
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error("ERROR listTutorStudents:", e?.response?.data ?? e);
      alert(e?.response?.data?.message ?? "No se pudo cargar estudiantes (TUTOR)");
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        logout();
        nav("/");
      } else {
        setRows([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const savedPhoto = localStorage.getItem("tutorPhoto");
    if (savedPhoto) setPhotoPreview(savedPhoto);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ap.periodId]);

  const handleLogout = () => {
    if (!confirm("¿Estás seguro de que deseas cerrar sesión?")) return;
    logout();
    nav("/");
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const photoData = reader.result as string;
        setPhotoPreview(photoData);
        localStorage.setItem("tutorPhoto", photoData);
      };
      reader.readAsDataURL(file);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "EN_CURSO") return "primary";
    if (status === "REPROBADO") return "error";
    return "success";
  };

  if (ap.loading) return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <CircularProgress sx={{ color: VERDE_INSTITUCIONAL }} />
    </Box>
  );

  if (ap.error) return (
    <Box sx={{ minHeight: "100vh", background: "#f0f2f5", p: 3 }}>
      <Container maxWidth="sm">
        <Card>
          <CardContent sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="h5" color="error" gutterBottom>Error</Typography>
            <Typography variant="body1">{ap.error}</Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );

  return (
    <Box sx={{ minHeight: "100vh", background: "#f0f2f5", display: "flex", flexDirection: "column" }}>
      {/* HEADER */}
      <Box sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", py: 2, px: 4, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900 }}>Mis Estudiantes</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Listado general de estudiantes {ap.periodId ? `— Periodo: ${ap.periodId}` : ""}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <RefreshIcon />}
                onClick={load}
                disabled={loading}
                sx={{ bgcolor: "white", color: VERDE_INSTITUCIONAL, fontWeight: 900, "&:hover": { bgcolor: "#f5f5f5" }, borderRadius: "20px", textTransform: "none" }}
              >
                Refrescar
              </Button>

             <Button
  variant="contained"
  sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", fontWeight: 900 }}
  onClick={() => nav(`/tutor/predefense?periodId=${ap.periodId}`)}
>
  Predefensa
</Button>

<Button
  variant="contained"
  sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", fontWeight: 900 }}
  onClick={() => nav(`/jury/final-defense?periodId=${ap.periodId}`)}
>
  Defensa Final
</Button>


              <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: "white", "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}>
                <Avatar src={photoPreview || undefined} sx={{ width: 40, height: 40, bgcolor: "white", color: VERDE_INSTITUCIONAL, fontWeight: 900 }}>
                  {tutorInfo?.name?.charAt(0) || tutorInfo?.username?.charAt(0)?.toUpperCase() || "U"}
                </Avatar>
              </IconButton>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* CONTENIDO */}
      <Box sx={{ flex: 1, py: 3 }}>
        <Container maxWidth="lg">
          <Card sx={{ borderRadius: 2, boxShadow: "0 4px 12px rgba(0,0,0,0.06)", borderLeft: `6px solid ${VERDE_INSTITUCIONAL}` }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 2, borderBottom: "1px solid #eee" }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: VERDE_INSTITUCIONAL }}>Estudiantes Asignados</Typography>
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
                        <TableCell sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", fontWeight: 900 }}>Proyecto</TableCell>
                        <TableCell sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", fontWeight: 900, textAlign: "center" }}>Corte</TableCell>
                        <TableCell sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", fontWeight: 900, textAlign: "center" }}>Sección</TableCell>
                        <TableCell sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", fontWeight: 900, textAlign: "center" }}>Estado</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} align="center" sx={{ py: 4, color: "#777" }}>No hay estudiantes asignados</TableCell>
                        </TableRow>
                      ) : (
                        rows.map((row) => (
                          <TableRow key={row.id} onClick={() => nav(`/tutor/students/${row.id}?periodId=${ap.periodId ?? ""}`)} sx={{ cursor: "pointer", "&:hover": { bgcolor: "#f5f5f5" } }}>
                            <TableCell align="center"><Avatar sx={{ bgcolor: VERDE_INSTITUCIONAL, width: 32, height: 32, fontSize: "0.875rem", mx: "auto" }}>{row.firstName?.charAt(0) || "?"}</Avatar></TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600 }}>{row.dni}</TableCell>
                            <TableCell>{row.firstName}</TableCell>
                            <TableCell>{row.lastName}</TableCell>
                            <TableCell>{row.career}</TableCell>
                            <TableCell>{row.thesisProject || <Typography variant="body2" sx={{ color: "#999", fontStyle: "italic" }}>-</Typography>}</TableCell>
                            <TableCell align="center">{row.corte}</TableCell>
                            <TableCell align="center">{row.section}</TableCell>
                            <TableCell align="center">
                              <Chip label={row.status} color={getStatusColor(row.status)} size="small" sx={{ fontWeight: 900, fontSize: "0.75rem", borderRadius: "10px" }} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              <Box sx={{ p: 2, textAlign: "center", borderTop: "1px solid #eee" }}>
                <Typography variant="body2" sx={{ color: "#777", fontStyle: "italic" }}>
                  Haz click en un estudiante para gestionar sus incidencias y observaciones.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>

      {/* FOOTER */}
      <Box sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", py: 2, textAlign: "center" }}>
        <Typography variant="body2">© 2025 - Panel de Predefensas</Typography>
      </Box>

      {/* DRAWER */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: "100%", sm: 360 }, bgcolor: "rgba(255,255,255,0.98)", backdropFilter: "blur(10px)", height: "calc(100vh - 56px)", top: 0 } }}
      >
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee" }}>
            <Typography variant="h6" sx={{ fontWeight: 900, color: VERDE_INSTITUCIONAL }}>Mi Perfil</Typography>
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <Tooltip title="Cerrar Sesión" arrow>
                <IconButton onClick={handleLogout} size="small" sx={{ color: "#d32f2f", "&:hover": { bgcolor: "rgba(211, 47, 47, 0.08)" } }}>
                  <LogoutOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
              <IconButton onClick={() => setDrawerOpen(false)} size="small"><CloseIcon fontSize="small" /></IconButton>
            </Box>
          </Box>

          <Box sx={{ flex: 1, overflow: "auto", p: 2.5 }}>
            <Box sx={{ textAlign: "center", mb: 2.5 }}>
              <Avatar src={photoPreview || undefined} sx={{ width: 90, height: 90, fontSize: "2.2rem", mx: "auto", mb: 1.5, bgcolor: VERDE_INSTITUCIONAL, border: "3px solid #f0f2f5" }}>
                {tutorInfo?.name?.charAt(0) || tutorInfo?.username?.charAt(0)?.toUpperCase() || "U"}
              </Avatar>
              <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" style={{ display: "none" }} />
              <Button variant="text" startIcon={<PhotoCameraIcon fontSize="small" />} onClick={() => fileInputRef.current?.click()} sx={{ color: VERDE_INSTITUCIONAL, textTransform: "none", fontWeight: 600, fontSize: "0.75rem", "&:hover": { bgcolor: "rgba(0, 139, 139, 0.05)" } }}>Cambiar Foto</Button>
            </Box>

            <Stack spacing={1.2}>
              {["username", "name", "email", "role"].map((field) => (
                <Paper key={field} elevation={0} sx={{ p: 1.2, bgcolor: "rgba(248,249,250,0.9)", borderRadius: 5, border: "1px solid #e9ecef" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                    {{
                      username: <AccountCircleIcon sx={{ color: VERDE_INSTITUCIONAL, fontSize: 20 }} />,
                      name: <PersonIcon sx={{ color: VERDE_INSTITUCIONAL, fontSize: 20 }} />,
                      email: <EmailIcon sx={{ color: VERDE_INSTITUCIONAL, fontSize: 20 }} />,
                      role: <BadgeIcon sx={{ color: VERDE_INSTITUCIONAL, fontSize: 20 }} />,
                    }[field]}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ color: "#6c757d", fontWeight: 600, fontSize: "0.65rem" }}>{field.charAt(0).toUpperCase() + field.slice(1)}</Typography>
                      {field === "role" ? (
                        <Chip label={tutorInfo?.role || "Sin asignar"} size="small" sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", fontWeight: 700, fontSize: "0.7rem", height: "22px" }} />
                      ) : (
                        <Typography variant="body2" sx={{ fontWeight: 600, color: tutorInfo?.[field as keyof typeof tutorInfo] ? "#212529" : "#adb5bd", fontSize: "0.813rem" }}>
                          {tutorInfo?.[field as keyof typeof tutorInfo] || "Sin asignar"}
                        </Typography>
                      )}
                    </Box>
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
