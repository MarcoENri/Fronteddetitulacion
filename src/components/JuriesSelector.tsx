// src/components/JuriesSelector.tsx (VERSIÓN FINAL)
import { useState, useMemo } from "react";
import { 
  Box, 
  Typography, 
  FormControl, 
  Select, 
  MenuItem, 
  TextField,
  InputAdornment,
  Chip
} from "@mui/material";
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';

const VERDE_INSTITUCIONAL = "#008B8B";

interface JuryUserDto {
  id: number;
  fullName: string;
  email: string;
  roles?: string[];
  careerId?: number;      // ⚠️ Necesitas agregarlo en el backend
  careerName?: string;    // ⚠️ Necesitas agregarlo en el backend
}

interface Career {
  id: number;
  name: string;
}

interface Props {
  juries: JuryUserDto[];
  careers: Career[];      // ⚠️ Necesitas pasarlo desde el padre
  selectedJuryIds: number[];
  toggleJury: (id: number) => void;
}

const ovalSelectStyle = {
  "&.MuiOutlinedInput-root": {
    borderRadius: "50px",
    backgroundColor: "#fff",
    "& .MuiSelect-select": { fontWeight: 900, px: 3, py: 1 },
    "& fieldset": { borderColor: "#dcdde1", borderWidth: "1.5px" },
    "&.Mui-focused": { "& fieldset": { borderColor: VERDE_INSTITUCIONAL, borderWidth: "2px" } },
  }
};

export default function JuriesSelector({
  juries,
  careers,
  selectedJuryIds,
  toggleJury,
}: Props) {

  const [selectedCareerId, setSelectedCareerId] = useState<number | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ ROLES REALES SEGÚN TU BASE (ROLE_DOCENTE = Coordinador)
  const allowedRoles = [
    "ROLE_TUTOR",
    "ROLE_DOCENTE", // Este es tu coordinador
  ];

  // ✅ FILTRADO COMPLETO: roles + carrera + búsqueda
  const filteredJuries = useMemo(() => {
    // 🔍 DEBUG: Ver qué recibimos
    console.log("🔍 Total de jurados recibidos:", juries.length);
    console.log("🔍 Jurados completos:", juries);
    
    // 1. Filtrar por roles permitidos
    let filtered = juries.filter(j => {
      const hasRoles = Array.isArray(j.roles) && j.roles.some(role => allowedRoles.includes(role));
      if (!hasRoles) {
        console.log("❌ Jurado sin roles válidos:", j.fullName, j.roles);
      }
      return hasRoles;
    });

    console.log("✅ Jurados con roles válidos:", filtered.length);

    // 2. Filtrar por carrera si no es "ALL"
    if (selectedCareerId !== "ALL") {
      const beforeCareerFilter = filtered.length;
      filtered = filtered.filter(j => j.careerId === selectedCareerId);
      console.log(`🏫 Filtrado por carrera: ${beforeCareerFilter} → ${filtered.length}`);
    }

    // 3. Filtrar por búsqueda (nombre o email)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(j => 
        j.fullName.toLowerCase().includes(term) ||
        j.email.toLowerCase().includes(term)
      );
      console.log("🔎 Después de búsqueda:", filtered.length);
    }

    return filtered;
  }, [juries, selectedCareerId, searchTerm]);

  // Contar jurados por carrera (solo los que tienen roles permitidos)
  const juryCountByCareer = useMemo(() => {
    const counts: Record<number, number> = {};
    juries
      .filter(j => Array.isArray(j.roles) && j.roles.some(role => allowedRoles.includes(role)))
      .forEach(j => {
        if (j.careerId) {
          counts[j.careerId] = (counts[j.careerId] || 0) + 1;
        }
      });
    return counts;
  }, [juries]);

  const totalJuriesWithRoles = juries.filter(j => 
    Array.isArray(j.roles) && j.roles.some(role => allowedRoles.includes(role))
  ).length;

  return (
    <>
      <Typography sx={{ fontWeight: 800, mt: 3, mb: 1, fontSize: "0.9rem" }}>
        👨‍⚖️ Jurados (exactamente 5)
      </Typography>

      {/* FILTROS */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        {/* Selector de Carrera */}
        <FormControl sx={{ minWidth: 250, maxWidth: 350 }}>
          <Select
            size="small"
            displayEmpty
            value={selectedCareerId}
            onChange={(e) => {
              setSelectedCareerId(e.target.value as number | "ALL");
              setSearchTerm("");
            }}
            sx={ovalSelectStyle}
            renderValue={(selected: any) => {
              if (selected === "ALL") {
                return `TODAS LAS CARRERAS (${totalJuriesWithRoles})`;
              }
              const career = careers.find(c => c.id === selected);
              const count = juryCountByCareer[selected] || 0;
              return career ? `${career.name.toUpperCase()} (${count})` : "CARRERA";
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  borderRadius: "16px",
                  mt: 1,
                  maxHeight: 400, // Altura máxima con scroll
                  boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                  "&::-webkit-scrollbar": {
                    width: "8px"
                  },
                  "&::-webkit-scrollbar-track": {
                    background: "#f1f1f1",
                    borderRadius: "10px"
                  },
                  "&::-webkit-scrollbar-thumb": {
                    background: VERDE_INSTITUCIONAL,
                    borderRadius: "10px",
                    "&:hover": {
                      background: "#006666"
                    }
                  }
                }
              }
            }}
          >
            {/* Opción TODAS LAS CARRERAS */}
            <MenuItem 
              value="ALL"
              sx={{
                mb: 1,
                mx: 1,
                borderRadius: "12px",
                border: `2px solid ${selectedCareerId === "ALL" ? VERDE_INSTITUCIONAL : "transparent"}`,
                bgcolor: selectedCareerId === "ALL" ? `${VERDE_INSTITUCIONAL}08` : "transparent",
                transition: "all 0.2s",
                "&:hover": {
                  bgcolor: `${VERDE_INSTITUCIONAL}15`,
                  transform: "scale(1.02)",
                  boxShadow: "0 4px 12px rgba(0,139,139,0.2)"
                }
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                width: '100%',
                py: 0.5
              }}>
                <Typography sx={{ 
                  fontWeight: 900, 
                  fontSize: "0.85rem",
                  color: selectedCareerId === "ALL" ? VERDE_INSTITUCIONAL : "#333"
                }}>
                  TODAS LAS CARRERAS
                </Typography>
                <Chip
                  label={totalJuriesWithRoles}
                  size="small"
                  sx={{
                    bgcolor: selectedCareerId === "ALL" ? VERDE_INSTITUCIONAL : "#f5f5f5",
                    color: selectedCareerId === "ALL" ? "#fff" : "#666",
                    fontWeight: 900,
                    fontSize: "0.75rem",
                    height: 24,
                    minWidth: 35
                  }}
                />
              </Box>
            </MenuItem>

            {/* Lista de carreras */}
            {careers.map((c) => {
              const count = juryCountByCareer[c.id] || 0;
              const isSelected = selectedCareerId === c.id;
              
              return (
                <MenuItem 
                  key={c.id} 
                  value={c.id}
                  sx={{
                    mb: 1,
                    mx: 1,
                    borderRadius: "12px",
                    border: `2px solid ${isSelected ? VERDE_INSTITUCIONAL : "transparent"}`,
                    bgcolor: isSelected ? `${VERDE_INSTITUCIONAL}08` : "transparent",
                    transition: "all 0.2s",
                    "&:hover": {
                      bgcolor: `${VERDE_INSTITUCIONAL}15`,
                      transform: "scale(1.02)",
                      boxShadow: "0 4px 12px rgba(0,139,139,0.2)"
                    }
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    width: '100%',
                    py: 0.5
                  }}>
                    <Typography sx={{ 
                      fontWeight: 900, 
                      fontSize: "0.8rem",
                      textTransform: "uppercase",
                      color: isSelected ? VERDE_INSTITUCIONAL : "#333",
                      flex: 1,
                      pr: 2
                    }}>
                      {c.name}
                    </Typography>
                    <Chip
                      label={count}
                      size="small"
                      sx={{
                        bgcolor: count > 0 
                          ? (isSelected ? VERDE_INSTITUCIONAL : "#e8f5e9")
                          : "#f5f5f5",
                        color: count > 0
                          ? (isSelected ? "#fff" : "#2e7d32")
                          : "#999",
                        fontWeight: 900,
                        fontSize: "0.75rem",
                        height: 24,
                        minWidth: 35
                      }}
                    />
                  </Box>
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        {/* Buscador */}
        <TextField
          size="small"
          placeholder="Buscar por nombre o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ color: "#999", fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            flex: 1,
            minWidth: 200,
            maxWidth: 350,
            "& .MuiOutlinedInput-root": {
              borderRadius: "50px",
              "& fieldset": { borderColor: "#dcdde1" },
              "&:hover fieldset": { borderColor: "#000" },
              "&.Mui-focused fieldset": { borderColor: VERDE_INSTITUCIONAL },
            }
          }}
        />
      </Box>

      {/* Chip de filtro activo */}
      {selectedCareerId !== "ALL" && (
        <Box sx={{ mb: 2 }}>
          <Chip
            icon={<SchoolRoundedIcon sx={{ fontSize: 14 }} />}
            label={`Filtrando: ${careers.find(c => c.id === selectedCareerId)?.name}`}
            onDelete={() => setSelectedCareerId("ALL")}
            sx={{ 
              bgcolor: `${VERDE_INSTITUCIONAL}15`, 
              color: VERDE_INSTITUCIONAL,
              fontWeight: 900,
              fontSize: "0.75rem"
            }}
          />
        </Box>
      )}

      {/* LISTA DE JURADOS */}
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          maxHeight: 350,
          overflowY: "auto",
          pr: 1,
        }}
      >
        {filteredJuries.map((j) => {
          const checked = selectedJuryIds.includes(j.id);

          return (
            <Box
              key={j.id}
              onClick={() => toggleJury(j.id)}
              sx={{
                p: 2,
                borderRadius: "16px",
                border: `2px solid ${checked ? VERDE_INSTITUCIONAL : "#eee"}`,
                cursor: "pointer",
                background: checked ? `${VERDE_INSTITUCIONAL}08` : "#fff",
                transition: "all 0.2s",
                "&:hover": {
                  transform: "scale(1.02)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                },
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontWeight: 900, fontSize: "0.9rem" }}>
                      {j.fullName}
                    </Typography>
                    
                    {/* Badge de carrera */}
                    {j.careerName && (
                      <Chip
                        label={j.careerName}
                        size="small"
                        sx={{
                          bgcolor: "#f5f5f5",
                          fontSize: "0.65rem",
                          fontWeight: 800,
                          height: 20
                        }}
                      />
                    )}
                  </Box>

                  <Typography sx={{ color: "#666", fontSize: "0.8rem" }}>
                    📧 {j.email}
                  </Typography>

                  <Typography sx={{ color: "#888", fontSize: "0.75rem", mt: 0.3 }}>
                    {j.roles?.includes("ROLE_TUTOR") && "🎓 Tutor"}
                    {j.roles?.includes("ROLE_TUTOR") && j.roles?.includes("ROLE_DOCENTE") && " • "}
                    {j.roles?.includes("ROLE_DOCENTE") && "👔 Coordinador"}
                  </Typography>
                </Box>

                {checked && (
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      bgcolor: VERDE_INSTITUCIONAL,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: "0.9rem",
                    }}
                  >
                    ✓
                  </Box>
                )}
              </Box>
            </Box>
          );
        })}

        {!filteredJuries.length && (
          <Box sx={{ 
            textAlign: 'center', 
            py: 4, 
            bgcolor: '#f9f9f9', 
            borderRadius: 2,
            border: '1px dashed #ddd'
          }}>
            <Typography sx={{ color: "#777", fontStyle: "italic" }}>
              {searchTerm 
                ? `No se encontraron jurados con "${searchTerm}"`
                : selectedCareerId !== "ALL"
                  ? `No hay jurados en ${careers.find(c => c.id === selectedCareerId)?.name}`
                  : "No hay jurados disponibles"
              }
            </Typography>
          </Box>
        )}

        {/* Contador */}
        <Box sx={{ 
          textAlign: "center", 
          py: 1.5, 
          bgcolor: selectedJuryIds.length === 5 ? `${VERDE_INSTITUCIONAL}08` : "#f9f9f9",
          borderRadius: 2,
          border: `1px solid ${selectedJuryIds.length === 5 ? VERDE_INSTITUCIONAL : "#eee"}`
        }}>
          <Typography
            sx={{
              color: selectedJuryIds.length === 5 ? VERDE_INSTITUCIONAL : "#666",
              fontSize: "0.85rem",
              fontWeight: 900,
            }}
          >
            {selectedJuryIds.length === 5 
              ? "✓ 5/5 jurados seleccionados" 
              : `Seleccionados: ${selectedJuryIds.length}/5`
            }
          </Typography>
        </Box>
      </Box>
    </>
  );
}
