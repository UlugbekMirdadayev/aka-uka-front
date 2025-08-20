import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "../styles/sidebar.css";
import { setLogout } from "../store/slices/userSlice";
import { useDispatch, useSelector } from "react-redux";
import {
  Folder,
  Home,
  Logout,
  SidebarLogo,
  Truck,
  UserGroup,
  WereHouse,
} from "../assets/icons";

const links = [
  {
    title: "Asosiy",
    icon: (props) => <Home {...props} />,
    href: "/",
  },
  {
    title: "Buyurtma/Sotuv",
    icon: (props) => <Truck {...props} />,
    href: "/orders",
  },
  {
    title: "Ombor Moduli",
    icon: (props) => <WereHouse {...props} />,
    href: "/warehouse",
  },
  {
    title: "Kirim - Chiqim",
    icon: (props) => <Folder {...props} />,
    href: "/transactions",
  },
  {
    title: "Mijozlar Moduli",
    icon: (props) => <UserGroup {...props} />,
    href: "/clients",
  },
  {
    title: "Xabarlar moduli",
    icon: (props) => <Folder {...props} />,
    href: "/messages",
  },
];

const Sidebar = () => {
  const { user } = useSelector(({ user }) => user);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    if (window.confirm("Xaqiqatdan ham chiqmoqchimisiz ?"))
      dispatch(setLogout());
  };

  // Закрывать меню при клике на ссылку (на мобильных)
  const handleNavClick = () => setOpen(false);

  return (
    <>
      <button
        className="burger-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Открыть меню"
      >
        <span />
        <span />
        <span />
      </button>
      <div className={`sidebar${open ? " open" : ""}`}>
        <div className="links-top">
          <NavLink to={"/"} className="logo" onClick={handleNavClick}>
            <SidebarLogo />
            <span className="logo-text">AKA-UKA</span>
          </NavLink>
          <nav className="nav-links">
            {links
              ?.filter((link) =>
                user?.role !== "superadmin" ? link.href !== "/warehouse" : true
              )
              .map((link) => (
                <NavLink
                  to={link.href}
                  key={link.href}
                  className="nav-item"
                  onClick={handleNavClick}
                >
                  {link.icon({ color: "currentColor" })}
                  <span>{link.title}</span>
                </NavLink>
              ))}
          </nav>
        </div>
        <button title="Chiqish" className="logout-btn" onClick={handleLogout}>
          <div className="word-name">{user?.fullName?.[0]}</div>
          <span>{user?.fullName}</span> <Logout />
        </button>
      </div>
    </>
  );
};

export default Sidebar;
