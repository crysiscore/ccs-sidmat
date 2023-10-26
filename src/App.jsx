import React from "react";
import {  Redirect, BrowserRouter as Router ,Route, Routes ,Link, Navigate, Outlet } from "react-router-dom";
import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Table from "./pages/Table";
import AuthLayout from "./components/Layout/AuthLayout";
import GuestLayout from "./components/Layout/GuestLayout";
import LoginIndex from "./pages/auth/Login";
import Blank from "./pages/Blank";
import NotFound from "./pages/NotFound";
import Form from "./pages/Form";
import RegisterIndex from "./pages/auth/Register";
import TableMateriaisDisponivel from "./pages/Materiais/MateriaisDisponiveis";
import TableMateriaisLogistica from "./pages/Materiais/MateriaisLogistica";
import UploadForm from "./pages/Materiais/ImportarMaterial";
import NovaRequisicao from "./pages/Requisicoes/Requisicao";
import PedidosArea from "./pages/Guias Saida/pedidosArea";
import NovaGuia from "./pages/Guias Saida/CriarGuia";
import ListaGuias from "./pages/Guias Saida/ListaGuias";
import RequisicoesPendentes from "./pages/Requisicoes/RequisicoesPendentes";
import VisualizarGuia from "./pages/Guias Saida/VisualizarGuia";
import MinhasRequisicoes from "./pages/Requisicoes/MinhasRequisicoes";
import RegistoColaborador from "./pages/Management/RegistoColaborador";
import RegistoArea from "./pages/Management/RegistoArea";
import TemplateDownload from "./pages/Management/TemplateDownload";
import RegistoProjecto from "./pages/Management/RegistoProjecto";

function App () {

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const[materialRequisicao, setMaterialRequisicao] = useState();

  const handleLogin = (status) => {
    setIsAuthenticated(status);
    console.log("isAuthenticated", isAuthenticated);
  };
  const handleNovaRequisicao = (material) => {
    setMaterialRequisicao(material);
    console.log("materialRequisitcao", materialRequisicao);
  };

// 👇️ conditionally redirect based on isAuthenticated boolean
const AuthWrapper = ({isAuthenticated}) => {
  return isAuthenticated ? (
    <Navigate to="/"  />
  ) : (
    <Navigate to="/auth/login"  />
    // {/* <Route path="/auth/login" element={<LoginIndex />}></Route> */}
  );
};


  return (

    <Routes>
     <Route
            path="/home"
            element={<AuthWrapper isAuthenticated={isAuthenticated} />}
          />
        <Route path="/" element={<AuthLayout   />}>
         <Route path="/" element={<Dashboard  />}></Route> 
         <Route path="/dashboard" element={<Dashboard  />}></Route> 
        <Route path="/materialDisponivel" element={<TableMateriaisDisponivel />}></Route>
        <Route path="/importar" element={<UploadForm />}></Route>
        <Route path="/blank" element={<Blank />}></Route>
        <Route path="/materiaisLogistica" element={<TableMateriaisLogistica />}></Route>
        {/* <Route path="/404" element={<NotFound />}> </Route> */}
        <Route path="/404" element={<UploadForm />}></Route>
        <Route path="/pedidosArea" element={<PedidosArea />}></Route>
        <Route path="/form" element={<Form />}></Route>
        <Route path="/profile" element={<Blank />}></Route>
        <Route path="/requisicao" element={<NovaRequisicao />}></Route>
       <Route path="/novaGuia" element={<NovaGuia />}></Route> 
        <Route path="/listaGuias" element={<ListaGuias />}></Route>
        <Route path="/criarNovaGuia" element={<RequisicoesPendentes />}></Route>
        <Route path="/visualizarGuia" element={<VisualizarGuia />}></Route>
        <Route path="/utilizadores" element={<RegistoColaborador />}></Route>
        <Route path="/areas" element={<RegistoArea />}></Route>
        <Route path="/template" element={<TemplateDownload />}></Route>
        <Route path="/projectos" element={<RegistoProjecto />}></Route>
        <Route path="/minhasRequisicoes" element={<MinhasRequisicoes />}></Route>
      </Route>
      <Route path="/auth" element={<GuestLayout />}>
        <Route path="/auth/login" element={<LoginIndex />}></Route>
        <Route path="/auth/register" element={<RegisterIndex />}></Route>
      </Route>
    </Routes>

  );
}

export default App;
