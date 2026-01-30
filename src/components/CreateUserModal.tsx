import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  MenuItem,
  FormControlLabel,
  Switch,
  IconButton,
  Fade,
  Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { createUser } from "../services/adminUserService";

const VERDE_INSTITUCIONAL = "#008B8B";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function CreateUserModal({ open, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullName: "",
    email: "",
    roles: [] as string[],
    enabled: true
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await createUser({
        username: formData.username.trim(),
        password: formData.password,
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        roles: formData.roles as any,
      });
      onSuccess?.();
      handleClose();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "No se pudo crear el usuario");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ username: "", password: "", fullName: "", email: "", roles: [], enabled: true });
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      TransitionComponent={Fade}
      transitionDuration={400}
      PaperProps={{ 
        sx: { 
          borderRadius: "20px", 
          padding: 1,
          boxShadow: "0px 10px 40px rgba(0,0,0,0.12)"
        } 
      }}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ 
        fontWeight: 900, 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        color: VERDE_INSTITUCIONAL // Título en Verde Institucional
      }}>
        CREAR USUARIO
        <IconButton onClick={handleClose}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}>
          <TextField
            label="Usuario"
            fullWidth
            size="small"
            value={formData.username}
            onChange={(e) => handleChange("username", e.target.value)}
            sx={{ 
              "& .MuiOutlinedInput-root": { 
                borderRadius: "12px",
                "&.Mui-focused fieldset": { borderColor: "#1976d2", borderWidth: "2px" }
              }
            }}
          />
          <TextField
            label="Contraseña"
            type="password"
            fullWidth
            size="small"
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            sx={{ 
              "& .MuiOutlinedInput-root": { 
                borderRadius: "12px",
                "&.Mui-focused fieldset": { borderColor: "#1976d2", borderWidth: "2px" }
              }
            }}
          />
          <TextField
            label="Nombre completo"
            fullWidth
            size="small"
            value={formData.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            sx={{ 
              "& .MuiOutlinedInput-root": { 
                borderRadius: "12px",
                "&.Mui-focused fieldset": { borderColor: "#1976d2", borderWidth: "2px" }
              }
            }}
          />
          <TextField
            label="Email"
            fullWidth
            size="small"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            sx={{ 
              "& .MuiOutlinedInput-root": { 
                borderRadius: "12px",
                "&.Mui-focused fieldset": { borderColor: "#1976d2", borderWidth: "2px" }
              }
            }}
          />
          
          <TextField
            select
            label="Roles"
            fullWidth
            size="small"
            SelectProps={{ 
              multiple: true,
              MenuProps: {
                PaperProps: {
                  sx: { borderRadius: "12px", mt: 1, boxShadow: "0px 4px 20px rgba(0,0,0,0.1)" }
                }
              }
            }}
            value={formData.roles}
            onChange={(e) => handleChange("roles", e.target.value)}
            sx={{ 
              "& .MuiOutlinedInput-root": { 
                borderRadius: "12px",
                "&.Mui-focused fieldset": { borderColor: "#1976d2", borderWidth: "2px" }
              },
              "& .MuiInputLabel-root": { fontWeight: 700 }
            }}
          >
            <MenuItem value="ADMIN" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>ADMIN</MenuItem>
            <MenuItem value="COORDINATOR" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>COORDINATOR</MenuItem>
            <MenuItem value="TUTOR" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>TUTOR</MenuItem>
            <MenuItem value="JURY" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>JURY</MenuItem>
          </TextField>

          <FormControlLabel
            control={
              <Switch 
                checked={formData.enabled} 
                onChange={(e) => handleChange("enabled", e.target.checked)}
                sx={{ 
                    '& .MuiSwitch-switchBase.Mui-checked': { color: VERDE_INSTITUCIONAL }, 
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: VERDE_INSTITUCIONAL } 
                }}
              />
            }
            label={<Typography sx={{ fontWeight: 800, color: VERDE_INSTITUCIONAL }}>Activo</Typography>} 
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button onClick={handleClose} sx={{ color: "grey.600", fontWeight: 700 }}>Cancelar</Button>
        <Button 
          variant="contained" 
          onClick={handleSave}
          disabled={loading}
          sx={{ 
            bgcolor: VERDE_INSTITUCIONAL, 
            borderRadius: "50px", 
            px: 4, 
            fontWeight: 800,
            transition: "all 0.2s ease-in-out",
            "&:hover": { 
              bgcolor: "#007272",
              transform: "scale(1.05)"
            },
            "&:active": {
              transform: "scale(0.95)"
            }
          }}
        >
          {loading ? "CREANDO..." : "CREAR USUARIO"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}