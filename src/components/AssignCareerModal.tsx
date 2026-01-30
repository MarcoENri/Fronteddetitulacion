import { useState, useEffect } from "react";
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
import { listUsersByRole, listCareers } from "../services/adminLookupService";
import { assignByCareer } from "../services/adminAssignService";
import { useActivePeriod } from "../hooks/useActivePeriod";

const VERDE_INSTITUCIONAL = "#008B8B";

type CareerItem = {
  key: string;
  label: string;
  isFixed?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableCareers: CareerItem[];
};

export default function AssignCareerModal({ open, onClose, onSuccess, availableCareers }: Props) {
  const [loading, setLoading] = useState(false);
  const activePeriod = useActivePeriod();

  const [careers, setCareers] = useState<any[]>([]);
  const [coordinators, setCoordinators] = useState<any[]>([]);
  const [tutors, setTutors] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    careerId: "",
    coordinatorId: "",
    tutorId: "",
    projectName: "",
    onlyUnassigned: true
  });

  useEffect(() => {
    if (open) {
      (async () => {
        try {
          const [coords, tuts, cars] = await Promise.all([
            listUsersByRole("COORDINATOR"),
            listUsersByRole("TUTOR"),
            listCareers(),
          ]);
          setCoordinators(coords);
          setTutors(tuts);
          setCareers(cars);
        } catch (error) {
          console.error("Error cargando datos del modal", error);
        }
      })();
    }
  }, [open]);

  const handleSave = async () => {
    if (!activePeriod.periodId) return alert("No hay periodo activo");
    if (!formData.careerId || !formData.coordinatorId) return alert("Carrera y Coordinador son obligatorios");

    try {
      setLoading(true);
      await assignByCareer({
        careerId: Number(formData.careerId),
        coordinatorId: Number(formData.coordinatorId),
        tutorId: formData.tutorId ? Number(formData.tutorId) : null,
        projectName: formData.projectName.trim() || null,
        onlyUnassigned: formData.onlyUnassigned,
        academicPeriodId: activePeriod.periodId,
      });
      onSuccess();
      onClose();
      setFormData({ careerId: "", coordinatorId: "", tutorId: "", projectName: "", onlyUnassigned: true });
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Error en asignación masiva");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
      "&.Mui-focused fieldset": {
        borderColor: "#1976d2",
        borderWidth: "2px",
      },
    },
    "& .MuiInputLabel-root": {
      fontWeight: 700,
    },
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      TransitionComponent={Fade}
      transitionDuration={400}
      PaperProps={{ 
        sx: { 
          borderRadius: "20px",
          padding: 1,
          boxShadow: "0px 10px 40px rgba(0,0,0,0.15)"
        } 
      }}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 900, color: VERDE_INSTITUCIONAL, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        ASIGNACIÓN MASIVA
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ borderTop: 'none' }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}>
          <TextField
            select
            label="Carrera"
            fullWidth
            size="small"
            value={formData.careerId}
            onChange={(e) => setFormData({...formData, careerId: e.target.value})}
            sx={inputStyle}
          >
            {careers.map((c) => (
              <MenuItem key={c.id} value={c.id} sx={{ fontWeight: 700 }}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Coordinador"
            fullWidth
            size="small"
            value={formData.coordinatorId}
            onChange={(e) => setFormData({...formData, coordinatorId: e.target.value})}
            sx={inputStyle}
          >
            {coordinators.map((u) => (
              <MenuItem key={u.id} value={u.id} sx={{ fontWeight: 700 }}>
                {u.fullName} (@{u.username})
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Tutor (opcional)"
            fullWidth
            size="small"
            value={formData.tutorId}
            onChange={(e) => setFormData({...formData, tutorId: e.target.value})}
            sx={inputStyle}
          >
            <MenuItem value="" sx={{ fontWeight: 700 }}><em>Ninguno</em></MenuItem>
            {tutors.map((u) => (
              <MenuItem key={u.id} value={u.id} sx={{ fontWeight: 700 }}>
                {u.fullName} (@{u.username})
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Nombre del Proyecto (opcional)"
            fullWidth
            size="small"
            value={formData.projectName}
            onChange={(e) => setFormData({...formData, projectName: e.target.value})}
            sx={inputStyle}
          />

          <FormControlLabel
            control={
              <Switch 
                checked={formData.onlyUnassigned} 
                onChange={(e) => setFormData({...formData, onlyUnassigned: e.target.checked})} 
                sx={{ 
                  '& .MuiSwitch-switchBase.Mui-checked': { color: VERDE_INSTITUCIONAL }, 
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: VERDE_INSTITUCIONAL } 
                }}
              />
            }
            label={<Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>Solo estudiantes no asignados</Typography>}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, flexDirection: 'column', gap: 1 }}>
        <Button 
          variant="contained" 
          fullWidth
          onClick={handleSave}
          disabled={loading}
          sx={{ 
            bgcolor: VERDE_INSTITUCIONAL, 
            borderRadius: "50px", 
            py: 1.2,
            fontWeight: 800,
            fontSize: '1rem',
            transition: "all 0.2s ease-in-out",
            "&:hover": { 
              bgcolor: "#007272",
              transform: "scale(1.05)" // EFECTO ZOOM
            },
            "&:active": {
              transform: "scale(0.98)"
            }
          }}
        >
          {loading ? "APLICANDO..." : "APLICAR ASIGNACIÓN"}
        </Button>
        <Button 
          onClick={onClose} 
          fullWidth
          sx={{ color: "grey.500", fontWeight: 700, textTransform: 'none' }}
        >
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
}