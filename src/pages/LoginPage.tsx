import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api"; 

// ================= MUI =================
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

// ============== ICONOS SOCIALES =========
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

// ================= TIPOS =================
type LoginValues = { username: string; password: string };
type LoginResponse = { token: string };
type MeDto = { username: string; roles: string[] };

export default function LoginPage() {
  const nav = useNavigate();

  const [values, setValues] = useState<LoginValues>({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [bgRandom, setBgRandom] = useState("");

  const [showLogin, setShowLogin] = useState(() => {
    const saved = localStorage.getItem("loginOpen");
    return saved === "true";
  });

  const brand = { primary: "#008B8B" };

  const slides = useMemo(() => [
    Gastronomia, DisenoGrafico, RedesTelecom, Marketing, 
    Contabilidad, TalentoHumano, Enfermeria, Electricidad, DesarrolloSoftware,
  ], []);

  useEffect(() => {
    const idx = Math.floor(Math.random() * slides.length);
    setBgRandom(slides[idx]);
  }, [slides]);

  useEffect(() => {
    localStorage.setItem("loginOpen", showLogin.toString());
  }, [showLogin]);

  // ================= LÓGICA DE LOGIN CORREGIDA =================
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      // FORZAMOS LOS HEADERS PARA QUE EL BACKEND NO RECHACE TUS CREDENCIALES
      const res = await api.post<LoginResponse>("/auth/login", values, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const token = res.data.token;
      localStorage.setItem("token", token);

      const meRes = await api.get<MeDto>("/me");
      const roles = meRes.data.roles ?? [];

      if (roles.includes("ROLE_ADMIN")) nav("/admin", { replace: true });
      else if (roles.includes("ROLE_COORDINATOR")) nav("/coordinator", { replace: true });
      else if (roles.includes("ROLE_TUTOR")) nav("/tutor", { replace: true });
      else {
        setErrorMsg("Tu usuario no tiene rol asignado.");
        localStorage.clear();
      }
    } catch (err: any) {
      console.error("Error en login:", err);
      localStorage.clear();
      setErrorMsg(err?.response?.data?.message ?? "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  const handleReload = () => window.location.reload();

  return (
    <Box sx={{ minHeight: "100vh", position: "relative", overflow: "hidden", backgroundColor: "#000" }}>
      
      <Box sx={{ 
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0,
        backgroundImage: bgRandom ? `url(${bgRandom})` : "none",
        backgroundSize: "cover", backgroundPosition: "center 20%", backgroundRepeat: "no-repeat",
        transition: "background-image 0.5s ease-in-out"
      }} />

      {/* BOTÓN DE ACCESO */}
      <Box 
        onClick={() => setShowLogin(true)}
        sx={{ 
          position: "absolute", top: showLogin ? -150 : 25, right: 25, zIndex: 30,
          display: "flex", alignItems: "center", gap: 2, cursor: "pointer",
          p: "8px 22px 8px 10px", borderRadius: "50px",
          background: "rgba(255, 255, 255, 0.25)", backdropFilter: "blur(15px)",
          border: "1px solid rgba(255, 255, 255, 0.4)", boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          transition: "top 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s",
          "&:hover": { transform: "scale(1.05)", background: "rgba(255, 255, 255, 0.4)" }
        }}
      >
        <Avatar sx={{ bgcolor: brand.primary, width: 40, height: 40 }}><AccountCircleIcon /></Avatar>
        <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: "0.95rem" }}>ACCESO</Typography>
      </Box>

      {/* CAJA DE LOGIN */}
      <Box sx={{ 
        position: "absolute", top: 20, right: 20, zIndex: 40, 
        width: "330px", pb: 5, pointerEvents: showLogin ? "auto" : "none" 
      }}>
        <Collapse in={showLogin} timeout={600}>
          <Box sx={{ 
            backgroundColor: "rgba(255, 255, 255, 0.98)", borderRadius: "28px", 
            boxShadow: "0 30px 60px rgba(0,0,0,0.4)", p: 3, border: "1px solid rgba(255,255,255,0.6)",
          }}>
            <IconButton onClick={() => setShowLogin(false)} size="small" sx={{ position: "absolute", top: 12, right: 12, color: "#bbb" }}>
              <CloseIcon fontSize="small" />
            </IconButton>

            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <Box component="img" src={logoImg} onClick={handleReload} sx={{ width: "130px", cursor: "pointer" }} />
            </Box>

            <Typography variant="body1" fontWeight={900} color="#222" textAlign="center" mb={2}>SISTEMA ACADÉMICO</Typography>
            
            <Box component="form" onSubmit={onSubmit} sx={{ display: "grid", gap: 0.5 }}>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 1 }}>
                <Link href="#" sx={{ fontSize: '0.7rem', color: brand.primary, textDecoration: 'none', fontWeight: 400 }}>¿Olvidastes tu usuario?</Link>
              </Box>
              <TextField 
                placeholder="Usuario"
                required
                value={values.username}
                onChange={(e) => setValues(v => ({...v, username: e.target.value}))}
                fullWidth sx={fieldStyle(brand)}
                InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutlineRoundedIcon sx={{color:brand.primary}}/></InputAdornment> }}
              />

              <Box sx={{ mt: 1 }}>
                <TextField 
                  placeholder="Contraseña"
                  type={showPassword ? "text" : "password"}
                  required
                  value={values.password}
                  onChange={(e) => setValues(v => ({...v, password: e.target.value}))}
                  fullWidth sx={fieldStyle(brand)}
                  InputProps={{ 
                    startAdornment: <InputAdornment position="start"><LockOutlinedIcon sx={{color:brand.primary}}/></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} size="small">
                          {showPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 1, mt: 0.5 }}>
                <Link href="#" sx={{ fontSize: '0.7rem', color: brand.primary, textDecoration: 'none', fontWeight: 400 }}>¿Olvidastes tu contraseña?</Link>
              </Box>

              {errorMsg && (
                <Typography sx={{ color: "#d32f2f", fontSize: "0.75rem", textAlign: "center", mt: 1, fontWeight: 500 }}>
                  {errorMsg}
                </Typography>
              )}
              
              <Button type="submit" disabled={loading} variant="contained" fullWidth sx={{ 
                height: 44, fontWeight: 900, borderRadius: "50px", background: brand.primary, mt: 2, textTransform: 'none'
              }}>
                {loading ? "Ingresando..." : "Ingresar"}
              </Button>

              <Button variant="outlined" fullWidth startIcon={<FcGoogle size={20}/>} 
                sx={{ height: 42, borderRadius: "50px", color: "#444", borderColor: "#ddd", textTransform: "none", fontWeight: 700, mt: 1 }}>
                Continuar con Google
              </Button>

              <Box sx={{ mt: 2, textAlign: "center" }}>
                <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5 }}>
                  <Social icon={<FaFacebookF size={18} />} color="#1877F2" link="https://www.facebook.com/institutosudamericano/" />
                  <Social icon={<FaInstagram size={18} />} color="#E4405F" link="https://www.instagram.com/itsudamericano" />
                  <Social icon={<FaWhatsapp size={18} />} color="#25D366" link="https://api.whatsapp.com/send/?phone=593996976449" />
                  <Social icon={<FaTiktok size={18} />} color="#000000" link="https://www.tiktok.com/@itsudamericano" />
                  <Social icon={<LanguageRoundedIcon sx={{ fontSize: 22 }} />} color={brand.primary} link="https://sudamericano.edu.ec/" />
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
    borderRadius: "50px", height: "44px", backgroundColor: "#f7f7f7",
    "& fieldset": { borderColor: "#eee" }, 
    "&.Mui-focused fieldset": { borderColor: brand.primary } 
  },
  "& .MuiInputBase-input": { fontSize: "0.85rem", ml: 0.5, fontWeight: 400 }
});

function Social({ icon, color, link }: { icon: any, color: string, link: string }) {
  return (
    <IconButton size="small" component="a" href={link} target="_blank" rel="noopener noreferrer" sx={{ color: color }}>
      {icon}
    </IconButton>
  );
}