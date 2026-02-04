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

  // ✅ Obtener datos REALES del usuario logueado desde localStorage
  const coordinatorInfo = useMemo(() => {
    console.log("🔍 Verificando localStorage...");
    
    // Intentar obtener de diferentes claves posibles
    const possibleKeys = ["user", "currentUser", "userData", "authUser"];
    let user = null;
    
    for (const key of possibleKeys) {
      const userStr = localStorage.getItem(key);
      console.log(`📦 localStorage.getItem("${key}"):`, userStr);
      
      if (userStr) {
        try {
          user = JSON.parse(userStr);
          console.log(`✅ Usuario encontrado en "${key}":`, user);
          break;
        } catch (e) {
          console.error(`❌ Error parseando "${key}":`, e);
        }
      }
    }

    if (!user) {
      console.warn("⚠️ No se encontró usuario en localStorage");
      return {
        username: "",
        name: "",
        email: "",
        role: "Coordinador",
      };
    }

    // Intentar múltiples combinaciones de campos
    const info = {
      username: user.username || user.userName || user.user || user.email?.split("@")[0] || "",
      name: user.name || 
            user.fullName || 
            user.displayName ||
            (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : "") ||
            (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}`.trim() : "") ||
            "",
      email: user.email || user.correo || user.mail || "",
      role: user.role || user.rol || user.type || user.userType || "Coordinador",
    };

    console.log("📋 Información procesada:", info);
    return info;
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
      console.error("ERROR listCoordinatorStudents:", e?.response?.data ?? e);
      alert(e?.response?.data?.message ?? "No se pudo cargar estudiantes");

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
    // Cargar foto guardada del coordinador
    const savedPhoto = localStorage.getItem("coordinatorPhoto");
    if (savedPhoto) {
      setPhotoPreview(savedPhoto);
    }

    // 🔍 DEBUG: Mostrar todo el localStorage
    console.log("🗄️ TODO el localStorage:");
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        console.log(`  ${key}:`, localStorage.getItem(key));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    if (!confirm("¿Estás seguro de que deseas cerrar sesión?")) return;
    logout();
    nav("/");
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido');
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen es demasiado grande. Por favor selecciona una imagen menor a 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const photoData = reader.result as string;
        setPhotoPreview(photoData);
        localStorage.setItem("coordinatorPhoto", photoData);
        console.log("✅ Foto guardada en localStorage");
      };
      reader.onerror = () => {
        alert('Error al cargar la imagen. Por favor intenta de nuevo.');
      };
      reader.readAsDataURL(file);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "EN_CURSO") return "primary";
    if (status === "REPROBADO") return "error";
    return "success";
  };

  // Obtener el nombre para mostrar en el tooltip
  const getDisplayName = () => {
    if (coordinatorInfo?.name) return coordinatorInfo.name;
    if (coordinatorInfo?.username) return coordinatorInfo.username;
    return "Usuario";
  };

  // Obtener iniciales del usuario
  const getInitials = () => {
    if (coordinatorInfo?.name) {
      const parts = coordinatorInfo.name.split(" ");
      if (parts.length >= 2) {
        return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
      }
      return coordinatorInfo.name.charAt(0).toUpperCase();
    }
    if (coordinatorInfo?.username) {
      return coordinatorInfo.username.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "#f0f2f5", display: "flex", flexDirection: "column" }}>
      {/* HEADER VERDE - Elementos en las esquinas */}
      <Box
        sx={{
          bgcolor: VERDE_INSTITUCIONAL,
          color: "white",
          py: 2,
          px: 2,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            maxWidth: "100%",
          }}
        >
          {/* ESQUINA IZQUIERDA: Título */}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
              Mis Estudiantes
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Listado general {periodId ? `— Periodo: ${periodId}` : ""}
            </Typography>
          </Box>

          {/* ESQUINA DERECHA: Botón Refrescar + Avatar */}
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Tooltip title="Recargar página" arrow>
              <IconButton
                onClick={load}
                disabled={loading}
                sx={{
                  color: "white",
                  bgcolor: "rgba(255, 255, 255, 0.2)",
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.3)" },
                  "&:disabled": { 
                    bgcolor: "rgba(255, 255, 255, 0.1)",
                    color: "rgba(255, 255, 255, 0.5)",
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  <RefreshIcon />
                )}
              </IconButton>
            </Tooltip>

            <Tooltip 
              title={`Perfil de ${getDisplayName()}`} 
              arrow
              placement="bottom"
            >
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
                    border: "2px solid rgba(255,255,255,0.3)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "scale(1.05)",
                      border: "2px solid white",
                    },
                  }}
                >
                  {getInitials()}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* CONTENIDO PRINCIPAL */}
      <Box sx={{ flex: 1, py: 3 }}>
        <Container maxWidth="lg">
          <Card
            sx={{
              borderRadius: 2,
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              borderLeft: `6px solid ${VERDE_INSTITUCIONAL}`,
            }}
          >
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 2, borderBottom: "1px solid #eee" }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: VERDE_INSTITUCIONAL }}>
                  Listado General
                </Typography>
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
                        <TableCell
                          sx={{
                            bgcolor: VERDE_INSTITUCIONAL,
                            color: "white",
                            fontWeight: 900,
                            textAlign: "center",
                          }}
                        >
                          Inicial
                        </TableCell>
                        <TableCell
                          sx={{
                            bgcolor: VERDE_INSTITUCIONAL,
                            color: "white",
                            fontWeight: 900,
                            textAlign: "center",
                          }}
                        >
                          DNI
                        </TableCell>
                        <TableCell
                          sx={{
                            bgcolor: VERDE_INSTITUCIONAL,
                            color: "white",
                            fontWeight: 900,
                          }}
                        >
                          Nombres
                        </TableCell>
                        <TableCell
                          sx={{
                            bgcolor: VERDE_INSTITUCIONAL,
                            color: "white",
                            fontWeight: 900,
                          }}
                        >
                          Apellidos
                        </TableCell>
                        <TableCell
                          sx={{
                            bgcolor: VERDE_INSTITUCIONAL,
                            color: "white",
                            fontWeight: 900,
                          }}
                        >
                          Carrera
                        </TableCell>
                        <TableCell
                          sx={{
                            bgcolor: VERDE_INSTITUCIONAL,
                            color: "white",
                            fontWeight: 900,
                            textAlign: "center",
                          }}
                        >
                          Corte
                        </TableCell>
                        <TableCell
                          sx={{
                            bgcolor: VERDE_INSTITUCIONAL,
                            color: "white",
                            fontWeight: 900,
                            textAlign: "center",
                          }}
                        >
                          Sección
                        </TableCell>
                        <TableCell
                          sx={{
                            bgcolor: VERDE_INSTITUCIONAL,
                            color: "white",
                            fontWeight: 900,
                            textAlign: "center",
                          }}
                        >
                          Estado
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 4, color: "#777" }}>
                            No hay estudiantes registrados
                          </TableCell>
                        </TableRow>
                      ) : (
                        rows.map((row) => (
                          <TableRow
                            key={row.id}
                            onClick={() =>
                              nav(`/coordinator/students/${row.id}?periodId=${periodId ?? ""}`)
                            }
                            sx={{
                              cursor: "pointer",
                              transition: "all 0.2s",
                              "&:hover": {
                                bgcolor: "#f5f5f5",
                              },
                            }}
                          >
                            <TableCell align="center">
                              <Avatar
                                sx={{
                                  bgcolor: VERDE_INSTITUCIONAL,
                                  width: 32,
                                  height: 32,
                                  fontSize: "0.875rem",
                                  mx: "auto",
                                }}
                              >
                                {row.firstName?.charAt(0) || "?"}
                              </Avatar>
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600 }}>
                              {row.dni}
                            </TableCell>
                            <TableCell>{row.firstName}</TableCell>
                            <TableCell>{row.lastName}</TableCell>
                            <TableCell>{row.career}</TableCell>
                            <TableCell align="center">{row.corte}</TableCell>
                            <TableCell align="center">{row.section}</TableCell>
                            <TableCell align="center">
                              <Chip
                                label={row.status}
                                color={getStatusColor(row.status)}
                                size="small"
                                sx={{
                                  fontWeight: 900,
                                  fontSize: "0.75rem",
                                  borderRadius: "10px",
                                }}
                              />
                            </TableCell>
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

      {/* FOOTER VERDE */}
      <Box
        sx={{
          bgcolor: VERDE_INSTITUCIONAL,
          color: "white",
          py: 2,
          textAlign: "center",
        }}
      >
        <Typography variant="body2">© 2025 - Panel de Coordinador</Typography>
      </Box>

      {/* DRAWER LATERAL - NO TAPA EL FOOTER */}
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
        ModalProps={{
          sx: {
            "& .MuiBackdrop-root": {
              backgroundColor: "rgba(0, 0, 0, 0.3)",
            },
          },
        }}
      >
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          {/* Header del Drawer */}
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
                  sx={{
                    color: "#d32f2f",
                    "&:hover": {
                      bgcolor: "rgba(211, 47, 47, 0.08)",
                    },
                  }}
                >
                  <LogoutOutlined fontSize="small" />
                </IconButton>
              </Tooltip>

              <IconButton onClick={() => setDrawerOpen(false)} size="small">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Contenido del Perfil */}
          <Box sx={{ flex: 1, overflow: "auto", p: 2.5 }}>
            <Box sx={{ textAlign: "center", mb: 2.5 }}>
              <Box sx={{ position: "relative", display: "inline-block" }}>
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
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "scale(1.05)",
                      border: `3px solid ${VERDE_INSTITUCIONAL}`,
                    },
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {getInitials()}
                </Avatar>
              </Box>

              <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.5, fontSize: "1rem" }}>
                {coordinatorInfo?.name || coordinatorInfo?.username || "Usuario"}
              </Typography>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoChange}
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
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
                  "&:hover": {
                    bgcolor: "rgba(0, 139, 139, 0.05)",
                  },
                }}
              >
                Cambiar Foto
              </Button>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Stack spacing={1.2}>
              {/* Username */}
              <Paper
                elevation={0}
                sx={{
                  p: 1.2,
                  bgcolor: "rgba(248, 249, 250, 0.9)",
                  borderRadius: 5,
                  border: "1px solid #e9ecef",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <AccountCircleIcon sx={{ color: VERDE_INSTITUCIONAL, fontSize: 20 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: "#6c757d", fontWeight: 600, fontSize: "0.65rem" }}>
                      Username
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: coordinatorInfo?.username ? "#212529" : "#adb5bd", fontSize: "0.813rem" }}>
                      {coordinatorInfo?.username || "Sin asignar"}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Name */}
              <Paper
                elevation={0}
                sx={{
                  p: 1.2,
                  bgcolor: "rgba(248, 249, 250, 0.9)",
                  borderRadius: 5,
                  border: "1px solid #e9ecef",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <PersonIcon sx={{ color: VERDE_INSTITUCIONAL, fontSize: 20 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: "#6c757d", fontWeight: 600, fontSize: "0.65rem" }}>
                      Nombre Completo
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: coordinatorInfo?.name ? "#212529" : "#adb5bd", fontSize: "0.813rem" }}>
                      {coordinatorInfo?.name || "Sin asignar"}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Email */}
              <Paper
                elevation={0}
                sx={{
                  p: 1.2,
                  bgcolor: "rgba(248, 249, 250, 0.9)",
                  borderRadius: 5,
                  border: "1px solid #e9ecef",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <EmailIcon sx={{ color: VERDE_INSTITUCIONAL, fontSize: 20 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: "#6c757d", fontWeight: 600, fontSize: "0.65rem" }}>
                      Email
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: coordinatorInfo?.email ? "#212529" : "#adb5bd", fontSize: "0.813rem", wordBreak: "break-word" }}>
                      {coordinatorInfo?.email || "Sin asignar"}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Role */}
              <Paper
                elevation={0}
                sx={{
                  p: 1.2,
                  bgcolor: "rgba(248, 249, 250, 0.9)",
                  borderRadius: 5,
                  border: "1px solid #e9ecef",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <BadgeIcon sx={{ color: VERDE_INSTITUCIONAL, fontSize: 20 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: "#6c757d", fontWeight: 600, fontSize: "0.65rem", mb: 0.3, display: "block" }}>
                      Rol
                    </Typography>
                    <Chip
                      label={coordinatorInfo?.role || "Sin asignar"}
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
    </Box>
  );
}