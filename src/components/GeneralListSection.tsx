import React from "react";
import {
  Box,
  Typography,
  Card,
  TextField,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import GroupRemoveRoundedIcon from "@mui/icons-material/GroupRemoveRounded";
import AssignmentIndRoundedIcon from "@mui/icons-material/AssignmentIndRounded";
import DeleteSweepRoundedIcon from "@mui/icons-material/DeleteSweepRounded";

import type { CareerItem } from "../../src/pages/AdminStudentsPage";
import type { AdminStudentRow } from "../services/adminStudentService";

type Props = {
  verde: string;

  careersVisible: CareerItem[];
  groupedStudents: Record<string, AdminStudentRow[]>;
  statsByCareer: Record<string, { total: number; withdrawn: number; incidents: number }>;

  searchTerm: string;
  setSearchTerm: (v: string) => void;

  normalizeCareer: (v?: string) => string;
  getStudentName: (s: any) => string;
  getSemaforo: (s: any) => { bg: string; border: string; chipBg: string; chipText: string; label: string };

  onViewProfile: (id: any) => void;
  onClearIncidents: (id: number) => void;
};

export default function GeneralListSection({
  verde,
  careersVisible,
  groupedStudents,
  statsByCareer,
  searchTerm,
  setSearchTerm,
  normalizeCareer,
  getStudentName,
  getSemaforo,
  onViewProfile,
  onClearIncidents,
}: Props) {
  return (
    <>
      {/* HEADER LISTA GENERAL + BUSCADOR (compacto) */}
      <Box sx={{ width: "100%", maxWidth: "1100px", mb: 2 }}>
        <Card
          sx={{
            px: 2,
            py: 1,
            borderRadius: "14px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            minHeight: 58,
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Typography sx={{ fontWeight: 600, color: verde, lineHeight: 1 }}>
              Lista General
            </Typography>

            {searchTerm.trim() && (
              <Typography sx={{ fontSize: "0.75rem", color: "#777", fontWeight: 500, mt: 0.4 }}>
                {careersVisible.map((c) => c.label).join(" · ")}
              </Typography>
            )}
          </Box>

          <TextField
            placeholder="Nombre, apellido o cédula"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ width: 340, maxWidth: "100%" }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: verde }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: "999px",
                bgcolor: "#fff",
                height: 34,
                fontSize: "0.85rem",
              },
            }}
          />
        </Card>
      </Box>

      {/* LISTADO GENERAL */}
      <Box sx={{ width: "100%", maxWidth: "1100px" }}>
        {careersVisible.map((career) => {
          const students = groupedStudents[career.key] || [];
          if (searchTerm.trim() && students.length === 0) return null;

          const stats = statsByCareer[career.key] || { total: 0, withdrawn: 0, incidents: 0 };
          const alertColor =
            stats.incidents >= 3 ? "#d32f2f" : stats.incidents === 2 ? "#ff8c00" : stats.incidents === 1 ? "#fbc02d" : "#2e7d32";

          return (
            <Accordion
              key={career.key}
              sx={{
                mb: 2,
                borderRadius: "15px !important",
                borderLeft: `8px solid ${career.color}`,
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "space-between", pr: 2 }}>
                  <Typography sx={{ fontWeight: 600, width: "25%", fontSize: "0.9rem" }}>{career.label}</Typography>

                  <Box sx={{ display: "flex", gap: 3, width: "40%", justifyContent: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <AssignmentIndRoundedIcon sx={{ fontSize: "1.1rem", color: "#666" }} />
                      <Typography sx={{ fontWeight: 600, fontSize: "0.8rem" }}>
                        {stats.total}{" "}
                        <Box component="span" sx={{ fontWeight: 400, color: "#888" }}>
                          Matriculados
                        </Box>
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <GroupRemoveRoundedIcon sx={{ fontSize: "1.1rem", color: "#d32f2f" }} />
                      <Typography sx={{ fontWeight: 600, fontSize: "0.8rem", color: "#d32f2f" }}>
                        {stats.withdrawn}{" "}
                        <Box component="span" sx={{ fontWeight: 400, opacity: 0.7 }}>
                          Retirados
                        </Box>
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        bgcolor: `${alertColor}15`,
                        color: alertColor,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: "20px",
                        border: `1.5px solid ${alertColor}`,
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      <ErrorOutlineRoundedIcon sx={{ fontSize: "1rem" }} />
                      <Typography sx={{ fontWeight: 700, fontSize: "0.7rem" }}>{stats.incidents} CON INCIDENCIAS</Typography>
                    </Box>

                    <Button variant="contained" size="small" sx={{ bgcolor: career.color, fontWeight: 700, textTransform: "none", borderRadius: "8px" }}>
                      Notificar
                    </Button>
                  </Box>
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ p: 0 }}>
                <List sx={{ bgcolor: "#fafafa" }}>
                  {students.length > 0 ? (
                    students.map((s: any, idx) => {
                      const sem = getSemaforo(s);

                      return (
                        <Box key={s.id || idx}>
                          <ListItem
                            sx={{
                              py: 1.5,
                              px: 4,
                              bgcolor: sem.bg,
                              borderLeft: `6px solid ${sem.border}`,
                            }}
                          >
                            <ListItemText
                              primary={
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                                  <Typography sx={{ fontWeight: 700 }}>{getStudentName(s)}</Typography>
                                  <Box
                                    sx={{
                                      bgcolor: sem.chipBg,
                                      color: sem.chipText,
                                      px: 1,
                                      borderRadius: "6px",
                                      fontSize: "0.65rem",
                                      fontWeight: 800,
                                    }}
                                  >
                                    {sem.label}
                                  </Box>
                                </Box>
                              }
                              secondary={
                                <Typography sx={{ fontSize: "0.8rem", color: "#666", fontWeight: 600 }}>
                                  DNI: {s.dni ?? s.cedula ?? "-"} · Carrera: {normalizeCareer(s.career)}
                                </Typography>
                              }
                            />

                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => onViewProfile(s.id)}
                                sx={{ borderRadius: "20px", color: career.color, borderColor: career.color, fontWeight: 700 }}
                              >
                                Ver perfil
                              </Button>

                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<DeleteSweepRoundedIcon />}
                                onClick={() => onClearIncidents(Number(s.id))}
                                sx={{
                                  borderRadius: "20px",
                                  bgcolor: "#fff",
                                  color: "#555",
                                  fontWeight: 700,
                                  border: "1px solid #ddd",
                                  boxShadow: "none",
                                  "&:hover": { bgcolor: "#f5f5f5" },
                                }}
                              >
                                Limpiar
                              </Button>
                            </Box>
                          </ListItem>

                          {idx < students.length - 1 && <Divider variant="inset" />}
                        </Box>
                      );
                    })
                  ) : (
                    <Typography sx={{ p: 3, textAlign: "center", color: "#999" }}>No hay estudiantes registrados</Typography>
                  )}
                </List>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    </>
  );
}
