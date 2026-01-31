import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
  Avatar,
  Drawer,
  IconButton,
  Divider,
  Stack,
  Paper,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tab,
  Tabs,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  PhotoCamera as PhotoCameraIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutOutlined,
} from "@mui/icons-material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

import { logout } from "../services/authService";
import {
  getTutorStudentDetail,
  createTutorIncident,
  createTutorObservation,
} from "../services/tutorService";
import { deleteIncident } from "../services/incidentManageService";
import type { StudentDetailDto } from "../services/tutorService";
import SendEmailModal from "../components/SendEmailModal";
import EditIncidentModal from "../components/EditIncidentModal";

const VERDE_INSTITUCIONAL = "#008B8B";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

export default function TutorStudentDetailPage() {
  const nav = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [sp] = useSearchParams();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const periodId = useMemo(() => {
    const q = sp.get("periodId");
    if (q && !Number.isNaN(Number(q))) return Number(q);

    const ls = localStorage.getItem("periodId");
    if (ls && !Number.isNaN(Number(ls))) return Number(ls);

    return null;
  }, [sp]);

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

  const [data, setData] = useState<StudentDetailDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const [incidentOpen, setIncidentOpen] = useState(false);
  const [obsOpen, setObsOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [editIncOpen, setEditIncOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<any>(null);

  // Form states para incidencia
  const [incStage, setIncStage] = useState("");
  const [incDate, setIncDate] = useState<dayjs.Dayjs | null>(null);
  const [incReason, setIncReason] = useState("");
  const [incAction, setIncAction] = useState("");

  // Form state para observación
  const [obsText, setObsText] = useState("");

  const load = async () => {
    if (!id) return;

    if (!periodId) {
      alert("Falta periodId. Regresando al listado...");
      nav("/tutor", { replace: true });
      return;
    }

    setLoading(true);
    try {
      const res = await getTutorStudentDetail(id, periodId);
      setData(res);
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "No se pudo cargar el estudiante");
      nav("/tutor", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const savedPhoto = localStorage.getItem("tutorPhoto");
    if (savedPhoto) {
      setPhotoPreview(savedPhoto);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, periodId]);

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

  const handleCreateIncident = async () => {
    if (!id || !periodId || !incStage || !incDate || !incReason || !incAction) {
      alert("Por favor completa todos los campos");
      return;
    }

    try {
      await createTutorIncident(id, periodId, {
        stage: incStage,
        date: incDate.format("YYYY-MM-DD"),
        reason: incReason,
        action: incAction,
      });
      alert("Incidencia registrada");
      setIncidentOpen(false);
      setIncStage("");
      setIncDate(null);
      setIncReason("");
      setIncAction("");
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "No se pudo registrar incidencia");
    }
  };

  const handleCreateObservation = async () => {
    if (!id || !periodId || !obsText) {
      alert("Por favor escribe una observación");
      return;
    }

    try {
      await createTutorObservation(id, periodId, { text: obsText });
      alert("Observación registrada");
      setObsOpen(false);
      setObsText("");
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "No se pudo registrar observación");
    }
  };

  const handleDeleteIncident = async (incId: number) => {
    if (!confirm("¿Eliminar incidencia?")) return;
    if (!periodId || !data?.id) return;

    try {
      const res = await deleteIncident(data.id, incId, periodId);
      alert(`Eliminada ✅ (Estado: ${res?.studentStatus ?? "OK"})`);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "No se pudo eliminar");
    }
  };

  if (!data) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ minHeight: "100vh", background: "#f0f2f5", display: "flex", flexDirection: "column" }}>
        {/* HEADER VERDE */}
        <Box
          sx={{
            bgcolor: VERDE_INSTITUCIONAL,
            color: "white",
            py: 2,
            px: 4,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <Container maxWidth="lg">
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Button
                  variant="contained"
                  startIcon={<ArrowBackIcon />}
                  onClick={() => nav("/tutor")}
                  sx={{
                    bgcolor: "white",
                    color: VERDE_INSTITUCIONAL,
                    fontWeight: 900,
                    "&:hover": { bgcolor: "#f5f5f5" },
                    borderRadius: "20px",
                    textTransform: "none",
                  }}
                >
                  Volver
                </Button>

                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 900 }}>
                    Panel de Tutoría
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Seguimiento del estudiante
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Button
                  variant="contained"
                  startIcon={<EmailIcon />}
                  onClick={() => setEmailOpen(true)}
                  sx={{
                    bgcolor: "white",
                    color: VERDE_INSTITUCIONAL,
                    fontWeight: 900,
                    "&:hover": { bgcolor: "#f5f5f5" },
                    borderRadius: "20px",
                    textTransform: "none",
                  }}
                >
                  Enviar Correo
                </Button>

                <IconButton
                  onClick={() => setDrawerOpen(true)}
                  sx={{
                    color: "white",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
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
                    {tutorInfo?.name?.charAt(0) || tutorInfo?.username?.charAt(0)?.toUpperCase() || "U"}
                  </Avatar>
                </IconButton>
              </Box>
            </Box>
          </Container>
        </Box>

        {/* CONTENIDO PRINCIPAL */}
        <Box sx={{ flex: 1, py: 3 }}>
          <Container maxWidth="lg">
            <Card
              sx={{
                borderRadius: 2,
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                borderLeft: `6px solid ${VERDE_INSTITUCIONAL}`,
                overflow: "hidden",
              }}
            >
              {/* BANNER DE IDENTIDAD */}
              <Box
                sx={{
                  bgcolor: VERDE_INSTITUCIONAL,
                  color: "white",
                  p: 3,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    bgcolor: "white",
                    color: VERDE_INSTITUCIONAL,
                    fontSize: "1.5rem",
                    fontWeight: 900,
                  }}
                >
                  {data.firstName?.charAt(0) || "?"}
                </Avatar>
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      textTransform: "uppercase",
                      fontWeight: 700,
                      opacity: 0.8,
                      letterSpacing: 1,
                    }}
                  >
                    Seguimiento Académico
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900 }}>
                    {data.firstName} {data.lastName}
                  </Typography>
                </Box>
              </Box>

              <CardContent sx={{ p: 3 }}>
                {/* INFORMACIÓN DEL ESTUDIANTE */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 2,
                    mb: 3,
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: "rgba(248, 249, 250, 0.9)",
                      borderRadius: 2,
                      border: "1px solid #e9ecef",
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "#6c757d", fontWeight: 600 }}>
                      Estudiante
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: "#212529" }}>
                      {data.firstName} {data.lastName}
                    </Typography>
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: "rgba(248, 249, 250, 0.9)",
                      borderRadius: 2,
                      border: "1px solid #e9ecef",
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "#6c757d", fontWeight: 600 }}>
                      Email
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: "#212529" }}>
                      {data.email}
                    </Typography>
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: "rgba(248, 249, 250, 0.9)",
                      borderRadius: 2,
                      border: "1px solid #e9ecef",
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "#6c757d", fontWeight: 600 }}>
                      Carrera
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: "#212529" }}>
                      {data.career}
                    </Typography>
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: "rgba(248, 249, 250, 0.9)",
                      borderRadius: 2,
                      border: "1px solid #e9ecef",
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "#6c757d", fontWeight: 600, mb: 0.5, display: "block" }}>
                      Estado
                    </Typography>
                    <Chip
                      label={data.status}
                      color="primary"
                      size="small"
                      sx={{ fontWeight: 700, borderRadius: "10px" }}
                    />
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: "rgba(248, 249, 250, 0.9)",
                      borderRadius: 2,
                      border: "1px solid #e9ecef",
                      gridColumn: { xs: "1", sm: "1 / -1" },
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "#6c757d", fontWeight: 600 }}>
                      Proyecto
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 600,
                        color: data.thesisProject ? "#212529" : "#adb5bd",
                        fontStyle: data.thesisProject ? "normal" : "italic",
                      }}
                    >
                      {data.thesisProject || "No definido"}
                    </Typography>
                  </Paper>
                </Box>

                {/* TABS */}
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                  <Tabs
                    value={tabValue}
                    onChange={(_, v) => setTabValue(v)}
                    sx={{
                      "& .MuiTab-root": {
                        fontWeight: 700,
                        textTransform: "none",
                        fontSize: "1rem",
                      },
                      "& .Mui-selected": {
                        color: VERDE_INSTITUCIONAL,
                      },
                      "& .MuiTabs-indicator": {
                        backgroundColor: VERDE_INSTITUCIONAL,
                      },
                    }}
                  >
                    <Tab label={`Incidencias (${data.incidentCount})`} />
                    <Tab label={`Observaciones (${data.observationCount})`} />
                  </Tabs>
                </Box>

                {/* TAB INCIDENCIAS */}
                <TabPanel value={tabValue} index={0}>
                  <Box sx={{ py: 3 }}>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<AddIcon />}
                      disabled={data.incidentCount >= 3}
                      onClick={() => setIncidentOpen(true)}
                      sx={{
                        mb: 2,
                        borderRadius: "20px",
                        textTransform: "none",
                        fontWeight: 700,
                      }}
                    >
                      Nueva incidencia
                    </Button>

                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", fontWeight: 900 }}>
                              Etapa
                            </TableCell>
                            <TableCell sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", fontWeight: 900 }}>
                              Fecha
                            </TableCell>
                            <TableCell sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", fontWeight: 900 }}>
                              Motivo
                            </TableCell>
                            <TableCell sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", fontWeight: 900 }}>
                              Acción
                            </TableCell>
                            <TableCell
                              sx={{
                                bgcolor: VERDE_INSTITUCIONAL,
                                color: "white",
                                fontWeight: 900,
                                textAlign: "center",
                              }}
                            >
                              Acciones
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data.incidents?.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} align="center" sx={{ py: 4, color: "#777" }}>
                                No hay incidencias registradas
                              </TableCell>
                            </TableRow>
                          ) : (
                            data.incidents?.map((inc: any) => (
                              <TableRow key={inc.id} sx={{ "&:hover": { bgcolor: "#f5f5f5" } }}>
                                <TableCell>{inc.stage}</TableCell>
                                <TableCell>{inc.date}</TableCell>
                                <TableCell>{inc.reason}</TableCell>
                                <TableCell>{inc.action}</TableCell>
                                <TableCell align="center">
                                  <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                                    <Tooltip title="Editar">
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          setEditingIncident(inc);
                                          setEditIncOpen(true);
                                        }}
                                        sx={{ color: VERDE_INSTITUCIONAL }}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Eliminar">
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDeleteIncident(inc.id)}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </TabPanel>

                {/* TAB OBSERVACIONES */}
                <TabPanel value={tabValue} index={1}>
                  <Box sx={{ py: 3 }}>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => setObsOpen(true)}
                      sx={{
                        mb: 2,
                        borderRadius: "20px",
                        textTransform: "none",
                        fontWeight: 700,
                        borderColor: VERDE_INSTITUCIONAL,
                        color: VERDE_INSTITUCIONAL,
                        "&:hover": {
                          borderColor: VERDE_INSTITUCIONAL,
                          bgcolor: "rgba(0, 139, 139, 0.05)",
                        },
                      }}
                    >
                      Nueva observación
                    </Button>

                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", fontWeight: 900 }}>
                              Autor
                            </TableCell>
                            <TableCell sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", fontWeight: 900 }}>
                              Observación
                            </TableCell>
                            <TableCell sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", fontWeight: 900 }}>
                              Fecha
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data.observations?.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} align="center" sx={{ py: 4, color: "#777" }}>
                                No hay observaciones registradas
                              </TableCell>
                            </TableRow>
                          ) : (
                            data.observations?.map((obs: any) => (
                              <TableRow key={obs.id} sx={{ "&:hover": { bgcolor: "#f5f5f5" } }}>
                                <TableCell>{obs.author}</TableCell>
                                <TableCell>{obs.text}</TableCell>
                                <TableCell>{obs.createdAt}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </TabPanel>
              </CardContent>
            </Card>
          </Container>
        </Box>

        {/* FOOTER */}
        <Box sx={{ bgcolor: VERDE_INSTITUCIONAL, color: "white", py: 2, textAlign: "center" }}>
          <Typography variant="body2">© 2025 - Panel de Predefensas</Typography>
        </Box>

        {/* DRAWER DE PERFIL */}
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{
            sx: {
              width: { xs: "100%", sm: 360 },
              bgcolor: "rgba(255, 255, 255, 0.98)",
              backdropFilter: "blur(10px)",
              height: "calc(100vh - 56px)",
              top: 0,
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
                  {tutorInfo?.name?.charAt(0) || tutorInfo?.username?.charAt(0)?.toUpperCase() || "U"}
                </Avatar>

                <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.5, fontSize: "1rem" }}>
                  {tutorInfo?.name || tutorInfo?.username || "Usuario"}
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
                <Paper
                  elevation={0}
                  sx={{ p: 1.2, bgcolor: "rgba(248, 249, 250, 0.9)", borderRadius: 5, border: "1px solid #e9ecef" }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                    <AccountCircleIcon sx={{ color: VERDE_INSTITUCIONAL, fontSize: 20 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ color: "#6c757d", fontWeight: 600, fontSize: "0.65rem" }}>
                        Username
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: tutorInfo?.username ? "#212529" : "#adb5bd",
                          fontSize: "0.813rem",
                        }}
                      >
                        {tutorInfo?.username || "Sin asignar"}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{ p: 1.2, bgcolor: "rgba(248, 249, 250, 0.9)", borderRadius: 5, border: "1px solid #e9ecef" }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                    <PersonIcon sx={{ color: VERDE_INSTITUCIONAL, fontSize: 20 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ color: "#6c757d", fontWeight: 600, fontSize: "0.65rem" }}>
                        Nombre Completo
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: tutorInfo?.name ? "#212529" : "#adb5bd", fontSize: "0.813rem" }}
                      >
                        {tutorInfo?.name || "Sin asignar"}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{ p: 1.2, bgcolor: "rgba(248, 249, 250, 0.9)", borderRadius: 5, border: "1px solid #e9ecef" }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                    <EmailIcon sx={{ color: VERDE_INSTITUCIONAL, fontSize: 20 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ color: "#6c757d", fontWeight: 600, fontSize: "0.65rem" }}>
                        Email
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: tutorInfo?.email ? "#212529" : "#adb5bd",
                          fontSize: "0.813rem",
                          wordBreak: "break-word",
                        }}
                      >
                        {tutorInfo?.email || "Sin asignar"}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{ p: 1.2, bgcolor: "rgba(248, 249, 250, 0.9)", borderRadius: 5, border: "1px solid #e9ecef" }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                    <BadgeIcon sx={{ color: VERDE_INSTITUCIONAL, fontSize: 20 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: "#6c757d", fontWeight: 600, fontSize: "0.65rem", mb: 0.3, display: "block" }}
                      >
                        Rol
                      </Typography>
                      <Chip
                        label={tutorInfo?.role || "Sin asignar"}
                        size="small"
                        sx={{
                          bgcolor: VERDE_INSTITUCIONAL,
                          color: "white",
                          fontWeight: 700,
                          fontSize: "0.7rem",
                          height: "22px",
                        }}
                      />
                    </Box>
                  </Box>
                </Paper>
              </Stack>
            </Box>
          </Box>
        </Drawer>

        {/* MODAL ENVIAR EMAIL */}
        <SendEmailModal
          open={emailOpen}
          studentId={data.id}
          studentEmail={data.email}
          onClose={() => setEmailOpen(false)}
        />

        {/* MODAL NUEVA INCIDENCIA */}
        <Dialog open={incidentOpen} onClose={() => setIncidentOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 900, color: VERDE_INSTITUCIONAL }}>Registrar incidencia</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Etapa"
                value={incStage}
                onChange={(e) => setIncStage(e.target.value)}
                fullWidth
                required
              />
              <DatePicker
                label="Fecha"
                value={incDate}
                onChange={(v) => setIncDate(v)}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
              <TextField
                label="Motivo"
                value={incReason}
                onChange={(e) => setIncReason(e.target.value)}
                multiline
                rows={3}
                fullWidth
                required
              />
              <TextField
                label="Acción"
                value={incAction}
                onChange={(e) => setIncAction(e.target.value)}
                multiline
                rows={3}
                fullWidth
                required
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setIncidentOpen(false)} sx={{ borderRadius: "20px", textTransform: "none" }}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleCreateIncident}
              sx={{ borderRadius: "20px", textTransform: "none", fontWeight: 700 }}
            >
              Guardar
            </Button>
          </DialogActions>
        </Dialog>

        {/* MODAL NUEVA OBSERVACIÓN */}
        <Dialog open={obsOpen} onClose={() => setObsOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 900, color: VERDE_INSTITUCIONAL }}>Registrar observación</DialogTitle>
          <DialogContent>
            <TextField
              label="Observación"
              value={obsText}
              onChange={(e) => setObsText(e.target.value)}
              multiline
              rows={4}
              fullWidth
              required
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setObsOpen(false)} sx={{ borderRadius: "20px", textTransform: "none" }}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateObservation}
              sx={{
                borderRadius: "20px",
                textTransform: "none",
                fontWeight: 700,
                bgcolor: VERDE_INSTITUCIONAL,
                "&:hover": { bgcolor: "#007070" },
              }}
            >
              Guardar
            </Button>
          </DialogActions>
        </Dialog>

        {/* MODAL EDITAR INCIDENCIA */}
        <EditIncidentModal
          open={editIncOpen}
          onClose={() => setEditIncOpen(false)}
          onSaved={load}
          periodId={periodId!}
          studentId={data.id}
          incident={editingIncident}
        />
      </Box>
    </LocalizationProvider>
  );
}