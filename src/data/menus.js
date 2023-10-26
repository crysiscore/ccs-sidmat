import { faPage4, faWindows } from "@fortawesome/free-brands-svg-icons";
import {
  faTachometer,
  faTable,
  faLock,
  faNoteSticky,
  faNotdef
} from "@fortawesome/free-solid-svg-icons";

// Menu do Assessor
const initMenu = [
  {
    label: "Dashboard",
    path: "/",
    icon: faTachometer,
  },
  {
    //label: 'Halaman'
    label: 'Requisições'
  },
  {
    label: "Nova Requisição",
    path: "/blank",
    icon: faPage4,
  },
  {
    label: "Material Disponivel",
    path: "/material",
    icon: faNotdef,
  },
  {
    label: "Minhas Requisições",
    path: "/404",
    icon: faNotdef,
  },
  
  {
    label: 'Guias de Saida'
  },
  {
    label: "Lista de Guias",
    path: "/form",
    icon: faWindows,
  },
  {
    label: "TODO",
    path: "/table",
    icon: faTable,
  },

  {
    label: 'Relatórios'
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

export default initMenu