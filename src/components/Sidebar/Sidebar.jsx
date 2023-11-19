import {  faSignOut ,faTruckFast } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useRef, useState } from "react";
import { initMenuAssessor,initMenuLogistica } from "../../data/menus_logistica.js";
import "./sidebar.css";
import SidebarLogo from "./SidebarLogo.jsx";
import SidebarSearch from "./SidebarSearch.jsx";
import MenuList from "./MenuList.jsx";
import { useNavigate } from "react-router-dom";
import ccsLogoIco from "../../img/ccsIconResource.js" 

//TODO : Pass user props to sidebar to render menus based on user role
function Sidebar({ ...props }) {

  // check props.userData to determine menu type
  const userData = props.userData;
  const initMenus = userData[0].role === "Logistica" ? initMenuLogistica : initMenuAssessor;



  //const initMenus = initMenuLogistica;
  const navigate = useNavigate();
  const [menus, setMenus] = useState(initMenus);
  const [scButton, setScButton] = useState(false);
  const search = useRef("");

  // create an icon resource from the ccsLogoIco, which is a base64 enconded image
  const ccsIco = "data:image/png;base64," + ccsLogoIco;



  const handleChange = (e) => {
    if (e.target.value) {
      setScButton(true);
      setMenus(
        menus.filter((el) => {
          return el.label.toLowerCase().includes(e.target.value.toLowerCase());
        })
      );
    } else {
      setScButton(false);
      setMenus(initMenus);
    }
  };

  const clearSearch = () => {
    search.current.value = "";
    setMenus(initMenus);
    setScButton(false);
  };

  const logout = () => {
    //Remove userData and isAuthenticated from sessionStorage
    sessionStorage.removeItem("isAuthenticated");
    sessionStorage.removeItem("userData");
    navigate("/auth/login");

    
  };

  return (
    <>
      <aside
        id="sidebar"
        className={`sidebarWrapper md:translate-x-0 -translate-x-full md:z-0 z-50 no-scrollbar ${props.className}`}
      >
        {/* Sidebar wrapper */}
        <div className="md:w-64 border-r-2 border-gray-100 h-full flex-col flex flex-shrink-0">
          {/* Logo */}
          <SidebarLogo toggle={props.toggle}  icon={ccsIco} text="Distribuição de Materiais" />
          {/* <SidebarLogo toggle={props.toggle}  icon={faTruckFast} text="Distribuição de Materiais" /> */}

          {/* Search Menu */}
          <SidebarSearch
            clearSearch={clearSearch}
            handleChange={handleChange}
            scButton={scButton}
            search={search}
          />

          {/* Menu */}
          <MenuList menus={menus} toggle={props.toggle} />

          {/* Profile */}
          <div className="pt-2 border-t border-gray-300">
            <div className="py-2 px-4">
              {/* Logout Button */}
              <button
                className="py-2 px-4 border border-blue-500 bg-blue-600 w-full rounded-full text-gray-200 hover:bg-blue-600 hover:border-blue-600 justify-end text-sm"
                onClick={() => logout()}
              >
                <FontAwesomeIcon icon={faSignOut}></FontAwesomeIcon> Sair
              </button>
            </div>
          </div>
        </div>
      </aside>

      {props.className === "mobile" && (
        <div
          id="overlaySidebar"
          onClick={props.toggle}
          className="hidden absolute w-full h-screen bg-black z-10 inset-0 opacity-60"
        >
          <div></div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
