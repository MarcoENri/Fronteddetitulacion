// src/components/JuriesSelector.tsx
import { useState, useMemo } from "react";
import { 
  Box, 
  Typography, 
  TextField,
  InputAdornment,
  Chip
} from "@mui/material";
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';

const VERDE_INSTITUCIONAL = "#008B8B";

interface JuryUserDto {
  id: number;
  fullName: string;
  email: string;
  dni?: string;
  roles?: string[];
  careerId?: number;
  careerName?: string;
}

interface Props {
  juries: JuryUserDto[];
  selectedJuryIds: number[];
  toggleJury: (id: number) => void;
}

export default function JuriesSelector({
  juries,
  selectedJuryIds,
  toggleJury,
}: Props) {

  const [searchTerm, setSearchTerm] = useState("");

  // ✅ ROLES PERMITIDOS: TUTOR Y COORDINADOR (DOCENTE)
  const allowedRoles = ["ROLE_TUTOR", "ROLE_DOCENTE"];

  // ✅ FILTRADO: roles + búsqueda
  const filteredJuries = useMemo(() => {
    console.log("🔍 Total de jurados recibidos:", juries.length);
    
    // 1. Filtrar por roles permitidos
    let filtered = juries.filter(j => {
      const hasRoles = Array.isArray(j.roles) && j.roles.some(role => allowedRoles.includes(role));
      return hasRoles;
    });

    console.log("✅ Jurados con roles válidos (TUTOR/COORDINADOR):", filtered.length);

    // 2. Filtrar por búsqueda (nombre, email o DNI)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(j => 
        j.fullName.toLowerCase().includes(term) ||
        j.email.toLowerCase().includes(term) ||
        (j.dni && j.dni.toLowerCase().includes(term))
      );
      console.log("🔎 Después de búsqueda:", filtered.length);
    }

    return filtered;
  }, [juries, searchTerm]);

  const totalJuriesWithRoles = juries.filter(j => 
    Array.isArray(j.roles) && j.roles.some(role => allowedRoles.includes(role))
  ).length;

  return (
    <>
      <Typography sx={{ fontWeight: 800, mt: 3, mb: 1, fontSize: "0.9rem" }}>
        👨‍⚖️ Jurados - Tutores y Coordinadores (exactamente 3)
      </Typography>

      {/* BUSCADOR */}
      <Box sx={{ mb: 2 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Buscar por nombre, email o cédula..."
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
            maxWidth: 500,
            "& .MuiOutlinedInput-root": {
              borderRadius: "50px",
              "& fieldset": { borderColor: "#dcdde1" },
              "&:hover fieldset": { borderColor: "#000" },
              "&.Mui-focused fieldset": { borderColor: VERDE_INSTITUCIONAL },
            }
          }}
        />
        
        <Typography sx={{ mt: 1, fontSize: "0.75rem", color: "#666", fontStyle: "italic" }}>
          📊 Total disponibles: {totalJuriesWithRoles} jurados (Tutores y Coordinadores)
        </Typography>
      </Box>

      {/* LISTA DE JURADOS */}
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          maxHeight: 350,
          overflowY: "auto",
          pr: 1,
          "&::-webkit-scrollbar": { width: "8px" },
          "&::-webkit-scrollbar-thumb": { 
            background: VERDE_INSTITUCIONAL, 
            borderRadius: "10px" 
          },
        }}
      >
        {filteredJuries.map((j) => {
          const checked = selectedJuryIds.includes(j.id);
          
          // Determinar roles para mostrar
          const isTutor = j.roles?.includes("ROLE_TUTOR");
          const isCoordinator = j.roles?.includes("ROLE_DOCENTE");

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
                <Box sx={{ flex: 1 }}>
                  {/* Nombre */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontWeight: 900, fontSize: "0.9rem" }}>
                      {j.fullName}
                    </Typography>
                    
                    {/* Badges de rol */}
                    {isTutor && (
                      <Chip
                        label="🎓 Tutor"
                        size="small"
                        sx={{
                          bgcolor: "#e3f2fd",
                          color: "#1976d2",
                          fontSize: "0.65rem",
                          fontWeight: 800,
                          height: 20
                        }}
                      />
                    )}
                    
                    {isCoordinator && (
                      <Chip
                        label="👔 Coordinador"
                        size="small"
                        sx={{
                          bgcolor: "#f3e5f5",
                          color: "#7b1fa2",
                          fontSize: "0.65rem",
                          fontWeight: 800,
                          height: 20
                        }}
                      />
                    )}
                    
                    {/* Badge de carrera si existe */}
                    {j.careerName && (
                      <Chip
                        label={j.careerName}
                        size="small"
                        sx={{
                          bgcolor: "#fff3e0",
                          color: "#e65100",
                          fontSize: "0.65rem",
                          fontWeight: 800,
                          height: 20
                        }}
                      />
                    )}
                  </Box>

                  {/* Email */}
                  <Typography sx={{ color: "#666", fontSize: "0.8rem" }}>
                    📧 {j.email}
                  </Typography>

                  {/* DNI si existe */}
                  {j.dni && (
                    <Typography sx={{ color: "#888", fontSize: "0.75rem", mt: 0.3 }}>
                      🆔 {j.dni}
                    </Typography>
                  )}
                </Box>

                {/* Checkmark */}
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
                      flexShrink: 0,
                      ml: 2
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
            <Typography sx={{ color: "#777", fontStyle: "italic", mb: 1 }}>
              {searchTerm 
                ? `❌ No se encontraron jurados con "${searchTerm}"`
                : "⚠️ No hay jurados disponibles con roles de Tutor o Coordinador"
              }
            </Typography>
            <Typography sx={{ color: "#999", fontSize: "0.75rem" }}>
              Verifica que los usuarios tengan asignados los roles ROLE_TUTOR o ROLE_DOCENTE
            </Typography>
          </Box>
        )}

        {/* Contador de selección */}
        <Box sx={{ 
          textAlign: "center", 
          py: 1.5, 
          bgcolor: selectedJuryIds.length === 3 ? `${VERDE_INSTITUCIONAL}08` : "#f9f9f9",
          borderRadius: 2,
          border: `1px solid ${selectedJuryIds.length === 3 ? VERDE_INSTITUCIONAL : "#eee"}`,
          position: 'sticky',
          bottom: 0,
          zIndex: 1
        }}>
          <Typography
            sx={{
              color: selectedJuryIds.length === 3 ? VERDE_INSTITUCIONAL : "#666",
              fontSize: "0.85rem",
              fontWeight: 900,
            }}
          >
            {selectedJuryIds.length === 3 
              ? "✅ 3/3 jurados seleccionados (Completo)" 
              : `Seleccionados: ${selectedJuryIds.length}/3`
            }
          </Typography>
        </Box>
      </Box>
    </>
  );
}