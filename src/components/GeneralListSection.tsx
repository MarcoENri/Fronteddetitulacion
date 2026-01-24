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
import DeleteSweepRoundedIcon from "@mui/icons-material/DeleteSweepRounded";

import type { CareerCardDto } from "../services/adminCareerCardsService";
import type { AdminStudentRow } from "../services/adminStudentService";

type Props = {
  verde: string;

  careerCards: CareerCardDto[];
  groupedStudents: Record<number, AdminStudentRow[]>;

  searchTerm: string;
  setSearchTerm: (v: string) => void;

  getStudentName: (s: any) => string;
  getSemaforo: (s: any) => { bg: string; border: string; chipBg: string; chipText: string; label: string };

  onViewProfile: (id: any) => void;
  onClearIncidents: (id: number) => void;
};

export default function GeneralListSection({
  verde,
  careerCards,
  groupedStudents,
  searchTerm,
  setSearchTerm,
  getStudentName,
  getSemaforo,
  onViewProfile,
  onClearIncidents,
}: Props) {
  return (
    <>
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
                Resultados filtrados por búsqueda
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
              sx: { borderRadius: "999px", bgcolor: "#fff", height: 34, fontSize: "0.85rem" },
            }}
          />
        </Card>
      </Box>

      <Box sx={{ width: "100%", maxWidth: "1100px" }}>
        {careerCards.map((career) => {
          const students = groupedStudents[career.id] || [];
          if (searchTerm.trim() && students.length === 0) return null;

          return (
            <Accordion
              key={career.id}
              sx={{
                mb: 2,
                borderRadius: "15px !important",
                borderLeft: `8px solid ${career.color ?? "#90a4ae"}`,
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "space-between", pr: 2 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>
                    {career.name}
                  </Typography>

                  <Typography sx={{ fontWeight: 700, color: career.color ?? verde }}>
                    {students.length}{" "}
                    <Box component="span" sx={{ fontWeight: 500, color: "#777" }}>
                      estudiantes
                    </Box>
                  </Typography>
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ p: 0 }}>
                <List sx={{ bgcolor: "#fafafa" }}>
                  {students.length > 0 ? (
                    students.map((s: any, idx) => {
                      const sem = getSemaforo(s);
                      const dni = s.dni ?? s.cedula ?? "-";

                      return (
                        <Box key={s.id || idx}>
                          <ListItem sx={{ py: 1.5, px: 4, bgcolor: sem.bg, borderLeft: `6px solid ${sem.border}` }}>
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
                                  DNI: {dni}
                                </Typography>
                              }
                            />

                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => onViewProfile(s.id)}
                                sx={{
                                  borderRadius: "20px",
                                  color: career.color ?? verde,
                                  borderColor: career.color ?? verde,
                                  fontWeight: 700,
                                }}
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

                          {idx < students.length - 1 && <Divider />}
                        </Box>
                      );
                    })
                  ) : (
                    <Typography sx={{ p: 3, textAlign: "center", color: "#999" }}>
                      No hay estudiantes registrados
                    </Typography>
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
