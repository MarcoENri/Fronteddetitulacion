// src/pages/FinalDefenseJuryPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import {
  juryFinalMyBookings,
  juryFinalBookingDetail,
  juryFinalEvaluate,
  juryFinalDownloadActaPdf,
  juryFinalDownloadRubricPdf, // ✅ Import added
  type FinalDefenseBookingDto,
  type FinalDefenseEvaluationDto,
} from "../services/finalDefenseService";

const VERDE = "#008B8B";

export default function FinalDefenseJuryPage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);

  const [bookings, setBookings] = useState<FinalDefenseBookingDto[]>([]);

  const [openEval, setOpenEval] = useState(false);
  const [activeBooking, setActiveBooking] = useState<FinalDefenseBookingDto | null>(null);
  const [evaluations, setEvaluations] = useState<FinalDefenseEvaluationDto[]>([]);

  const [rubricScore, setRubricScore] = useState<number>(0); // 0..50
  const [extraScore, setExtraScore] = useState<number>(0);   // 0..50
  const [observations, setObservations] = useState("");
  const [error, setError] = useState("");

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    if (!confirm("¿Cerrar sesión?")) return;
    localStorage.clear();
    nav("/");
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

  return (
    <Box sx={{ minHeight: "100vh", background: "#f4f7f6", py: 3 }}>
      <Container maxWidth="md">
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: VERDE }}>
              Defensa Final (Jurado)
            </Typography>
            {periodId && (
              <Typography variant="body2" sx={{ color: "#666" }}>
                Período activo (localStorage): {periodId}
              </Typography>
            )}
          </Box>

          <Button variant="outlined" color="error" onClick={handleLogout} sx={{ fontWeight: 900 }}>
            Cerrar sesión
          </Button>
        </Box>

        <Box sx={{ background: "#fff", p: 2, borderRadius: 2, boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
          <Typography sx={{ fontWeight: 900, mb: 1 }}>Mis bookings ({bookings.length})</Typography>

          {bookings.map((b) => (
            <Box key={b.id} sx={{ border: "1px solid #eee", borderRadius: 2, p: 2, mb: 1.5 }}>
              <Typography sx={{ fontWeight: 900 }}>
                #{b.id} — {b.startsAt} → {b.endsAt}
              </Typography>
              <Typography sx={{ color: "#666", mt: 0.5 }}>
                Proyecto: {b.projectName ?? "-"}
              </Typography>

              <Typography sx={{ color: "#666", mt: 0.5 }}>
                Carrera: {b.careerName ?? "-"}
              </Typography>

              <Typography sx={{ color: "#666" }}>
                Estudiantes: {b.students?.map((s) => `${s.fullName} (${s.dni})`).join(" / ")}
              </Typography>

              <Typography sx={{ color: "#666", mt: 0.5 }}>
                Jurados: {b.jury?.map((j) => j.fullName).join(" / ")}
              </Typography>

              <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
                <Button
                  onClick={() => openEvaluate(b)}
                  variant="contained"
                  sx={{ bgcolor: VERDE, fontWeight: 900 }}
                  disabled={loading}
                >
                  Evaluar
                </Button>

                <Button
                  onClick={() => handleDownloadActa(b.id)}
                  variant="outlined"
                  sx={{ borderColor: VERDE, color: VERDE, fontWeight: 900 }}
                  disabled={loading}
                >
                  Descargar acta (PDF)
                </Button>
              </Box>
            </Box>
          ))}

          {!bookings.length && (
            <Typography sx={{ color: "#777" }}>
              No tienes bookings asignados todavía.
            </Typography>
          )}
        </Box>

        {/* MODAL EVALUAR */}
        <Dialog open={openEval} onClose={() => setOpenEval(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 900, color: VERDE }}>
            Evaluar defensa final {activeBooking ? `#${activeBooking.id}` : ""}
          </DialogTitle>

          <DialogContent dividers>
            {!activeBooking ? (
              <Typography sx={{ color: "#777" }}>Sin booking seleccionado.</Typography>
            ) : (
              <>
                <Typography sx={{ fontWeight: 900 }}>
                  {activeBooking.startsAt} → {activeBooking.endsAt}
                </Typography>

                <Typography sx={{ color: "#666", mt: 1 }}>
                  Estudiantes: {activeBooking.students?.map((s) => s.fullName).join(" / ")}
                </Typography>

                {/* ✅ BOTÓN NUEVO: VER RÚBRICA */}
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
                  sx={{ mt: 2, mb: 1, borderColor: VERDE, color: VERDE, fontWeight: 900 }}
                  disabled={loading || !activeBooking}
                >
                  Ver rúbrica (PDF)
                </Button>

                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mt: 2 }}>
                  <TextField
                    label="Nota rúbrica (0–50)"
                    type="number"
                    value={rubricScore}
                    onChange={(e) => setRubricScore(Number(e.target.value))}
                    inputProps={{ min: 0, max: 50 }}
                  />
                  <TextField
                    label="Nota extra (0–50)"
                    type="number"
                    value={extraScore}
                    onChange={(e) => setExtraScore(Number(e.target.value))}
                    inputProps={{ min: 0, max: 50 }}
                  />
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ fontWeight: 900 }}>
                    Total: {total}/100 — Veredicto automático:{" "}
                    <span style={{ color: autoVerdict === "APROBADO" ? "#2e7d32" : "#c62828" }}>
                      {autoVerdict}
                    </span>
                  </Typography>
                </Box>

                <TextField
                  label="Observaciones"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  fullWidth
                  multiline
                  minRows={3}
                  sx={{ mt: 2 }}
                />

                {error && (
                  <Typography sx={{ color: "#c62828", mt: 1, fontWeight: 700 }}>
                    {error}
                  </Typography>
                )}

                <Box sx={{ mt: 3, background: "#fafafa", border: "1px solid #eee", borderRadius: 2, p: 2 }}>
                  <Typography sx={{ fontWeight: 900, mb: 1 }}>
                    Evaluaciones registradas ({evaluations.length})
                  </Typography>

                  {evaluations.map((ev) => (
                    <Box key={ev.id} sx={{ border: "1px solid #eee", borderRadius: 2, p: 1.2, mb: 1 }}>
                      <Typography sx={{ fontWeight: 900 }}>
                        {ev.juryName} — {ev.totalScore}/100
                      </Typography>
                      <Typography sx={{ color: "#666", fontSize: "0.85rem" }}>
                        Rúbrica: {ev.rubricScore}/50 | Extra: {ev.extraScore}/50
                      </Typography>
                      {ev.observations && (
                        <Typography sx={{ color: "#666", fontSize: "0.85rem", mt: 0.5 }}>
                          {ev.observations}
                        </Typography>
                      )}
                    </Box>
                  ))}

                  {evaluations.length > 0 && (
                    <Typography sx={{ mt: 1, fontWeight: 900 }}>
                      Promedio (3 jurados): {averageFrom(evaluations) ?? "-"}
                    </Typography>
                  )}

                  {!evaluations.length && <Typography sx={{ color: "#777" }}>Aún no hay evaluaciones.</Typography>}
                </Box>
              </>
            )}
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenEval(false)} sx={{ fontWeight: 900 }}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEvaluation}
              variant="contained"
              sx={{ bgcolor: VERDE, fontWeight: 900 }}
              disabled={loading || !activeBooking}
            >
              Guardar evaluación
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}