import { useEffect, useMemo, useState } from "react";
import { Box, Button, Container, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { Dayjs } from "dayjs";

import { listCareers } from "../services/careerService";
import type { CareerDto } from "../services/careerService";
import { adminCreateWindow, adminListWindows, adminCloseWindow } from "../services/predefenseService";

const VERDE_INSTITUCIONAL = "#008B8B";

export default function AdminPredefensePage() {
  const nav = useNavigate();
  const [careers, setCareers] = useState<CareerDto[]>([]);
  const [windows, setWindows] = useState<any[]>([]);
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

  const load = async () => {
    setLoading(true);
    try {
      const [cs, ws] = await Promise.all([listCareers(), adminListWindows(periodId)]);
      setCareers(Array.isArray(cs) ? cs : []);
      setWindows(Array.isArray(ws) ? ws : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const handleCreate = async () => {
    // ✅ CORRECCIÓN: Validar antes de enviar para evitar el error de 'null'
    if (!startsAt || !endsAt) {
      alert("Por favor selecciona fecha de inicio y fin válidas.");
      return;
    }

    setLoading(true);
    try {
      await adminCreateWindow({
        academicPeriodId: periodId ?? null,
        careerId: careerId === "ALL" ? null : careerId,
        // Al pasar la validación if(!startsAt), TS sabe que aquí son Dayjs válidos
        startsAt: startsAt.format("YYYY-MM-DDTHH:mm:ss"),
        endsAt: endsAt.format("YYYY-MM-DDTHH:mm:ss"),
      });
      await load();
      alert("Ventana creada ✅");
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "No se pudo crear ventana");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async (id: number) => {
    if (!confirm("¿Cerrar esta ventana?")) return;
    setLoading(true);
    try {
      await adminCloseWindow(id);
      await load();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "#f4f7f6", py: 3 }}>
      <Container maxWidth="md">
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 900, color: VERDE_INSTITUCIONAL }}>
            Predefensas (Admin)
          </Typography>

          <Button variant="outlined" onClick={() => nav("/admin")} sx={{ borderColor: VERDE_INSTITUCIONAL, color: VERDE_INSTITUCIONAL }}>
            Volver
          </Button>
        </Box>

        {/* Crear ventana */}
        <Box sx={{ background: "#fff", p: 2, borderRadius: 2, boxShadow: "0 4px 12px rgba(0,0,0,0.06)", mb: 2 }}>
          <Typography sx={{ fontWeight: 800, mb: 1 }}>Crear ventana</Typography>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <DateTimePicker
                label="Inicio"
                value={startsAt}
                onChange={(v) => setStartsAt(v)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    helperText: "Selecciona fecha y hora",
                  },
                }}
              />

              <DateTimePicker
                label="Fin"
                value={endsAt}
                onChange={(v) => setEndsAt(v)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    helperText: "Selecciona fecha y hora",
                  },
                }}
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
            onClick={handleCreate}
            disabled={loading}
            variant="contained"
            sx={{ mt: 2, bgcolor: VERDE_INSTITUCIONAL, fontWeight: 900 }}
            fullWidth
          >
            Crear ventana
          </Button>
        </Box>

        {/* Listado */}
        <Box sx={{ background: "#fff", p: 2, borderRadius: 2, boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
          <Typography sx={{ fontWeight: 800, mb: 1 }}>
            Ventanas ({windows.length})
          </Typography>

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
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 900 }}>
                  {w.careerName ? w.careerName : "Todas las carreras"} — {w.academicPeriodName}
                </Typography>
                <Typography variant="body2" sx={{ color: "#666" }}>
                  {w.startsAt} → {w.endsAt}
                </Typography>
                <Typography variant="body2" sx={{ color: w.isActive ? "#2e7d32" : "#c62828", fontWeight: 800 }}>
                  {w.isActive ? "ACTIVA" : "CERRADA"}
                </Typography>
              </Box>

              {w.isActive && (
                <Button
                  onClick={() => handleClose(w.id)}
                  variant="contained"
                  sx={{ bgcolor: "#d32f2f", fontWeight: 900 }}
                >
                  Cerrar
                </Button>
              )}
            </Box>
          ))}

          {!windows.length && <Typography sx={{ color: "#777" }}>No hay ventanas aún.</Typography>}
        </Box>
      </Container>
    </Box>
  );
}