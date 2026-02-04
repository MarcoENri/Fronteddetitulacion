import React, { useState } from "react";
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
  getSemaforo: (s: any) => {
    bg: string;
    border: string;
    chipBg: string;
    chipText: string;
    label: string;
  };
  onViewProfile: (id: any) => void;
  onClearIncidents: (id: number) => void;

  // 👉 backend luego implementa esto
  onMarkIncidentsSeen?: (id: number) => void;
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
  onMarkIncidentsSeen,
}: Props) {
  const [seenCareers, setSeenCareers] = useState<number[]>([]);

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
          <Typography sx={{ fontWeight: 600, color: verde }}>
            Lista General
          </Typography>

          <TextField
            placeholder="Nombre, apellido o cédula"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ width: 340 }}
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

      <Box sx={{ width: "100%", maxWidth: "1100px" }}>
        {careerCards.map((career) => {
          const students = groupedStudents[career.id] || [];

          if (searchTerm.trim() && students.length === 0) return null;

          // 👉 SOLO incidencias NO LEÍDAS generan pastel
          const careerAlerts = students.filter(
            (s: any) => s.hasUnreadIncidents
          ).length;

          return (
            <Accordion
              key={career.id}
              sx={{
                mb: 2,
                borderRadius: "15px !important",
                borderLeft: `8px solid ${career.color ?? "#90a4ae"}`,
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                bgcolor: careerAlerts > 0 ? `${career.color}22` : "#fff",
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    justifyContent: "space-between",
                    pr: 2,
                  }}
                >
                  <Typography sx={{ fontWeight: 700 }}>
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
                  {students.map((s: any, idx) => {
                    const sem = getSemaforo(s);
                    const dni = s.dni ?? s.cedula ?? "-";

                    const incidents = s.incidentCount ?? 0;
                    const observations = s.observationCount ?? 0;

                    let nameColor = "inherit";
                    if (incidents === 1) nameColor = "#fbc02d";
                    if (incidents === 2) nameColor = "#f57c00";
                    if (incidents >= 3) nameColor = "#d32f2f";

                    const isFailed = incidents >= 3;

                    return (
                      <Box key={s.id || idx}>
                        <ListItem
                          onClick={() => {
                            onViewProfile(s.id);

                            // 👉 marca leído en backend
                            onMarkIncidentsSeen?.(Number(s.id));
                          }}
                          sx={{
                            cursor: "pointer",
                            "&:hover": { bgcolor: "#eee" },
                            py: 1.5,
                            px: 4,
                            bgcolor: sem.bg,
                            borderLeft: `6px solid ${sem.border}`,
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                                  <Typography sx={{ fontWeight: 700, color: nameColor }}>
                                    {getStudentName(s)}
                                  </Typography>

                                  {incidents === 0 && observations === 0 && (
                                    <Box sx={{ bgcolor: sem.chipBg, color: sem.chipText, px: 1.2, borderRadius: "999px", fontSize: 11 }}>
                                      SIN NOVEDAD
                                    </Box>
                                  )}

                                  {incidents > 0 && (
                                    <Box sx={{ bgcolor: career.color, color: "#fff", px: 1.2, borderRadius: "999px", fontSize: 11 }}>
                                      INCIDENCIAS: {incidents}
                                    </Box>
                                  )}

                                  {observations > 0 && (
                                    <Box sx={{ bgcolor: "#1976d2", color: "#fff", px: 1.2, borderRadius: "999px", fontSize: 11 }}>
                                      OBSERVACIONES: {observations}
                                    </Box>
                                  )}

                                  {isFailed && (
                                    <Box sx={{ bgcolor: "#d32f2f", color: "#fff", px: 1.2, borderRadius: "999px", fontSize: 11 }}>
                                      REPROBADO
                                    </Box>
                                  )}
                                </Box>
                              </Box>
                            }
                            secondary={`DNI: ${dni}`}
                          />

                          <Button
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onClearIncidents(Number(s.id));
                            }}
                            startIcon={<DeleteSweepRoundedIcon />}
                          >
                            Limpiar
                          </Button>
                        </ListItem>

                        {idx < students.length - 1 && <Divider />}
                      </Box>
                    );
                  })}
                </List>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    </>
  );
}
