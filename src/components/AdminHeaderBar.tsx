import React from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider as MuiDivider,
} from "@mui/material";

import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import ExitToAppRoundedIcon from "@mui/icons-material/ExitToAppRounded";

// Menu usuario
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import PersonOffRoundedIcon from "@mui/icons-material/PersonOffRounded";

type Props = {
  verde: string;
  importing: boolean;
  onOpenAssignCareer: () => void;
  onOpenCreateUser: () => void;
  onRefresh: () => void; // Esta disparará el reload del navegador
  onLogout: () => void;
  userMenuAnchor: HTMLElement | null;
  openUserMenu: boolean;
  onOpenMenu: (e: React.MouseEvent<HTMLElement>) => void;
  onCloseMenu: () => void;
  onOpenProfile: () => void;
  onOpenTotalsMatriculados: () => void;
  onOpenTotalsRetirados: () => void;
  onUploadFile: (file: File) => void;
};

export default function AdminHeaderBar({
  verde,
  importing,
  onOpenAssignCareer,
  onOpenCreateUser,
  onRefresh,
  onLogout,
  userMenuAnchor,
  openUserMenu,
  onOpenMenu,
  onCloseMenu,
  onOpenProfile,
  onOpenTotalsMatriculados,
  onOpenTotalsRetirados,
  onUploadFile,
}: Props) {
  const whiteBtn = {
    borderRadius: "999px",
    px: 1.6,
    py: 0.7,
    fontWeight: 600,
    textTransform: "none",
    minHeight: 34,
    bgcolor: "#fff",
    color: verde,
    "&:hover": { bgcolor: "#f4f4f4" },
  } as const;

  return (
    <Box
      sx={{
        backgroundColor: verde,
        p: "8px 26px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 100,
        borderBottom: "4px solid #fff",
      }}
    >
      <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "1.05rem" }}>
        ADMINISTRACIÓN{" "}
        <Box component="span" sx={{ fontWeight: 400, opacity: 0.85 }}>
          - SEGUIMIENTO DE TITULACIÓN
        </Box>
      </Typography>

      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <Button onClick={onOpenAssignCareer} startIcon={<GroupRoundedIcon />} variant="contained" sx={whiteBtn}>
          Asignación
        </Button>

        <Button onClick={onOpenCreateUser} startIcon={<PersonAddAlt1RoundedIcon />} variant="contained" sx={whiteBtn}>
          Crear usuario
        </Button>

        {/* BOTÓN RECARGAR NAVEGADOR */}
        <IconButton 
          onClick={onRefresh} 
          sx={{ color: "#fff" }} 
          title="Recargar página"
        >
          <RefreshRoundedIcon />
        </IconButton>

        <IconButton onClick={onOpenMenu} sx={{ color: "#fff" }} title="Usuario">
          <AccountCircleRoundedIcon />
        </IconButton>

        <Menu
          anchorEl={userMenuAnchor}
          open={openUserMenu}
          onClose={onCloseMenu}
          PaperProps={{
            sx: {
              mt: 1,
              borderRadius: "14px",
              minWidth: 270,
              boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
              overflow: "hidden",
            },
          }}
        >
          <MenuItem
            onClick={() => {
              onCloseMenu();
              onOpenProfile();
            }}
          >
            <ListItemIcon>
              <AccountCircleRoundedIcon fontSize="small" />
            </ListItemIcon>
            Perfil
          </MenuItem>

          <MenuItem component="label">
            <ListItemIcon>
              <UploadFileRoundedIcon fontSize="small" />
            </ListItemIcon>
            {importing ? "Cargando..." : "Lista de titulados"}
            <input
              type="file"
              hidden
              accept=".xlsx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUploadFile(file);
              }}
            />
          </MenuItem>

          <MuiDivider />

          <MenuItem
            onClick={() => {
              onCloseMenu();
              onOpenTotalsMatriculados();
            }}
          >
            <ListItemIcon>
              <PeopleAltRoundedIcon fontSize="small" />
            </ListItemIcon>
            Total matriculados
          </MenuItem>

          <MenuItem
            onClick={() => {
              onCloseMenu();
              onOpenTotalsRetirados();
            }}
          >
            <ListItemIcon>
              <PersonOffRoundedIcon fontSize="small" />
            </ListItemIcon>
            Total reprobados
          </MenuItem>

          <MuiDivider />

          <MenuItem
            onClick={() => {
              onCloseMenu();
              onLogout();
            }}
            sx={{ color: "#d32f2f" }}
          >
            <ListItemIcon sx={{ color: "#d32f2f" }}>
              <ExitToAppRoundedIcon fontSize="small" />
            </ListItemIcon>
            Cerrar sesión
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}