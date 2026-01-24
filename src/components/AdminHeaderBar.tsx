import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Divider as MuiDivider,
  FormControl,
  Select,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from "@mui/material";

import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import ExitToAppRoundedIcon from "@mui/icons-material/ExitToAppRounded";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";

export interface CareerStatDto {
  key: string;
  label: string;
  total: number;
  reprobados: number;
  color: string;
}

export interface PeriodHeaderDto {
  id: number;
  name: string;
  isActive?: boolean;
}

export interface ActivePeriodState {
  loading: boolean;
  periodName?: string | null;
}

type Props = {
  verde: string;
  importing: boolean;

  onOpenAssignCareer: () => void;
  onOpenCreateUser: () => void;
  onRefresh: () => void;
  onLogout: () => void;

  userMenuAnchor: HTMLElement | null;
  openUserMenu: boolean;
  onOpenMenu: (e: React.MouseEvent<HTMLElement>) => void;
  onCloseMenu: () => void;

  onOpenProfile: () => void;
  onUploadFile: (file: File) => void;
  onOpenPeriodModal: () => void;

  periods: PeriodHeaderDto[];
  selectedPeriodId: number | "ALL";
  activePeriod: ActivePeriodState;
  onChangePeriod: (val: number | "ALL") => void;
  onReloadPeriods: () => void;

  careerStats: CareerStatDto[];
};

export default function AdminHeaderBar({
  verde,
  importing,
  onOpenAssignCareer,
  onOpenCreateUser,
  onRefresh,
  onLogout,
  userMenuAnchor,
  openUserMenu,
  onOpenMenu,
  onCloseMenu,
  onOpenProfile,
  onUploadFile,
  onOpenPeriodModal,
  periods,
  selectedPeriodId,
  activePeriod,
  onChangePeriod,
  onReloadPeriods,
  careerStats,
}: Props) {
  const [openStatsModal, setOpenStatsModal] = useState(false);

  const { totalGlobal, totalReprobadosGlobal } = useMemo(() => {
    const total = careerStats.reduce((acc, curr) => acc + (curr.total ?? 0), 0);
    const repro = careerStats.reduce((acc, curr) => acc + (curr.reprobados ?? 0), 0);
    return { totalGlobal: total, totalReprobadosGlobal: repro };
  }, [careerStats]);

  const whiteBtn = {
    borderRadius: "999px",
    px: 1.6,
    py: 0.7,
    fontWeight: 600,
    textTransform: "none",
    minHeight: 34,
    bgcolor: "#fff",
    color: verde,
    "&:hover": { bgcolor: "#f4f4f4" },
  } as const;

  const whiteSelectStyles = {
    color: "#fff",
    ".MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.6)" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#fff" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#fff" },
    ".MuiSvgIcon-root": { color: "#fff" },
  };

  return (
    <>
      <Box
        sx={{
          backgroundColor: verde,
          p: "8px 26px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 100,
          borderBottom: "4px solid #fff",
          gap: 2,
        }}
      >
        <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "1.05rem", whiteSpace: "nowrap" }}>
          ADMINISTRACIÓN{" "}
          <Box component="span" sx={{ fontWeight: 400, opacity: 0.85 }}>
            - SEGUIMIENTO
          </Box>
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1, justifyContent: "center" }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)", lineHeight: 1 }}>
              Periodo Actual:
            </Typography>
            <Typography variant="body2" sx={{ color: "#fff", fontWeight: 700 }}>
              {activePeriod.loading ? "..." : activePeriod.periodName ?? "NO ACTIVO"}
            </Typography>
          </Box>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="period-select-label" sx={{ color: "rgba(255,255,255,0.7)", "&.Mui-focused": { color: "#fff" } }}>
              Ver período
            </InputLabel>

            <Select
              labelId="period-select-label"
              value={selectedPeriodId}
              label="Ver período"
              onChange={(e) => onChangePeriod(e.target.value as any)}
              sx={whiteSelectStyles}
            >
              <MenuItem value="ALL">Todos (Histórico)</MenuItem>
              {periods.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name} {p.isActive ? "✅" : ""}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <IconButton
            onClick={onReloadPeriods}
            size="small"
            sx={{ color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.3)" }}
            title="Recargar lista de periodos"
          >
            <RefreshRoundedIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Button onClick={onOpenAssignCareer} startIcon={<GroupRoundedIcon />} variant="contained" sx={whiteBtn}>
            Asignación
          </Button>

          <Button onClick={onOpenCreateUser} startIcon={<PersonAddAlt1RoundedIcon />} variant="contained" sx={whiteBtn}>
            Crear usuario
          </Button>

          <IconButton onClick={onRefresh} sx={{ color: "#fff" }} title="Recargar página">
            <RefreshRoundedIcon />
          </IconButton>

          <IconButton onClick={onOpenMenu} sx={{ color: "#fff" }} title="Usuario">
            <AccountCircleRoundedIcon />
          </IconButton>

          <Menu
            anchorEl={userMenuAnchor}
            open={openUserMenu}
            onClose={onCloseMenu}
            PaperProps={{
              sx: {
                mt: 1,
                borderRadius: "14px",
                minWidth: 270,
                boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
                overflow: "hidden",
              },
            }}
          >
            <MenuItem onClick={() => { onCloseMenu(); onOpenProfile(); }}>
              <ListItemIcon><AccountCircleRoundedIcon fontSize="small" /></ListItemIcon>
              Perfil
            </MenuItem>

            <MenuItem onClick={() => { onCloseMenu(); onOpenPeriodModal(); }}>
              <ListItemIcon><EventAvailableRoundedIcon fontSize="small" /></ListItemIcon>
              Periodo académico (Gestión)
            </MenuItem>

            <MenuItem component="label">
              <ListItemIcon><UploadFileRoundedIcon fontSize="small" /></ListItemIcon>
              {importing ? "Cargando..." : "Lista de titulados"}
              <input
                type="file"
                hidden
                accept=".xlsx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUploadFile(file);
                }}
              />
            </MenuItem>

            <MuiDivider />

            <MenuItem onClick={() => { onCloseMenu(); setOpenStatsModal(true); }}>
              <ListItemIcon>
                <AssessmentRoundedIcon fontSize="small" sx={{ color: verde }} />
              </ListItemIcon>
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Typography variant="body2" fontWeight={600}>Estadísticas Detalladas</Typography>
                <Typography variant="caption" color="text.secondary">Ver totales por carrera</Typography>
              </Box>
            </MenuItem>

            <MuiDivider />

            <MenuItem onClick={() => { onCloseMenu(); onLogout(); }} sx={{ color: "#d32f2f" }}>
              <ListItemIcon sx={{ color: "#d32f2f" }}><ExitToAppRoundedIcon fontSize="small" /></ListItemIcon>
              Cerrar sesión
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      <Dialog open={openStatsModal} onClose={() => setOpenStatsModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: verde, color: "#fff", fontWeight: 700 }}>
          Resumen General de Estudiantes
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ display: "flex", gap: 4, mb: 3, p: 2, bgcolor: "#f5f5f5", borderRadius: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">TOTAL MATRICULADOS</Typography>
              <Typography variant="h4" fontWeight={800} color={verde}>{totalGlobal}</Typography>
            </Box>

            <Divider orientation="vertical" flexItem />

            <Box>
              <Typography variant="caption" color="text.secondary">TOTAL REPROBADOS</Typography>
              <Typography variant="h4" fontWeight={800} color="error">{totalReprobadosGlobal}</Typography>
            </Box>
          </Box>

          <TableContainer component={Paper} elevation={0} variant="outlined">
            <Table size="small">
              <TableHead sx={{ bgcolor: "#fafafa" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Carrera</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Matriculados</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Reprobados</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {careerStats.map((stat) => (
                  <TableRow key={stat.key} hover>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: stat.color }} />
                        <Typography variant="body2" fontWeight={600}>{stat.label}</Typography>
                      </Box>
                    </TableCell>

                    <TableCell align="center">
                      <Chip label={stat.total} size="small" sx={{ fontWeight: 800, bgcolor: "#e0f2f1", color: "#00695c" }} />
                    </TableCell>

                    <TableCell align="center">
                      <Chip label={stat.reprobados} size="small" sx={{ fontWeight: 800, bgcolor: "#ffebee", color: "#c62828" }} />
                    </TableCell>
                  </TableRow>
                ))}

                {careerStats.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 3, color: "text.secondary" }}>
                      No hay datos disponibles.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenStatsModal(false)} sx={{ fontWeight: 700 }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
