// src/pages/FinalDefenseAdminPage.tsx
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
  Chip, // ✅ Importado
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { Dayjs } from "dayjs";

import { listCareers } from "../services/careerService";
import type { CareerDto } from "../services/careerService";

import {
  adminFinalCreateWindow,
  adminFinalListWindows,
  adminFinalCloseWindow,
  adminFinalCreateSlot,
  adminFinalListSlots,
  adminFinalListStudentsByCareer,
  adminFinalListJuries,
  adminFinalCreateBooking,
  adminFinalUploadRubric, // ✅ Importado
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

  const [startsAt, setStartsAt] = useState<Dayjs | null>(
    dayjs().add(1, "day").hour(8).minute(0).second(0)
  );
  const [endsAt, setEndsAt] = useState<Dayjs | null>(
    dayjs().add(7, "day").hour(18).minute(0).second(0)
  );

  const periodId = useMemo(() => {
    const ls = localStorage.getItem("adminPeriodId");
    if (!ls) return undefined;
    const n = Number(ls);
    return Number.isFinite(n) ? n : undefined;
  }, []);

  // -------- modal gestionar ventana --------
  const [openManage, setOpenManage] = useState(false);
  const [activeWindow, setActiveWindow] = useState<FinalDefenseWindowDto | null>(null);

  // Estado para manejar la carrera seleccionada manualmente en el modal
  const [manageCareerId, setManageCareerId] = useState<number | "">("");

  // ✅ Estado para el archivo de rúbrica
  const [rubricFile, setRubricFile] = useState<File | null>(null);

  const [slots, setSlots] = useState<FinalDefenseSlotDto[]>([]);
  const [slotStart, setSlotStart] = useState<Dayjs | null>(
    dayjs().add(2, "day").hour(9).minute(0).second(0)
  );
  const [slotEnd, setSlotEnd] = useState<Dayjs | null>(
    dayjs().add(2, "day").hour(10).minute(0).second(0)
  );

  const [students, setStudents] = useState<FinalDefenseStudentMiniDto[]>([]);
  const [juries, setJuries] = useState<JuryUserDto[]>([]);

  const [selectedSlotId, setSelectedSlotId] = useState<number | "">("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [selectedJuryIds, setSelectedJuryIds] = useState<number[]>([]);

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

  useEffect(() => {
    loadMain();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      alert(e?.response?.data?.message ?? "No se pudo crear ventana");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseWindow = async (id: number) => {
    if (!confirm("¿Cerrar esta ventana?")) return;
    setLoading(true);
    try {
      await adminFinalCloseWindow(id);
      await loadMain();
    } finally {
      setLoading(false);
    }
  };

  const openWindowManage = async (w: FinalDefenseWindowDto) => {
    setActiveWindow(w);
    setOpenManage(true);

    // Inicializamos manageCareerId si la ventana ya tiene carrera, sino vacío
    setManageCareerId(w.careerId ?? "");
    setRubricFile(null); // Limpiamos archivo previo

    setSelectedSlotId("");
    setSelectedStudentIds([]);
    setSelectedJuryIds([]);

    setLoading(true);
    try {
      const [sl, ju] = await Promise.all([adminFinalListSlots(w.id), adminFinalListJuries()]);
      setSlots(sl);
      setJuries(ju);

      // Carga condicional: si la ventana tiene carrera fija, cargamos. Si no, esperamos selección.
      const cid = w.careerId ?? null;
      if (cid) {
        const st = await adminFinalListStudentsByCareer(cid, periodId);
        setStudents(st);
      } else {
        setStudents([]); // se llenará cuando el admin seleccione carrera en el modal
      }
    } finally {
      setLoading(false);
    }
  };

  const reloadSlots = async () => {
    if (!activeWindow) return;
    const sl = await adminFinalListSlots(activeWindow.id);
    setSlots(sl);
  };

  // ✅ Función para subir rúbrica
  const handleUploadRubric = async () => {
    if (!activeWindow) return;
    if (!rubricFile) return alert("Selecciona un PDF");

    // Validación simple PDF
    const isPdf =
      rubricFile.type.toLowerCase().includes("pdf") ||
      rubricFile.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) return alert("Solo se permite PDF");

    setLoading(true);
    try {
      await adminFinalUploadRubric(activeWindow.id, rubricFile);
      setRubricFile(null);
      
      await loadMain(); // refresca lista general
      
      // Actualizamos visualmente el activeWindow para que el Chip cambie inmediatamente
      setActiveWindow(prev => prev ? ({ ...prev, hasRubric: true }) : null);

      alert("Rúbrica subida ✅");
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "No se pudo subir la rúbrica");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = async () => {
    if (!activeWindow) return;
    if (!slotStart || !slotEnd) return alert("Selecciona inicio/fin slot válido");

    setLoading(true);
    try {
      await adminFinalCreateSlot(activeWindow.id, {
        startsAt: slotStart.format("YYYY-MM-DDTHH:mm:ss"),
        endsAt: slotEnd.format("YYYY-MM-DDTHH:mm:ss"),
      });
      await reloadSlots();
      alert("Slot creado ✅");
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "No se pudo crear slot");
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (id: number) => {
    setSelectedStudentIds((prev) => {
      const exists = prev.includes(id);
      if (exists) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev; // max 2
      return [...prev, id];
    });
  };

  const toggleJury = (id: number) => {
    setSelectedJuryIds((prev) => {
      const exists = prev.includes(id);
      if (exists) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, id];
    });
  };

  const handleCreateBooking = async () => {
    if (!activeWindow) return;
    if (!selectedSlotId) return alert("Selecciona un slot");
    if (selectedStudentIds.length < 1) return alert("Selecciona 1 o 2 estudiantes");
    if (selectedJuryIds.length !== 3) return alert("Selecciona exactamente 3 jurados");

    // ✅ VALIDACIÓN FINAL DE SEGURIDAD
    const selected = students.filter(s => selectedStudentIds.includes(s.id));
    const invalid = selected.find(s => !s.projectName?.trim());
    if (invalid) {
      return alert(
        `El estudiante ${invalid.fullName} (${invalid.dni}) no tiene proyecto asignado`
      );
    }

    setLoading(true);
    try {
      await adminFinalCreateBooking({
        slotId: Number(selectedSlotId),
        studentIds: selectedStudentIds,
        juryUserIds: selectedJuryIds,
      });

      await reloadSlots(); // slot queda booked
      setSelectedSlotId("");
      setSelectedStudentIds([]);
      setSelectedJuryIds([]);

      alert("Booking creado ✅");
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "No se pudo crear booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "#f4f7f6", py: 3 }}>
      <Container maxWidth="md">
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 900, color: VERDE }}>
            Defensa Final (Admin)
          </Typography>

          <Button variant="outlined" onClick={() => nav("/admin")} sx={{ borderColor: VERDE, color: VERDE }}>
            Volver
          </Button>
        </Box>

        {/* Crear ventana */}
        <Box sx={{ background: "#fff", p: 2, borderRadius: 2, boxShadow: "0 4px 12px rgba(0,0,0,0.06)", mb: 2 }}>
          <Typography sx={{ fontWeight: 900, mb: 1 }}>Crear ventana</Typography>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <DateTimePicker
                label="Inicio"
                value={startsAt}
                onChange={(v) => setStartsAt(v)}
                slotProps={{ textField: { fullWidth: true, helperText: "Fecha y hora" } }}
              />
              <DateTimePicker
                label="Fin"
                value={endsAt}
                onChange={(v) => setEndsAt(v)}
                slotProps={{ textField: { fullWidth: true, helperText: "Fecha y hora" } }}
              />
            </Box>
          </LocalizationProvider>

          <Box sx={{ mt: 2 }}>
            <select
              value={careerId}
              onChange={(e) => setCareerId(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
              style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
            >
              <option value="ALL">Todas las carreras</option>
              {careers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Box>

          <Button
            onClick={handleCreateWindow}
            disabled={loading}
            variant="contained"
            sx={{ mt: 2, bgcolor: VERDE, fontWeight: 900 }}
            fullWidth
          >
            Crear ventana
          </Button>
        </Box>

        {/* Ventanas */}
        <Box sx={{ background: "#fff", p: 2, borderRadius: 2, boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
          <Typography sx={{ fontWeight: 900, mb: 1 }}>Ventanas ({windows.length})</Typography>

          {windows.map((w) => (
            <Box
              key={w.id}
              sx={{
                border: "1px solid #eee",
                borderRadius: 2,
                p: 2,
                mb: 1.5,
                display: "flex",
                justifyContent: "space-between",
                gap: 2,
                alignItems: "center",
              }}
            >
              <Box>
                {/* ✅ TITULO + CHIP DE RÚBRICA */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <Typography sx={{ fontWeight: 900 }}>
                    {w.careerName ? w.careerName : "Todas las carreras"} {w.academicPeriodName ? `— ${w.academicPeriodName}` : ""}
                  </Typography>

                  {w.hasRubric ? (
                    <Box
                      sx={{
                        px: 1.2,
                        py: 0.35,
                        borderRadius: 999,
                        fontSize: "0.75rem",
                        fontWeight: 900,
                        bgcolor: "rgba(46,125,50,0.12)",
                        color: "#2e7d32",
                        border: "1px solid rgba(46,125,50,0.35)",
                      }}
                    >
                      Rúbrica ✅
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        px: 1.2,
                        py: 0.35,
                        borderRadius: 999,
                        fontSize: "0.75rem",
                        fontWeight: 900,
                        bgcolor: "rgba(198,40,40,0.10)",
                        color: "#c62828",
                        border: "1px solid rgba(198,40,40,0.28)",
                      }}
                    >
                      Sin rúbrica
                    </Box>
                  )}
                </Box>

                <Typography variant="body2" sx={{ color: "#666" }}>
                  {w.startsAt} → {w.endsAt}
                </Typography>
                <Typography variant="body2" sx={{ color: w.isActive ? "#2e7d32" : "#c62828", fontWeight: 900 }}>
                  {w.isActive ? "ACTIVA" : "CERRADA"}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={() => openWindowManage(w)}
                  sx={{ borderColor: VERDE, color: VERDE, fontWeight: 900 }}
                >
                  Gestionar
                </Button>

                {w.isActive && (
                  <Button
                    onClick={() => handleCloseWindow(w.id)}
                    variant="contained"
                    sx={{ bgcolor: "#d32f2f", fontWeight: 900 }}
                  >
                    Cerrar
                  </Button>
                )}
              </Box>
            </Box>
          ))}

          {!windows.length && <Typography sx={{ color: "#777" }}>No hay ventanas aún.</Typography>}
        </Box>

        {/* MODAL gestionar */}
        <Dialog open={openManage} onClose={() => setOpenManage(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 900, color: VERDE }}>
            Gestionar Ventana {activeWindow ? `#${activeWindow.id}` : ""}
          </DialogTitle>

          <DialogContent dividers>
            {!activeWindow ? (
              <Typography sx={{ color: "#777" }}>Sin ventana seleccionada.</Typography>
            ) : (
              <>
                {/* ✅ RÚBRICA PDF */}
                <Box sx={{ background: "#fff", border: "1px solid #eee", borderRadius: 2, p: 2, mb: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
                    <Typography sx={{ fontWeight: 900 }}>Rúbrica (PDF)</Typography>

                    <Chip
                      label={activeWindow?.hasRubric ? "Rúbrica ✅" : "Sin rúbrica"}
                      color={activeWindow?.hasRubric ? "success" : "default"}
                      variant={activeWindow?.hasRubric ? "filled" : "outlined"}
                    />
                  </Box>

                  <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mt: 1.5, flexWrap: "wrap" }}>
                    <Button variant="outlined" component="label" sx={{ borderColor: VERDE, color: VERDE, fontWeight: 900 }}>
                      Seleccionar PDF
                      <input
                        type="file"
                        hidden
                        accept="application/pdf"
                        onChange={(e) => {
                          const f = e.target.files?.[0] ?? null;
                          setRubricFile(f);
                        }}
                      />
                    </Button>

                    <Typography sx={{ color: "#666", fontSize: "0.9rem" }}>
                      {rubricFile ? rubricFile.name : "Ningún archivo seleccionado"}
                    </Typography>

                    <Button
                      onClick={handleUploadRubric}
                      disabled={loading || !rubricFile}
                      variant="contained"
                      sx={{ bgcolor: VERDE, fontWeight: 900 }}
                    >
                      Subir rúbrica
                    </Button>
                  </Box>
                </Box>

                {/* Crear slot */}
                <Box sx={{ background: "#fafafa", border: "1px solid #eee", borderRadius: 2, p: 2, mb: 2 }}>
                  <Typography sx={{ fontWeight: 900, mb: 1 }}>Crear slot</Typography>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                      <DateTimePicker
                        label="Inicio slot"
                        value={slotStart}
                        onChange={(v) => setSlotStart(v)}
                        slotProps={{ textField: { fullWidth: true, size: "small" } }}
                      />
                      <DateTimePicker
                        label="Fin slot"
                        value={slotEnd}
                        onChange={(v) => setSlotEnd(v)}
                        slotProps={{ textField: { fullWidth: true, size: "small" } }}
                      />
                    </Box>
                  </LocalizationProvider>

                  <Button
                    onClick={handleCreateSlot}
                    disabled={loading}
                    variant="contained"
                    sx={{ mt: 2, bgcolor: VERDE, fontWeight: 900 }}
                    fullWidth
                  >
                    Crear slot
                  </Button>
                </Box>

                {/* Crear booking */}
                <Box sx={{ background: "#fff", border: "1px solid #eee", borderRadius: 2, p: 2 }}>
                  <Typography sx={{ fontWeight: 900, mb: 1 }}>
                    Crear booking (slot + 1–2 estudiantes + 3 jurados)
                  </Typography>

                  <Typography sx={{ fontWeight: 800, mt: 1 }}>Slot</Typography>
                  <select
                    value={selectedSlotId}
                    onChange={(e) => setSelectedSlotId(e.target.value ? Number(e.target.value) : "")}
                    style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #ddd", marginTop: 6 }}
                  >
                    <option value="">Selecciona un slot</option>
                    {slots.map((s) => (
                      <option key={s.id} value={s.id} disabled={s.booked}>
                        {s.startsAt} → {s.endsAt} {s.booked ? " (RESERVADO)" : ""}
                      </option>
                    ))}
                  </select>

                  <Typography sx={{ fontWeight: 800, mt: 2 }}>Estudiantes (máx 2)</Typography>
                  
                  {/* Selector de carrera si la ventana no tiene careerId asignado */}
                  {!activeWindow.careerId && (
                    <Box sx={{ mt: 1, mb: 2 }}>
                      <Typography sx={{ fontSize: "0.9rem", color: "#666", mb: 0.5 }}>
                        Selecciona carrera para ver estudiantes:
                      </Typography>
                      <select
                        value={manageCareerId}
                        onChange={async (e) => {
                          const cid = e.target.value ? Number(e.target.value) : "";
                          setManageCareerId(cid);
                          
                          // Limpieza de selección
                          setSelectedStudentIds([]);

                          if (!cid) {
                            setStudents([]);
                            return;
                          }
                          
                          // Cargamos estudiantes de la carrera seleccionada
                          const st = await adminFinalListStudentsByCareer(cid, periodId);
                          setStudents(st);
                        }}
                        style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
                      >
                        <option value="">-- Selecciona carrera --</option>
                        {careers.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </Box>
                  )}

                  {/* Lista de estudiantes */}
                  {(activeWindow.careerId || manageCareerId) ? (
                    <Box sx={{ mt: 1, display: "grid", gap: 1 }}>
                      {students.map((st) => {
                        const checked = selectedStudentIds.includes(st.id);
                        const hasProject = !!st.projectName?.trim();

                        return (
                          <Box
                            key={st.id}
                            onClick={() => {
                              if (!hasProject) return;
                              toggleStudent(st.id);
                            }}
                            sx={{
                              p: 1.2,
                              borderRadius: 2,
                              border: `1px solid ${checked ? VERDE : "#eee"}`,
                              cursor: hasProject ? "pointer" : "not-allowed",
                              background: checked ? "rgba(0,139,139,0.06)" : "#fff",
                              opacity: hasProject ? 1 : 0.5,
                            }}
                          >
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <Typography sx={{ fontWeight: 900, fontSize: "0.95rem" }}>
                                {st.fullName} ({st.dni})
                              </Typography>
                              {checked && <Typography sx={{ color: VERDE, fontWeight: 900 }}>✓</Typography>}
                            </Box>
                            
                            {hasProject ? (
                              <Typography sx={{ color: "#555", fontSize: "0.85rem", mt: 0.5 }}>
                                Proyecto: <b>{st.projectName}</b>
                              </Typography>
                            ) : (
                              <Typography sx={{ color: "#c62828", fontSize: "0.85rem", mt: 0.5, fontWeight: 800 }}>
                                ⚠ SIN PROYECTO ASIGNADO
                              </Typography>
                            )}
                          </Box>
                        );
                      })}
                      
                      {!students.length && (
                        <Typography sx={{ color: "#777", fontStyle: "italic", p: 1 }}>
                            No se encontraron estudiantes en esta carrera/período.
                        </Typography>
                      )}

                      {selectedStudentIds.length === 2 && (
                        <Typography sx={{ color: "#666", fontSize: "0.8rem" }}>
                          Seleccionaste 2 estudiantes (máximo).
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Typography sx={{ color: "#777", fontStyle: "italic", mt: 1 }}>
                      Esperando selección de carrera...
                    </Typography>
                  )}

                  <Typography sx={{ fontWeight: 800, mt: 2 }}>Jurados (exactamente 3)</Typography>
                  <Box sx={{ mt: 1, display: "grid", gap: 1 }}>
                    {juries.map((j) => {
                      const checked = selectedJuryIds.includes(j.id);
                      return (
                        <Box
                          key={j.id}
                          onClick={() => toggleJury(j.id)}
                          sx={{
                            p: 1.1,
                            borderRadius: 2,
                            border: `1px solid ${checked ? VERDE : "#eee"}`,
                            cursor: "pointer",
                            background: checked ? "rgba(0,139,139,0.06)" : "#fff",
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 2,
                          }}
                        >
                          <Box>
                            <Typography sx={{ fontWeight: 900 }}>{j.fullName}</Typography>
                            <Typography sx={{ color: "#666", fontSize: "0.85rem" }}>{j.email}</Typography>
                          </Box>
                          <Typography sx={{ color: checked ? VERDE : "#999", fontWeight: 900 }}>
                            {checked ? "✓" : ""}
                          </Typography>
                        </Box>
                      );
                    })}
                    {!juries.length && <Typography sx={{ color: "#777" }}>No hay jurados disponibles.</Typography>}
                    <Typography sx={{ color: "#666", fontSize: "0.8rem" }}>
                      Seleccionados: {selectedJuryIds.length}/3
                    </Typography>
                  </Box>

                  <Button
                    onClick={handleCreateBooking}
                    disabled={
                      loading ||
                      (!activeWindow.careerId && !manageCareerId) ||
                      !selectedSlotId ||
                      selectedStudentIds.length < 1 ||
                      selectedStudentIds.length > 2 ||
                      selectedJuryIds.length !== 3
                    }
                    variant="contained"
                    sx={{ mt: 2, bgcolor: VERDE, fontWeight: 900 }}
                    fullWidth
                  >
                    Crear booking
                  </Button>
                </Box>
              </>
            )}
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenManage(false)} sx={{ fontWeight: 900 }}>
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}