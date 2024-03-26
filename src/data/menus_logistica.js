import { faPage4, faWindows } from "@fortawesome/free-brands-svg-icons";

import {
  faTachometer,
  faTable,
  faLock,
  faUsers,
  faFileAlt,
  faShippingFast,
  faList,
  faPlus,
  faChartLine,
  faFileUpload,
  faNoteSticky,
  faLayerGroup,
  faCirclePlus,
  faUserFriends,
  faBuilding,
  faNotdef,
} from "@fortawesome/free-solid-svg-icons";

// Menu da Logistica
const initMenuLogistica = [
  {
    label: "Dashboard",
    path: "/",
    icon: faChartLine,
  },
  {
    //label: 'Halaman'
    label: "Materiais",
  },
  {
    label: "Importar Material",
    path: "/importar",
    icon: faFileUpload,
  },
  {
    label: "Lista de Materiais",
    path: "/materiaisLogistica",
    icon: faList,
  },
  {
    label: "Pedidos de Distribuição",
    path: "/pedidosArea",
    icon: faShippingFast,
  },

  {
    label: "Guias de Saida",
  },
  {
    label: "Guias Pendentes",
    path: "/listaGuias",
    icon: faFileAlt,
  },
  {
    label: "Guias Entregues",
    path: "/guiasEntregues",
    icon: faFileAlt,
  },
  {
    label: "Nova Guia",
    path: "/criarNovaGuia",
    icon: faCirclePlus,
  },
  {
    label: "Administração",
  },
  {
    label: "Gestão de Utilizadores",
    path: "/utilizadores",
    icon: faUsers,
  },
  {
    label: "Gestão de Areas",
    path: "/areas",
    icon: faLayerGroup,
  },
  {
    label: "Gestão de Projectos",
    path: "/projectos",
    icon: faBuilding,
  },
  {
    label: "Template de Importação",
    path: "/template",
    icon: faNoteSticky,
  },
  {
    label: "Relatórios",
  },
  {
    label: "Histórico de Operações",
    path: "/auth/login",
    icon: faLock,
  },
  {
    label: "Outros",
    path: "/auth/register",
    icon: faNoteSticky,
  },
];

// Menu do Assessor
const initMenuAssessor = [
  {
    label: "Dashboard",
    path: "/",
    icon: faChartLine,
  },
  {
    //label: 'Halaman'
    label: "Requisições",
  },
  {
    label: "Nova ( por material)",
    path: "/materialDisponivel",
    icon: faPlus,
  },
  {
    label: "Nova (por US)",
    path: "/requisicaous",
    icon: faPlus,
  },
  {
    label: "Minhas Requisições",
    path: "/minhasRequisicoes",
    icon: faShippingFast,
  },

  {
    label: "Guias de Saida",
  },
  {
    label: "Lista de Guias",
    path: "/listaGuias",
    icon: faFileAlt,
  },

  {
    label: "Admninstração",
  },
  {
    label: "Gestão de Pontos Focais",
    path: "/pontoFocal",
    icon: faLock,
  },
  {
    label: "Outros",
    path: "/outros",
    icon: faNoteSticky,
  },
];

export { initMenuLogistica, initMenuAssessor };
