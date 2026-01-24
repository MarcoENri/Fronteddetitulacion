import { Box, Typography, Grid, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import type { CareerCardDto } from "../services/adminCareerCardsService";
import { api } from "../api/api";
import { useMemo, useState } from "react";
import { uploadCareerCover } from "../services/adminCareerCardsService";

type Props = {
  verde: string;
  cards: CareerCardDto[];
  onCareerClick: (careerId: number) => void;
  onOpenAddCareer: () => void;

  onGoPredefense: () => void;
  onGoFinalDefense: () => void;

  // ✅ NUEVO: para recargar tarjetas luego de subir portada
  onReloadCards: () => void;
};

export default function CareersSection({
  verde,
  cards,
  onCareerClick,
  onOpenAddCareer,
  onGoPredefense,
  onGoFinalDefense,
  onReloadCards,
}: Props) {
  const base = api.defaults.baseURL ?? "";

  const coverUrl = (filename?: string | null) => {
    if (!filename) return null;
    return `${base}/admin/careers/cover/${filename}`;
  };

  // ✅ modal editar portada
  const [openCover, setOpenCover] = useState(false);
  const [selectedCareer, setSelectedCareer] = useState<CareerCardDto | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [color, setColor] = useState<string>("#546e7a");
  const [saving, setSaving] = useState(false);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  const openEdit = (c: CareerCardDto) => {
    setSelectedCareer(c);
    setFile(null);
    setColor(c.color ?? "#546e7a");
    setOpenCover(true);
  };

  const closeEdit = () => {
    setOpenCover(false);
    setSelectedCareer(null);
    setFile(null);
  };

  const handleSave = async () => {
    if (!selectedCareer?.id || !file) return;
    setSaving(true);
    try {
      await uploadCareerCover(selectedCareer.id, file, color);
      closeEdit();
      onReloadCards(); // ✅ recarga las cards para que se vea la portada
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ width: "100%", maxWidth: "1100px", mb: 4 }}>
      <Box
        sx={{
          width: "100%",
          maxWidth: "1100px",
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: verde }}>
            Listado de Estudiantes por Carrera
          </Typography>
          <Typography sx={{ color: "#888", fontSize: "0.9rem", fontWeight: 600, textTransform: "uppercase" }}>
            Selecciona una carrera para ver sus estudiantes
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 0.5 }}>
          <Button
            variant="contained"
            onClick={onGoPredefense}
            sx={{
              bgcolor: verde,
              fontWeight: 900,
              borderRadius: 999,
              px: 3,
              "&:hover": { bgcolor: verde, filter: "brightness(0.9)" },
            }}
          >
            Predefensa
          </Button>

          <Button
            variant="outlined"
            onClick={onGoFinalDefense}
            sx={{
              borderColor: verde,
              color: verde,
              fontWeight: 900,
              borderRadius: 999,
              px: 3,
              "&:hover": { borderColor: verde, bgcolor: "rgba(0,0,0,0.04)" },
            }}
          >
            Defensa Final
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {cards.map((c) => {
          const cover = coverUrl(c.coverImage);
          const bg = c.color ?? "#546e7a";

          return (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={c.id}>
              <Paper
                elevation={2}
                onClick={() => onCareerClick(c.id)}
                sx={{
                  position: "relative",
                  height: 140,
                  borderRadius: 3,
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
                }}
              >
                {/* ✅ Botón editar portada */}
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(c);
                  }}
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    zIndex: 5,
                    color: "white",
                    bgcolor: "rgba(0,0,0,0.35)",
                    "&:hover": { bgcolor: "rgba(0,0,0,0.55)" },
                  }}
                >
                  <EditRoundedIcon fontSize="small" />
                </IconButton>

                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: cover ? `url(${cover})` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    bgcolor: bg,
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.25) 60%, transparent 100%)",
                  }}
                />

                <Box sx={{ position: "absolute", bottom: 0, left: 0, width: "100%", p: 2, color: "white" }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 900,
                      fontSize: "0.85rem",
                      lineHeight: 1.2,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {c.name}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.92, fontSize: "0.75rem" }}>
                    {c.studentsCount} Estudiantes
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          );
        })}

        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Paper
            elevation={0}
            onClick={onOpenAddCareer}
            sx={{
              height: 140,
              borderRadius: 3,
              border: "2px dashed #ccc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              bgcolor: "transparent",
              color: "#777",
              "&:hover": { borderColor: verde, color: verde, bgcolor: "rgba(0,0,0,0.02)" },
            }}
          >
            <Typography fontWeight={700}>+ Añadir Carrera</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* ✅ MODAL EDITAR PORTADA */}
      <Dialog open={openCover} onClose={closeEdit} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>
          Portada: {selectedCareer?.name ?? "Carrera"}
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Button variant="outlined" component="label" fullWidth>
              {file ? file.name : "Seleccionar imagen"}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </Button>

            <Box>
              <Typography variant="caption" sx={{ display: "block", mb: 0.5 }}>
                Color de fondo (si no hay portada)
              </Typography>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ width: "100%", height: 40 }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ display: "block", mb: 0.5, color: "#666" }}>
                Vista previa
              </Typography>
              <Box
                sx={{
                  height: 140,
                  borderRadius: 2,
                  overflow: "hidden",
                  border: "1px solid #eee",
                  backgroundColor: color,
                  backgroundImage: previewUrl ? `url(${previewUrl})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeEdit}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!file || saving}
            onClick={handleSave}
            sx={{ bgcolor: verde, fontWeight: 900 }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
