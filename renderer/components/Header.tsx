import {
  Box,
  Breadcrumbs,
  Chip,
  IconButton,
  Toolbar,
  emphasize,
  styled,
  useColorScheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import React from "react";
import { useSystemStore } from "../store";
import { DrawerWidth } from "./BucketListDrawer";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";

export interface HeaderProps {
  menus: MenuInfo[];
  onMenuClick: (menu: MenuInfo) => void;
}
export interface MenuInfo {
  name: string;
  link: string;
}
interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme }) => ({
  transition: theme.transitions.create(["margin", "width"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  variants: [
    {
      props: ({ open }) => open,
      style: {
        width: `calc(100% - ${DrawerWidth}px)`,
        marginLeft: `${DrawerWidth}px`,
        transition: theme.transitions.create(["margin", "width"], {
          easing: theme.transitions.easing.easeOut,
          duration: theme.transitions.duration.enteringScreen,
        }),
      },
    },
  ],
}));

const StyledBreadcrumb = styled(Chip)(({ theme }) => {
  const backgroundColor =
    theme.palette.mode === "light"
      ? theme.palette.grey[100]
      : theme.palette.grey[800];
  return {
    backgroundColor,
    height: theme.spacing(3),
    color: theme.palette.text.primary,
    fontWeight: theme.typography.fontWeightRegular,
    "&:hover, &:focus": {
      backgroundColor: emphasize(backgroundColor, 0.06),
    },
    "&:active": {
      boxShadow: theme.shadows[1],
      backgroundColor: emphasize(backgroundColor, 0.12),
    },
  };
}) as typeof Chip;

export const Header = (props: HeaderProps) => {
  const { showDrawer, setShowDrawer } = useSystemStore();
  const { mode, setMode } = useColorScheme();

  const handleDrawerOpen = () => {
    setShowDrawer(true);
  };
  const handleThemeChange = () => {
    setMode(mode === "light" ? "dark" : "light");
  };

  return (
    <AppBar color="inherit" position="fixed" open={showDrawer}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={handleDrawerOpen}
          edge="start"
          sx={[
            {
              mr: 2,
            },
            showDrawer && { display: "none" },
          ]}
        >
          <MenuIcon />
        </IconButton>
        <Breadcrumbs
          aria-label="breadcrumb"
          sx={{ color: "inherit", flexGrow: 1 }}
        >
          {props.menus?.map((item, index) => {
            if (index === 0)
              return (
                <StyledBreadcrumb
                  component="a"
                  label={item.name}
                  key={index}
                  // onClick={() => {
                  //   props.onMenuClick(item);
                  // }}
                  icon={<HomeIcon fontSize="small" />}
                />
              );
            else
              return (
                <StyledBreadcrumb
                  component="a"
                  key={index}
                  href="#"
                  label={item.name}
                  onClick={() => {
                    props.onMenuClick(item);
                  }}
                />
              );
          })}
        </Breadcrumbs>
        <Box sx={{ flexGrow: 0 }}>
          <IconButton onClick={handleThemeChange}>
            {mode === "light" ? (
              <DarkModeRoundedIcon />
            ) : (
              <LightModeRoundedIcon />
            )}
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
