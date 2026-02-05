import { useEffect, useMemo, useState, useRef } from "react";
import {
  Box,
  Container,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Card,
  CardContent,
  Chip,
  Avatar,
  Drawer,
  IconButton,
  Divider,
  Stack,
  Paper,
  Tooltip,
  AppBar,
  Toolbar,
} from "@mui/material";
import {
  Logout as LogoutOutlined,
  Close as CloseIcon,
  PhotoCamera as PhotoCameraIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  AccountCircle as AccountCircleIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Assessment as AssessmentIcon,
  ArrowBackIosNewRounded as ArrowBackIosNewRoundedIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

import {
  juryFinalMyBookings,
  juryFinalBookingDetail,
  juryFinalEvaluate,
  juryFinalDownloadActaPdf,
  juryFinalDownloadRubricPdf,
  type FinalDefenseBookingDto,
  type FinalDefenseEvaluationDto,
} from "../services/finalDefenseService";

const VERDE_INSTITUCIONAL = "#008B8B";

export default function FinalDefenseJuryPage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bookings, setBookings] = useState<FinalDefenseBookingDto[]>([]);

  const [openEval, setOpenEval] = useState(false);
  const [activeBooking, setActiveBooking] = useState<FinalDefenseBookingDto | null>(null);
  const [evaluations, setEvaluations] = useState<FinalDefenseEvaluationDto[]>([]);

  const [rubricScore, setRubricScore] = useState<number>(0);
  const [extraScore, setExtraScore] = useState<number>(0);
  const [observations, setObservations] = useState("");
  const [error, setError] = useState("");

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
    if (!ls) return null;
    const n = Number(ls);
    return Number.isFinite(n) ? n : null;
  }, []);

  const total = Math.max(0, Math.min(100, (Number(rubricScore) || 0) + (Number(extraScore) || 0)));
  const autoVerdict = total >= 70 ? "APROBADO" : "REPROBADO";

  const load = async () => {
    setLoading(true);
    try {
      const b = await juryFinalMyBookings();
      setBookings(Array.isArray(b) ? b : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const savedPhoto = localStorage.getItem("juryPhoto");
    if (savedPhoto) {
      setPhotoPreview(savedPhoto);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    if (!confirm("¿Cerrar sesión?")) return;
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

  const openEvaluate = async (b: FinalDefenseBookingDto) => {
    setActiveBooking(b);
    setOpenEval(true);
    setError("");

    setRubricScore(0);
    setExtraScore(0);
    setObservations("");

    setLoading(true);
    try {
      const detail = await juryFinalBookingDetail(b.id);
      setActiveBooking(detail.booking);
      setEvaluations(detail.evaluations ?? []);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEvaluation = async () => {
    if (!activeBooking) return;

    setError("");

    const rs = Number(rubricScore);
    const es = Number(extraScore);

    if (!Number.isFinite(rs) || rs < 0 || rs > 50) return setError("La nota de rúbrica debe estar entre 0 y 50.");
    if (!Number.isFinite(es) || es < 0 || es > 50) return setError("La nota extra debe estar entre 0 y 50.");

    setLoading(true);
    try {
      await juryFinalEvaluate(activeBooking.id, {
        rubricScore: rs,
        extraScore: es,
        observations: observations.trim() || null,
      });

      const detail = await juryFinalBookingDetail(activeBooking.id);
      setActiveBooking(detail.booking);
      setEvaluations(detail.evaluations ?? []);
      await load();

      alert("Evaluación guardada ✅");
      setOpenEval(false);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "No se pudo guardar evaluación");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadActa = async (bookingId: number) => {
    setLoading(true);
    try {
      const blob = await juryFinalDownloadActaPdf(bookingId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `acta_final_defense_${bookingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "No se pudo descargar el acta");
    } finally {
      setLoading(false);
    }
  };

  const averageFrom = (evs: FinalDefenseEvaluationDto[]) => {
    if (!evs?.length) return null;
    const sum = evs.reduce((acc, x) => acc + (Number(x.totalScore) || (x.rubricScore + x.extraScore)), 0);
    return Math.round((sum / evs.length) * 100) / 100;
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

  return (
    <Box sx={{ minHeight: "100vh", background: "#f5f7f9", display: "flex", flexDirection: "column" }}>
      {/* HEADER DELGADO */}
      <AppBar position="static" sx={{ bgcolor: VERDE_INSTITUCIONAL, elevation: 2, zIndex: 1100 }}>
        <Toolbar sx={{ justifyContent: "space-between", px: { md: 5 }, minHeight: "56px !important", py: 0.8 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "#fff", lineHeight: 1 }}>
              Defensa Final
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
              onClick={() => nav("/jury/predefense")} 
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
              Atrás
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

      {/* CONTENIDO */}
      <Box sx={{ flex: 1, py: 3 }}>
        <Container maxWidth="md">
          <Card
            sx={{
              borderRadius: "25px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
              border: "1px solid #e1e8ed",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, color: VERDE_INSTITUCIONAL, mb: 2.5 }}>
                Mis Defensas Finales ({bookings.length})
              </Typography>

              {bookings.map((b) => (
                <Paper
                  key={b.id}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    mb: 2,
                    border: "2px solid #e9ecef",
                    borderRadius: "20px",
                    transition: "all 0.2s",
                    "&:hover": { bgcolor: "#f8f9fa", transform: "scale(1.01)", boxShadow: "0 5px 15px rgba(0,0,0,0.08)" },
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 1.5 }}>
                    <Box>
                      <Typography sx={{ fontWeight: 900, fontSize: "1.1rem" }}>
                        Defensa #{b.id}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#666", fontWeight: 700 }}>
                        {b.startsAt} → {b.endsAt}
                      </Typography>
                    </Box>
                    <Chip
                      icon={<AssessmentIcon sx={{ fontSize: "1rem" }} />}
                      label="Defensa Final"
                      size="small"
                      sx={{
                        bgcolor: VERDE_INSTITUCIONAL,
                        color: "white",
                        fontWeight: 900,
                        fontSize: "0.7rem"
                      }}
                    />
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Stack spacing={0.8}>
                    <Typography variant="body2" sx={{ fontSize: "0.9rem" }}>
                      <strong>Proyecto:</strong> {b.projectName ?? "-"}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: "0.9rem" }}>
                      <strong>Carrera:</strong> {b.careerName ?? "-"}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: "0.9rem" }}>
                      <strong>Estudiantes:</strong> {b.students?.map((s) => `${s.fullName} (${s.dni})`).join(" / ")}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: "0.9rem" }}>
                      <strong>Jurados:</strong> {b.jury?.map((j) => j.fullName).join(" / ")}
                    </Typography>
                  </Stack>

                  <Box sx={{ display: "flex", gap: 1.5, mt: 2.5, flexWrap: "wrap" }}>
                    <Button
                      onClick={() => openEvaluate(b)}
                      variant="contained"
                      startIcon={<AssessmentIcon />}
                      disabled={loading}
                      sx={{
                        bgcolor: VERDE_INSTITUCIONAL,
                        fontWeight: 900,
                        borderRadius: "50px",
                        textTransform: "none",
                        py: 1,
                        px: 2.5,
                        "&:hover": { bgcolor: "#007070", transform: "scale(1.05)" },
                      }}
                    >
                      Evaluar
                    </Button>

                    <Button
                      onClick={() => handleDownloadActa(b.id)}
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      disabled={loading}
                      sx={{
                        borderColor: VERDE_INSTITUCIONAL,
                        color: VERDE_INSTITUCIONAL,
                        fontWeight: 900,
                        borderRadius: "50px",
                        textTransform: "none",
                        py: 1,
                        px: 2.5,
                        "&:hover": {
                          borderColor: VERDE_INSTITUCIONAL,
                          bgcolor: "rgba(0, 139, 139, 0.05)",
                        },
                      }}
                    >
                      Descargar Acta
                    </Button>
                  </Box>
                </Paper>
              ))}

              {!bookings.length && (
                <Typography sx={{ color: "#777", textAlign: "center", py: 4, fontStyle: "italic" }}>
                  No tienes defensas asignadas todavía
                </Typography>
              )}
            </CardContent>
          </Card>
        </Container>
      </Box>

      {/* FOOTER DELGADO */}
      <Box sx={{ width: "100%", bgcolor: VERDE_INSTITUCIONAL, color: "#fff", py: 0.5, mt: "auto", textAlign: "center" }}>
        <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.8, fontSize: "0.65rem" }}>
          © {new Date().getFullYear()} - Panel de Jurado - Defensa Final
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

      {/* MODAL EVALUAR */}
      <Dialog 
        open={openEval} 
        onClose={() => setOpenEval(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "25px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: VERDE_INSTITUCIONAL, borderBottom: "1px solid #f1f2f6", py: 2 }}>
          Evaluar Defensa Final {activeBooking ? `#${activeBooking.id}` : ""}
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          {!activeBooking ? (
            <Typography sx={{ color: "#777" }}>Sin defensa seleccionada.</Typography>
          ) : (
            <>
              <Typography sx={{ fontWeight: 900, fontSize: "1rem" }}>
                {activeBooking.startsAt} → {activeBooking.endsAt}
              </Typography>

              <Typography sx={{ color: "#666", mt: 1, fontWeight: 600 }}>
                Estudiantes: {activeBooking.students?.map((s) => s.fullName).join(" / ")}
              </Typography>

              <Button
                onClick={async () => {
                  if (!activeBooking) return;
                  try {
                    const blob = await juryFinalDownloadRubricPdf(activeBooking.id);
                    const url = window.URL.createObjectURL(blob);
                    window.open(url, "_blank");
                  } catch (e: any) {
                    alert(e?.response?.data?.message ?? "No se pudo abrir la rúbrica (tal vez no existe).");
                  }
                }}
                variant="outlined"
                fullWidth
                startIcon={<VisibilityIcon />}
                sx={{
                  mt: 2.5,
                  mb: 2,
                  borderColor: VERDE_INSTITUCIONAL,
                  color: VERDE_INSTITUCIONAL,
                  fontWeight: 900,
                  borderRadius: "50px",
                  textTransform: "none",
                  py: 1.2,
                  "&:hover": { borderColor: VERDE_INSTITUCIONAL, bgcolor: "rgba(0, 139, 139, 0.05)" }
                }}
                disabled={loading || !activeBooking}
              >
                Ver Rúbrica (PDF)
              </Button>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mt: 2 }}>
                <TextField
                  label="Nota rúbrica (0–50)"
                  type="number"
                  value={rubricScore}
                  onChange={(e) => setRubricScore(Number(e.target.value))}
                  inputProps={{ min: 0, max: 50 }}
                  size="small"
                />
                <TextField
                  label="Nota extra (0–50)"
                  type="number"
                  value={extraScore}
                  onChange={(e) => setExtraScore(Number(e.target.value))}
                  inputProps={{ min: 0, max: 50 }}
                  size="small"
                />
              </Box>

              <Box sx={{ mt: 2, p: 2, bgcolor: "#f0fff4", borderRadius: 2, border: "1px solid #c6f6d5" }}>
                <Typography sx={{ fontWeight: 900, fontSize: "0.95rem" }}>
                  Total: <span style={{ fontSize: "1.2rem", color: VERDE_INSTITUCIONAL }}>{total}/100</span>
                </Typography>
                <Typography sx={{ fontWeight: 900, fontSize: "0.9rem", mt: 0.5 }}>
                  Veredicto: <span style={{ color: autoVerdict === "APROBADO" ? "#2e7d32" : "#c62828" }}>{autoVerdict}</span>
                </Typography>
              </Box>

              <TextField
                label="Observaciones"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                fullWidth
                multiline
                minRows={3}
                size="small"
                sx={{ mt: 2 }}
              />

              {error && (
                <Typography sx={{ color: "#c62828", mt: 1.5, fontWeight: 700, fontSize: "0.9rem" }}>
                  ⚠️ {error}
                </Typography>
              )}

              <Box sx={{ mt: 3, background: "#fafafa", border: "1px solid #eee", borderRadius: "20px", p: 2.5 }}>
                <Typography sx={{ fontWeight: 900, mb: 1.5, fontSize: "0.95rem" }}>
                  Evaluaciones Registradas ({evaluations.length})
                </Typography>

                {evaluations.map((ev) => (
                  <Box key={ev.id} sx={{ border: "1px solid #eee", borderRadius: "16px", p: 1.5, mb: 1.5, bgcolor: "#fff" }}>
                    <Typography sx={{ fontWeight: 900, fontSize: "0.9rem" }}>
                      {ev.juryName} — <span style={{ color: VERDE_INSTITUCIONAL }}>{ev.totalScore}/100</span>
                    </Typography>
                    <Typography sx={{ color: "#666", fontSize: "0.85rem", mt: 0.3 }}>
                      Rúbrica: {ev.rubricScore}/50 | Extra: {ev.extraScore}/50
                    </Typography>
                    {ev.observations && (
                      <Typography sx={{ color: "#666", fontSize: "0.85rem", mt: 0.5, fontStyle: "italic" }}>
                        💬 {ev.observations}
                      </Typography>
                    )}
                  </Box>
                ))}

                {evaluations.length > 0 && (
                  <Typography sx={{ mt: 1.5, fontWeight: 900, fontSize: "0.95rem", color: VERDE_INSTITUCIONAL }}>
                    Promedio Total: {averageFrom(evaluations) ?? "-"}/100
                  </Typography>
                )}

                {!evaluations.length && (
                  <Typography sx={{ color: "#777", textAlign: "center", py: 2, fontStyle: "italic" }}>
                    Aún no hay evaluaciones registradas
                  </Typography>
                )}
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: "1px solid #f1f2f6" }}>
          <Button
            onClick={() => setOpenEval(false)}
            sx={{ borderRadius: "50px", textTransform: "none", fontWeight: 900, px: 3 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveEvaluation}
            variant="contained"
            disabled={loading || !activeBooking}
            sx={{
              bgcolor: VERDE_INSTITUCIONAL,
              fontWeight: 900,
              borderRadius: "50px",
              textTransform: "none",
              px: 3,
              "&:hover": { bgcolor: "#007070", transform: "scale(1.05)" },
            }}
          >
            Guardar Evaluación
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}