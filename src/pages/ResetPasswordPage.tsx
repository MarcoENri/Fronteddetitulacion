import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Box, TextField, Button, Typography, Paper } from "@mui/material";
import { resetPassword } from "../services/authService";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const nav = useNavigate();

  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setMsg("");

    if (!token) {
      setMsg("Token inválido o ausente.");
      return;
    }

    if (password.length < 6) {
      setMsg("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setMsg("Contraseña actualizada correctamente ✅");
      setTimeout(() => nav("/"), 2000);
    } catch (e: any) {
      setMsg(e?.response?.data?.message ?? "Error al cambiar contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "#f4f6f8",
      }}
    >
      <Paper sx={{ p: 4, width: 350, borderRadius: 3 }}>
        <Typography fontWeight={900} textAlign="center" mb={2}>
          Nueva contraseña
        </Typography>

        <TextField
          label="Nueva contraseña"
          type="password"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {msg && (
          <Typography
            sx={{
              mt: 1,
              fontSize: "0.85rem",
              color: msg.includes("✅") ? "#2e7d32" : "#d32f2f",
            }}
          >
            {msg}
          </Typography>
        )}

        <Button
          fullWidth
          variant="contained"
          sx={{ mt: 2, fontWeight: 900 }}
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading ? "Guardando..." : "Cambiar contraseña"}
        </Button>
      </Paper>
    </Box>
  );
}