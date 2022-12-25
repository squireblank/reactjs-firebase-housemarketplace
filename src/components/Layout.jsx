import { Outlet } from "react-router-dom";

import React from "react";
import Navbar from "./Navbar";

const Layout = () => {
  return (
    <>
      <Outlet />
      <Navbar />
    </>
  );
};

export default Layout;
