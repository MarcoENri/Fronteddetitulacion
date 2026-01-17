import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Collapse,
  Link,
  Avatar,
} from "@mui/material";

import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import CloseIcon from '@mui/icons-material/Close';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { FaFacebookF, FaInstagram, FaWhatsapp, FaTiktok } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc"; 

// ================= IMÁGENES ============
import logoImg from "../assets/imagenes/LogoTec-Photoroom.png"; 
import Gastronomia from "../assets/imagenes-Tec/Gastronomia.jpeg";
import DesarrolloSoftware from "../assets/imagenes-Tec/Desarrolo-De-Software.jpeg";
import RedesTelecom from "../assets/imagenes-Tec/Redes-y-Telecomunicaciones.jpeg";
import DisenoGrafico from "../assets/imagenes-Tec/Diseno-Grafico.jpeg";
import Marketing from "../assets/imagenes-Tec/Marketing-Digital-y-Negocios.jpeg";
import Contabilidad from "../assets/imagenes-Tec/Contabilidad-y-Asesoria-Tributaria.jpeg";
import TalentoHumano from "../assets/imagenes-Tec/Talento-Humano.jpeg";
import Enfermeria from "../assets/imagenes-Tec/Enfermeria.jpeg";
import Electricidad from "../assets/imagenes-Tec/Electricidad.jpeg";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [bgRandom, setBgRandom] = useState("");
  
  const [showLogin, setShowLogin] = useState(() => {
    const saved = localStorage.getItem("loginOpen");
    return saved === "true";
  });

  const brand = {
    primary: "#008B8B", 
  };

  const socialLinks = useMemo(() => ({
    facebook: "https://www.facebook.com/institutosudamericano/",
    instagram: "https://www.instagram.com/itsudamericano",
    whatsapp: "https://api.whatsapp.com/send/?phone=593996976449",
    tiktok: "https://www.tiktok.com/@itsudamericano",
    sga: "https://sudamericano.edu.ec/",
  }), []);

  const slides = useMemo(() => [
    Gastronomia, DisenoGrafico, RedesTelecom, Marketing, 
    Contabilidad, TalentoHumano, Enfermeria, Electricidad, DesarrolloSoftware,
  ], []);

  // Mejora en la carga aleatoria de imagen
  useEffect(() => {
    const selectRandom = () => {
      const idx = Math.floor(Math.random() * slides.length);
      setBgRandom(slides[idx]);
    };
    selectRandom();
  }, [slides]);

  useEffect(() => {
    localStorage.setItem("loginOpen", showLogin.toString());
  }, [showLogin]);

  const handleReload = () => window.location.reload();

  return (
    <Box sx={{ 
      minHeight: "100vh", 
      position: "relative", 
      overflowY: "auto", 
      overflowX: "hidden",
      backgroundColor: "#000" // Fondo base negro para evitar flash blanco
    }}>
      
      {/* FONDO FIJO CON TRANSICIÓN SUAVE */}
      <Box 
        sx={{ 
          position: "fixed", 
          top: 0, left: 0, right: 0, bottom: 0, 
          zIndex: 0,
          backgroundImage: bgRandom ? `url(${bgRandom})` : "none",
          backgroundSize: "cover", 
          backgroundPosition: "center 20%", 
          backgroundRepeat: "no-repeat",
          transition: "background-image 0.5s ease-in-out"
        }} 
      />

      {/* BOTÓN DE ACCESO REPARADO - LADO DERECHO */}
      <Box 
        onClick={(e) => {
          e.stopPropagation();
          setShowLogin(true);
        }}
        sx={{ 
          position: "absolute", 
          top: showLogin ? -150 : 25, 
          right: 25, 
          zIndex: 20, // Más alto para que siempre sea clickable
          display: "flex", 
          alignItems: "center", 
          gap: 2,
          cursor: "pointer",
          p: "8px 22px 8px 10px",
          borderRadius: "50px",
          background: "rgba(255, 255, 255, 0.25)",
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(255, 255, 255, 0.4)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          transition: "top 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s",
          "&:hover": { 
            transform: "scale(1.05)", 
            background: "rgba(255, 255, 255, 0.4)" 
          },
          // Asegura que todo el contenido del box sea clickable
          "& *": { pointerEvents: "none" } 
        }}
      >
        <Avatar sx={{ bgcolor: brand.primary, width: 40, height: 40 }}>
          <AccountCircleIcon sx={{ fontSize: 30 }} />
        </Avatar>
        <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: "0.95rem", pointerEvents: "none" }}>
          ACCESO
        </Typography>
      </Box>

      {/* LOGIN DESPLEGABLE - LADO DERECHO */}
      <Box sx={{ 
        position: "absolute", 
        top: 20, 
        right: 20, 
        zIndex: showLogin ? 21 : -1, // Solo sube el nivel si está abierto
        width: "330px",
        pb: 5,
        pointerEvents: showLogin ? "auto" : "none" // Evita que bloquee clics si está cerrado
      }}>
        <Collapse in={showLogin} timeout={600}>
          <Box sx={{ 
            backgroundColor: "rgba(255, 255, 255, 0.98)", 
            borderRadius: "28px", 
            boxShadow: "0 30px 60px rgba(0,0,0,0.4)",
            p: 3,
            border: "1px solid rgba(255,255,255,0.6)",
          }}>
            <IconButton 
              onClick={() => setShowLogin(false)}
              size="small"
              sx={{ position: "absolute", top: 12, right: 12, color: "#bbb" }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>

            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <Box 
                component="img" 
                src={logoImg} 
                onClick={handleReload}
                sx={{ width: "130px", cursor: "pointer", objectFit: "contain" }} 
              />
            </Box>

            <Typography variant="body1" fontWeight={900} color="#222" textAlign="center" mb={2}>
              SISTEMA ACADÉMICO
            </Typography>
            
            <Box component="form" sx={{ display: "grid", gap: 0.5 }}>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 1 }}>
                <Link href="#" sx={{ fontSize: '0.7rem', color: brand.primary, textDecoration: 'none', fontWeight: 400 }}>¿Olvidó usuario?</Link>
              </Box>
              
              <TextField 
                placeholder="Usuario"
                fullWidth
                sx={fieldStyle(brand)}
                InputProps={{ 
                  startAdornment: <InputAdornment position="start"><PersonOutlineRoundedIcon fontSize="medium" sx={{color:brand.primary}}/></InputAdornment> 
                }}
              />

              <Box sx={{ mt: 1 }}>
                <TextField 
                  placeholder="Contraseña"
                  type={showPassword ? "text" : "password"}
                  fullWidth
                  sx={fieldStyle(brand)}
                  InputProps={{ 
                    startAdornment: <InputAdornment position="start"><LockOutlinedIcon fontSize="medium" sx={{color:brand.primary}}/></InputAdornment>,
                    endAdornment: (
                      <IconButton onClick={() => setShowPassword(!showPassword)} size="small">
                        {showPassword ? <VisibilityOffRoundedIcon sx={{fontSize: 22}}/> : <VisibilityRoundedIcon sx={{fontSize: 22}}/>}
                      </IconButton>
                    )
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 1, mt: 0.5 }}>
                <Link href="#" sx={{ fontSize: '0.7rem', color: brand.primary, textDecoration: 'none', fontWeight: 400 }}>¿Olvidó contraseña?</Link>
              </Box>
              
              <Button variant="contained" fullWidth sx={{ 
                height: 44, fontWeight: 900, borderRadius: "50px", 
                background: brand.primary, mt: 2, fontSize: "0.9rem", textTransform: 'none'
              }}>
                Ingresar
              </Button>

              <Button variant="outlined" fullWidth startIcon={<FcGoogle size={20}/>} 
                sx={{ 
                  height: 42, borderRadius: "50px", color: "#444", 
                  borderColor: "#ddd", textTransform: "none", fontWeight: 700, mt: 1,
                  "&:hover": { borderColor: brand.primary, backgroundColor: "#fff" }
                }}>
                Continuar con Google
              </Button>

              <Box sx={{ mt: 2, textAlign: "center" }}>
                <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5 }}>
                  <Social icon={<FaFacebookF size={18} />} color="#1877F2" link={socialLinks.facebook} />
                  <Social icon={<FaInstagram size={18} />} color="#E4405F" link={socialLinks.instagram} />
                  <Social icon={<FaWhatsapp size={18} />} color="#25D366" link={socialLinks.whatsapp} />
                  <Social icon={<FaTiktok size={18} />} color="#000000" link={socialLinks.tiktok} />
                  <Social icon={<LanguageRoundedIcon sx={{ fontSize: 22 }} />} color={brand.primary} link={socialLinks.sga} />
                </Box>
              </Box>
            </Box>
          </Box>
        </Collapse>
      </Box>

    </Box>
  );
}

const fieldStyle = (brand: any) => ({
  "& .MuiOutlinedInput-root": { 
    borderRadius: "50px", 
    height: "44px",
    backgroundColor: "#f7f7f7",
    "& fieldset": { borderColor: "#eee" }, 
    "&.Mui-focused fieldset": { borderColor: brand.primary } 
  },
  "& .MuiInputBase-input": { fontSize: "0.85rem", ml: 0.5, fontWeight: 600 }
});

function Social({ icon, color, link }: { icon: any, color: string, link: string }) {
  return (
    <IconButton size="small" component="a" href={link} target="_blank" rel="noopener noreferrer" sx={{ color: color }}>
      {icon}
    </IconButton>
  );
}