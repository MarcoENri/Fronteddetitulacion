import React from "react";
import { Box, Typography, Avatar, IconButton } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";

import type { CareerItem } from "../../src/pages/AdminStudentsPage";
import type { AdminStudentRow } from "../../src/services/adminStudentService";

// ✅ URL del backend para cargar las fotos de la galería
const API_URL = "http://localhost:3000";

type Props = {
  verde: string;
  careers: CareerItem[];
  rows: AdminStudentRow[];
  normalizeCareer: (v?: string) => string;

  onCareerClick: (careerKey: string) => void;
  onOpenAddCareer: () => void;
  onDeleteCareer: (careerKey: string) => void;
};

export default function CareersSection({
  verde,
  careers,
  rows,
  normalizeCareer,
  onCareerClick,
  onOpenAddCareer,
  onDeleteCareer,
}: Props) {
  return (
    <>
      {/* TITULOS */}
      <Box sx={{ width: "100%", maxWidth: "1100px", mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: verde }}>
          Listado de Estudiantes por Carrera
        </Typography>
        <Typography sx={{ color: "#888", fontSize: "0.9rem", fontWeight: 500, textTransform: "uppercase" }}>
          Estudiantes - Carrera Periodo Titulación 2025 - Septiembre Febrero 2026
        </Typography>
      </Box>

      {/* TARJETAS */}
      <Box
        sx={{
          width: "100%",
          maxWidth: "1100px",
          p: 4,
          borderRadius: "25px",
          bgcolor: "#fff",
          boxShadow: "0 10px 30px rgba(0,0,0,0.03)",
          mb: 5,
        }}
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center" }}>
          {careers.map((c) => {
            const canDelete = !c.isFixed;

            // ✅ Lógica para seleccionar la imagen:
            // Si la carrera tiene 'imageUrl' (subida por galería), usamos la del servidor.
            // Si no, usamos el 'cover' (la foto fija que ya tenías).
            const backgroundImageUrl = c.imageUrl 
              ? `${API_URL}/uploads/${c.imageUrl}` 
              : c.cover;

            return (
              <Box
                key={c.key}
                onClick={() => onCareerClick(c.key)}
                sx={{
                  width: "168px",
                  height: "250px",
                  borderRadius: "22px",
                  position: "relative",
                  overflow: "hidden",
                  cursor: "pointer",
                  bgcolor: c.color,
                  boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                  transition: "transform 0.2s ease",
                  border: "3px solid #fff",
                  "&:hover": { transform: "translateY(-5px)" },
                  "&:hover .deleteCareer": { opacity: 1, transform: "translateY(0)" },
                }}
              >
                {/* ✅ botón eliminar (solo personalizadas) */}
                {canDelete && (
                  <IconButton
                    className="deleteCareer"
                    onClick={(e) => {
                      e.stopPropagation(); // ✅ evita que navegue al hacer click
                      onDeleteCareer(c.key);
                    }}
                    sx={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      zIndex: 5,
                      bgcolor: "rgba(255,255,255,0.92)",
                      color: "#d32f2f",
                      width: 32,
                      height: 32,
                      opacity: 0,
                      transform: "translateY(-6px)",
                      transition: "all .15s ease",
                      "&:hover": { bgcolor: "#fff" },
                    }}
                    title="Eliminar carrera"
                  >
                    <DeleteForeverRoundedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                )}

                {/* ✅ Capa de Imagen de Fondo */}
                {backgroundImageUrl && (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage: `url(${backgroundImageUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: c.imgPos || "center 45%",
                      opacity: 0.85,
                    }}
                  />
                )}

                {/* Filtro de color dinámico para que el texto resalte */}
                <Box sx={{ 
                  position: "absolute", 
                  inset: 0, 
                  backgroundColor: c.color, 
                  mixBlendMode: "multiply", 
                  opacity: 0.75 
                }} />

                {/* Contador de estudiantes */}
                <Box sx={{ position: "absolute", top: 10, right: 10 }}>
                  <Avatar sx={{ bgcolor: "#fff", color: c.color, width: 26, height: 26, fontSize: "0.75rem", fontWeight: 700 }}>
                    {rows.filter((r: any) => normalizeCareer(r.career) === c.key).length}
                  </Avatar>
                </Box>

                {/* Nombre de la carrera */}
                <Typography
                  sx={{
                    position: "absolute",
                    bottom: 15,
                    width: "100%",
                    textAlign: "center",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "0.65rem",
                    px: 1,
                    textTransform: "uppercase",
                  }}
                >
                  {c.label}
                </Typography>
              </Box>
            );
          })}

          {/* Botón de añadir carrera */}
          <Box
            onClick={onOpenAddCareer}
            sx={{
              width: "168px",
              height: "250px",
              borderRadius: "22px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              border: "3px dashed #ccc",
              bgcolor: "#fafafa",
              transition: "all 0.2s ease",
              "&:hover": { bgcolor: "#f0f0f0", borderColor: verde }
            }}
          >
            <Avatar sx={{ bgcolor: verde, mb: 1.5 }}>
              <AddRoundedIcon />
            </Avatar>
            <Typography sx={{ color: verde, fontWeight: 600, fontSize: "0.7rem" }}>AÑADIR</Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
}