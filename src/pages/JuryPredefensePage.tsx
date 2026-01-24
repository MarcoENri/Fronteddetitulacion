// src/pages/JuryPredefensePage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Container, TextField, Typography } from "@mui/material";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { Dayjs } from "dayjs";

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

  // Periodo activo (si tu backend lo usa aquí)
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
  }, []);

  const handleLogout = () => {
    if (!confirm("¿Estás seguro de que deseas cerrar sesión?")) return;
    localStorage.clear();
    nav("/"); // ✅ tu login está en "/"
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

      // auto seleccionar primer estudiante si existe
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

  return (
    <Box sx={{ minHeight: "100vh", background: "#f4f7f6", py: 3 }}>
      <Container maxWidth="md">
        {/* ✅ HEADER + MINI MENÚ */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: VERDE_INSTITUCIONAL }}>
              Jurado — Panel
            </Typography>
            <Typography variant="body2" sx={{ color: "#666" }}>
              Módulo activo: <b>Predefensa</b>
              {periodId ? ` — Periodo: ${periodId}` : ""}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {/* Tab: Predefensa (activo) */}
            <Button
              variant="contained"
              disabled
              sx={{
                bgcolor: VERDE_INSTITUCIONAL,
                fontWeight: 900,
                opacity: 0.9,
              }}
            >
              Predefensa
            </Button>

            {/* Tab: Defensa Final */}
            <Button
              variant="outlined"
              onClick={() => nav("/jury/final-defense")}
              sx={{
                borderColor: VERDE_INSTITUCIONAL,
                color: VERDE_INSTITUCIONAL,
                fontWeight: 900,
              }}
            >
              Defensa Final
            </Button>

            {/* Logout */}
            <Button
              variant="outlined"
              color="error"
              onClick={handleLogout}
              sx={{ fontWeight: 900, borderColor: "#d32f2f", color: "#d32f2f" }}
            >
              Cerrar Sesión
            </Button>
          </Box>
        </Box>

        {/* Select carrera */}
        <Box
          sx={{
            background: "#fff",
            p: 2,
            borderRadius: 2,
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            mb: 2,
          }}
        >
          <Typography sx={{ fontWeight: 800, mb: 1 }}>Carrera</Typography>
          <select
            value={careerId ?? ""}
            onChange={(e) => {
              const v = Number(e.target.value);
              setCareerId(v);
              loadCareer(v);
            }}
            style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
          >
            <option value="" disabled>
              Selecciona una carrera
            </option>
            {careers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Box>

        {/* Ventanas */}
        <Box
          sx={{
            background: "#fff",
            p: 2,
            borderRadius: 2,
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            mb: 2,
          }}
        >
          <Typography sx={{ fontWeight: 800, mb: 1 }}>Ventana activa</Typography>

          <select
            value={windowId ?? ""}
            onChange={(e) => handleSelectWindow(Number(e.target.value))}
            style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
            disabled={!windows.length}
          >
            {!windows.length && <option value="">No hay ventanas activas para este periodo</option>}
            {windows.map((w) => (
              <option key={w.id} value={w.id}>
                {w.startsAt} → {w.endsAt} ({w.isActive ? "ACTIVA" : "CERRADA"})
              </option>
            ))}
          </select>

          {/* Crear Slot */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 900, color: "#555" }}>
              Crear Nuevo Slot de Tiempo
            </Typography>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <DateTimePicker
                  label="Inicio del Slot"
                  value={slotStartsAt}
                  onChange={(v) => setSlotStartsAt(v)}
                  slotProps={{ textField: { fullWidth: true, size: "small" } }}
                />
                <DateTimePicker
                  label="Fin del Slot"
                  value={slotEndsAt}
                  onChange={(v) => setSlotEndsAt(v)}
                  slotProps={{ textField: { fullWidth: true, size: "small" } }}
                />
              </Box>
            </LocalizationProvider>

            <Button
              onClick={handleCreateSlot}
              disabled={loading || !windowId}
              variant="contained"
              sx={{ mt: 2, bgcolor: VERDE_INSTITUCIONAL, fontWeight: 900 }}
              fullWidth
            >
              Crear slot
            </Button>
          </Box>
        </Box>

        {/* Estudiantes */}
        <Box
          sx={{
            background: "#fff",
            p: 2,
            borderRadius: 2,
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            mb: 2,
          }}
        >
          <Typography sx={{ fontWeight: 800, mb: 1 }}>
            Estudiante a reservar ({students.length})
          </Typography>

          <select
            value={selectedStudentId ?? ""}
            onChange={(e) => setSelectedStudentId(Number(e.target.value))}
            style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
            disabled={!students.length}
          >
            <option value="" disabled>
              Selecciona un estudiante
            </option>

            {!students.length && <option value="">Sin estudiantes en este periodo</option>}
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} — {s.dni} — {s.status}
              </option>
            ))}
          </select>
        </Box>

        {/* Slots */}
        <Box
          sx={{
            background: "#fff",
            p: 2,
            borderRadius: 2,
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
          }}
        >
          <Typography sx={{ fontWeight: 800, mb: 1 }}>Slots ({slots.length})</Typography>

          {slots.map((sl) => (
            <Box
              key={sl.id}
              sx={{
                border: "1px solid #eee",
                borderRadius: 2,
                p: 2,
                mb: 1.5,
              }}
            >
              <Typography sx={{ fontWeight: 900 }}>
                {sl.startsAt} → {sl.endsAt}
              </Typography>

              <Typography sx={{ fontWeight: 900, color: sl.booked ? "#c62828" : "#2e7d32" }}>
                {sl.booked ? `RESERVADO (bookingId: ${sl.bookingId})` : "LIBRE"}
              </Typography>

              {!sl.booked ? (
                <Button
                  onClick={() => handleReserve(sl.id)}
                  disabled={loading}
                  variant="contained"
                  sx={{ mt: 1, bgcolor: VERDE_INSTITUCIONAL, fontWeight: 900 }}
                >
                  Reservar con estudiante
                </Button>
              ) : (
                <Box sx={{ mt: 1 }}>
                  <TextField
                    label="Observación (envía email al estudiante)"
                    value={obsText}
                    onChange={(e) => setObsText(e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                  />
                  <Button
                    onClick={() => handleSendObservation(sl.bookingId)}
                    disabled={loading}
                    variant="contained"
                    sx={{ mt: 1, bgcolor: "#0b7f7a", fontWeight: 900 }}
                    fullWidth
                  >
                    Enviar observación
                  </Button>
                </Box>
              )}
            </Box>
          ))}

          {!slots.length && <Typography sx={{ color: "#777" }}>No hay slots todavía.</Typography>}
        </Box>
      </Container>
    </Box>
  );
}
