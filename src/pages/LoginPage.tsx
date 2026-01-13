import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";

// ================= MUI =================
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Tooltip,
  Divider,
  InputAdornment,
} from "@mui/material";

import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";

// ============== ICONOS SOCIALES =========
import { FaFacebookF, FaInstagram, FaWhatsapp, FaTiktok } from "react-icons/fa";

// ================= IMÁGENES ============
import DesarrolloSoftware from "../assets/imagenes-Tec/Desarrolo-De-Software.jpeg";
import RedesTelecom from "../assets/imagenes-Tec/Redes-y-Telecomunicaciones.jpeg";
import DisenoGrafico from "../assets/imagenes-Tec/Diseno-Grafico.jpeg";
import Marketing from "../assets/imagenes-Tec/Marketing-Digital-y-Negocios.jpeg";
import Contabilidad from "../assets/imagenes-Tec/Contabilidad-y-Asesoria-Tributaria.jpeg";
import TalentoHumano from "../assets/imagenes-Tec/Talento-Humano.jpeg";
import Enfermeria from "../assets/imagenes-Tec/Enfermeria.jpeg";
import Gastronomia from "../assets/imagenes-Tec/Gastronomia.jpeg";
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

  const brand = useMemo(() => ({
    aqua: "#2EC4B6",
    aquaDark: "#159A8C",
    dark: "#071318",
    dark2: "#050B10",
  }), []);

  const links = useMemo(() => ({
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

  // =============== LÓGICA DEL CARRUSEL ===============
  const track = useMemo(() => [slides[slides.length - 1], ...slides, slides[0]], [slides]);
  const [idxTrack, setIdxTrack] = useState(1);
  const [anim, setAnim] = useState(true);
  const timerRef = useRef<number | null>(null);

  const goNext = () => setIdxTrack((p) => p + 1);
  const goPrev = () => setIdxTrack((p) => p - 1);

  useEffect(() => {
    timerRef.current = window.setInterval(goNext, 5200);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (idxTrack === track.length - 1) {
      setTimeout(() => { setAnim(false); setIdxTrack(1); }, 540);
    } else if (idxTrack === 0) {
      setTimeout(() => { setAnim(false); setIdxTrack(track.length - 2); }, 540);
    } else if (!anim) {
      setTimeout(() => setAnim(true), 20);
    }
  }, [idxTrack, track.length, anim]);

  const idxReal = useMemo(() => {
    const raw = idxTrack - 1;
    if (raw < 0) return slides.length - 1;
    if (raw >= slides.length) return 0;
    return raw;
  }, [idxTrack, slides.length]);

  // ================= LÓGICA DE LOGIN =================
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await api.post<LoginResponse>("/auth/login", values);
      const token = res.data.token;
      
      // Persistencia para que no se cierre al cerrar la pestaña
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
      localStorage.clear();
      setErrorMsg(err?.response?.data?.message ?? "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: "100vh", px: 2, display: "flex", justifyContent: "center",
      alignItems: "flex-start", pt: { xs: 4, md: 8 },
      background: `radial-gradient(1200px 600px at 10% 10%, rgba(46,196,182,0.26), transparent 60%), radial-gradient(900px 500px at 90% 20%, rgba(21,154,140,0.18), transparent 55%), linear-gradient(180deg, ${brand.dark} 0%, ${brand.dark2} 100%)`,
    }}>
      <Box sx={{ width: "min(1120px, 100%)" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.35fr 1fr" }, gap: 2 }}>
          
          <Paper sx={{ position: "relative", overflow: "hidden", borderRadius: 5, minHeight: { xs: 360, md: 560 }, border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 22px 70px rgba(0,0,0,0.45)", backgroundColor: "rgba(0,0,0,0.25)" }}>
            <Box sx={{ position: "absolute", inset: 0, overflow: "hidden" }}>
              <Box sx={{ height: "100%", display: "flex", width: `${track.length * 100}%`, transform: `translateX(-${idxTrack * (100 / track.length)}%)`, transition: anim ? "transform 520ms ease" : "none" }}>
                {track.map((img, i) => (
                  <Box key={i} sx={{ width: `${100 / track.length}%`, position: "relative" }}>
                    <Box component="img" src={img} sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }} />
                    <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.06) 60%, rgba(46,196,182,0.10) 100%)" }} />
                    <Box sx={{ position: "absolute", top: 0, right: 0, width: 10, height: "100%", background: `linear-gradient(180deg, ${brand.aqua} 0%, ${brand.aquaDark} 100%)`, opacity: 0.95 }} />
                  </Box>
                ))}
              </Box>
            </Box>
            <Box sx={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 1, zIndex: 5 }}>
              <IconButton onClick={goPrev} sx={navBtn}><ArrowBackIosNewRoundedIcon fontSize="small" /></IconButton>
              <IconButton onClick={goNext} sx={navBtn}><ArrowForwardIosRoundedIcon fontSize="small" /></IconButton>
            </Box>
            <Box sx={{ position: "absolute", left: 18, bottom: 16, display: "flex", gap: 1, zIndex: 6, backgroundColor: "rgba(0,0,0,0.18)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 999, px: 1.2, py: 0.8, backdropFilter: "blur(6px)" }}>
              {slides.map((_, d) => (
                <Box key={d} onClick={() => setIdxTrack(d + 1)} sx={{ width: d === idxReal ? 22 : 10, height: 10, borderRadius: 999, cursor: "pointer", transition: "all .25s ease", backgroundColor: d === idxReal ? "rgba(46,196,182,0.95)" : "rgba(255,255,255,0.22)", border: "1px solid rgba(255,255,255,0.12)" }} />
              ))}
            </Box>
          </Paper>

          <Paper sx={{ borderRadius: 5, p: 3, border: "1px solid rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.06)", backdropFilter: "blur(10px)", boxShadow: "0 22px 70px rgba(0,0,0,0.45)", minHeight: { xs: 360, md: 560 }, display: "flex", flexDirection: "column" }}>
            <Typography variant="h6" fontWeight={950} color="white">Iniciar sesión</Typography>
            <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.15)" }} />
            
            <Box component="form" onSubmit={onSubmit} sx={{ display: "grid", gap: 1.6 }}>
              <TextField label="Usuario" value={values.username} onChange={(e) => setValues(v => ({...v, username: e.target.value}))}
                InputProps={{ startAdornment: ( <InputAdornment position="start"><PersonOutlineRoundedIcon sx={{ color: "rgba(255,255,255,0.70)" }} /></InputAdornment> ) }}
                sx={fieldStyle(brand)} />
              
              <TextField label="Contraseña" type="password" value={values.password} onChange={(e) => setValues(v => ({...v, password: e.target.value}))}
                InputProps={{ startAdornment: ( <InputAdornment position="start"><LockOutlinedIcon sx={{ color: "rgba(255,255,255,0.70)" }} /></InputAdornment> ) }}
                sx={fieldStyle(brand)} />

              {errorMsg && <Box sx={{ borderRadius: 3, px: 1.5, py: 1, border: "1px solid rgba(239,68,68,0.45)", backgroundColor: "rgba(239,68,68,0.12)", color: "rgba(255,255,255,0.92)", fontSize: 14 }}>{errorMsg}</Box>}

              <Button type="submit" disabled={loading} variant="contained" sx={{ mt: 0.5, height: 46, fontWeight: 950, borderRadius: 3, textTransform: "none", background: `linear-gradient(90deg, ${brand.aqua}, ${brand.aquaDark})`, "&:hover": { opacity: 0.95 } }}>
                {loading ? "Ingresando..." : "INGRESAR"}
              </Button>

              <Box sx={{ display: "flex", justifyContent: "center", gap: 1.4, mt: 2 }}>
                <Social href={links.facebook} icon={<FaFacebookF />} label="Facebook" />
                <Social href={links.instagram} icon={<FaInstagram />} label="Instagram" />
                <Social href={links.whatsapp} icon={<FaWhatsapp />} label="WhatsApp" />
                <Social href={links.tiktok} icon={<FaTiktok />} label="TikTok" />
                <Social href={links.sga} icon={<LanguageRoundedIcon />} label="Web institucional" />
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}

const navBtn = { width: 40, height: 40, borderRadius: 3, border: "1px solid rgba(255,255,255,0.16)", backgroundColor: "rgba(255,255,255,0.10)", color: "white", "&:hover": { backgroundColor: "rgba(255,255,255,0.16)" } };
const fieldStyle = (brand: any) => ({ "& .MuiOutlinedInput-root": { backgroundColor: "rgba(255,255,255,0.08)", color: "white", borderRadius: 3, "& fieldset": { borderColor: "rgba(255,255,255,0.2)" }, "&:hover fieldset": { borderColor: brand.aqua }, "&.Mui-focused fieldset": { borderColor: brand.aqua } }, "& label": { color: "rgba(255,255,255,0.70)" }, "& label.Mui-focused": { color: "white" } });

function Social({ href, icon, label }: any) {
  return (
    <Tooltip title={label}>
      <IconButton component="a" href={href} target="_blank" sx={{ width: 42, height: 42, color: "white", backgroundColor: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.14)", "&:hover": { backgroundColor: "rgba(255,255,255,0.22)" } }}>
        {icon}
      </IconButton>
    </Tooltip>
  );
}