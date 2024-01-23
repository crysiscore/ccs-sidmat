import axios from "axios";

const api_url = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: api_url,
});

export const login = async (username, password) => {
  try {
    const response = await api.post("/rpc/login_user", { username, password });
    return response.data;
  } catch (error) {
    // Throw new Error( error.response.data.error);
    throw error;
  }
};

export async function getAllAreas() {
  //Const api_url = process.env.REACT_APP_API_URL;
  try {
    const response = await api.get("/area");
    //console.log(response.json());
    return response.data;
  } catch (error) {
    throw error;
  }
}
// get all roles

export async function getAllRoles() {
  //Const api_url = process.env.REACT_APP_API_URL;
  try {
    const response = await api.get("/role");
    //console.log(response.json());
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getAllProjectos() {
  // const api_url = process.env.REACT_APP_API_URL;
  try {
    const response = await api.get("/projecto");
    //console.log(response.json());
    return response.data;
  } catch (error) {
    throw error;
  }
}
export async function getAllArmazens() {
  try {
    const response = await api.get("/armazem");
    return response.data;
  } catch (error) {
    throw error;
  }
}
//get all unidades_sanitarias
export async function getAllUnidadesSanitarias() {
  try {
    const response = await api.get("/vw_unidades_sanitarias");
    return response.data;
  } catch (error) {
    throw error;
  }
}

//get all users wiht the role of Motorista
export async function getAllMotoristas() {
  try {
    const response = await api.get("/vw_get_motoristas");
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function createUser(data) {
  const response = await fetch(`/api/user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user: data }),
  });
  return await response.json();
}

// get total requisicoes grouped by month getRequisicoesByMonth
export async function getRequisicoesByMonth(area) {
  if (area === "all") {
    try {
      const response = await api.get("/vw_all_requisicoes_by_month");
      return response.data;
    } catch (error) {
      throw error;
    }
  } else {
    try {
      let allAreas = "";

      if (area.length > 1) {
        let tempArea = area;
        tempArea.forEach((area, index) => {
          allAreas += `"${area}"`;
          if (index !== tempArea.length - 1) {
            allAreas += ",";
          }
        });

        allAreas = allAreas.replace(/&/g, "%26");
        const response = await api.get(
          "/vw_requisicoes_by_month?area=in.(" + allAreas + ")"
        );
        return response.data;
      } else {
        let allAreas = area;

        allAreas = allAreas.map((area) => area.replace(/&/g, "%26"));
        const response = await api.get(
          "/vw_requisicoes_by_month?area=in.(" + allAreas + ")"
        );
        return response.data;
      }
    } catch (error) {
      throw error;
    }
  }
}

// get total requisicoes grouped by distrito getRequisicoesByMonth
export async function getRequisicoesByDistrito(area) {
  if (area === "all") {
    try {
      const response = await api.get("/vw_requisicoes_by_distrito");
      return response.data;
    } catch (error) {
      throw error;
    }
  } else {
    try {
      let allAreas = "";
      if (area.length > 1) {
        let tempArea = area;
        tempArea.forEach((area, index) => {
          allAreas += `"${area}"`;
          if (index !== tempArea.length - 1) {
            allAreas += ",";
          }
        });

        allAreas = allAreas.replace(/&/g, "%26");

        const response = await api.get(
          "/rpc/fn_requisicoes_por_distrito?area_name=%7B" + allAreas + "%7D"
        ); // %7B = { and %7D = }
        return response.data;
      } else {
        let allAreas = area;
        allAreas = allAreas.map((area) => area.replace(/&/g, "%26"));

        const response = await api.get(
          "/rpc/fn_requisicoes_por_distrito?area_name=%7B" + allAreas + "%7D"
        ); // %7B = { and %7D = }
        return response.data;
      }
    } catch (error) {
      throw error;
    }
  }
}

// create a function to register a new area
export async function createArea(data) {
  try {
    const response = await api.post("/rpc/sp_insert_area", data, {
      headers: { Prefer: "return=representation" },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

// create a function to register a new projecto
export async function createProjecto(data) {
  try {
    const response = await api.post("/rpc/sp_insert_projecto", data, {
      headers: { Prefer: "return=representation" },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

// create a function to register a new armazem
export async function createArmazem(data) {
  try {
    const response = await api.post("/rpc/sp_insert_armazem", data, {
      headers: { Prefer: "return=representation" },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

// create a function to register a new colaborador
export async function createColaborador(data) {
  try {
    const response = await api.post("/rpc/sp_insert_colaborador", data, {
      headers: { Prefer: "return=representation" },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}
// create a function to register a new ponto focal
export async function createPontoFocal(data) {
  try {
    const response = await api.post("/rpc/sp_insert_ponto_focal", data, {
      headers: { Prefer: "return=representation" },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}
// create a function to get all colaboradores
export async function getAllColaboradores() {
  try {
    const response = await api.get("/vw_all_colaboradores");
    return response.data;
  } catch (error) {
    throw error;
  }
}

// create a function to get all unidades sanitarias
export async function getLocations() {
  try {
    const response = await api.get("/vw_get_locations");
    return response.data;
  } catch (error) {
    throw error;
  }
}

// create a function to update the status  user in the usuario table, use the stored procedure
//sp_update_usuario_status( id_usuario integer, status varchar)
export async function updateUsuarioStatus(user) {
  try {
    const response = await api.post("/rpc/sp_update_usuario_status", user, {
      headers: { Prefer: "return=representation" },
    });
    return response;
  } catch (error) {
    throw error;
  }
}

export async function updatePontoFocalStatus(pf) {
  try {
    const response = await api.post("/rpc/sp_update_ponto_focal_status", pf, {
      headers: { Prefer: "return=representation" },
    });
    return response;
  } catch (error) {
    throw error;
  }
}
// create a function to update the status  user in the usuario table, use the stored procedure
//sp_update_usuario_status( id_usuario integer, status varchar)
export async function updateAreaStatus(area) {
  try {
    const response = await api.post("/rpc/sp_update_area_status", area, {
      headers: { Prefer: "return=representation" },
    });
    return response;
  } catch (error) {
    throw error;
  }
}

// create a function to update the status  user in the usuario table, use the stored procedure
//sp_update_usuario_status( id_usuario integer, status varchar)
export async function updateArea(area) {
  try {
    const response = await api.post("/rpc/sp_update_area", area, {
      headers: { Prefer: "return=representation" },
    });
    return response;
  } catch (error) {
    throw error;
  }
}

// create a function to update the status  user in the usuario table, use the stored procedure
//sp_update_usuario_status( id_usuario integer, status varchar)
export async function updateProjectoStatus(project) {
  try {
    const response = await api.post("/rpc/sp_update_projecto_status", project, {
      headers: { Prefer: "return=representation" },
    });
    return response;
  } catch (error) {
    throw error;
  }
}

// create a function to update the status  user in the usuario table, use the stored procedure
//sp_update_usuario_status( id_usuario integer, status varchar)
export async function updateProjecto(project) {
  try {
    const response = await api.post("/rpc/sp_update_projecto", project, {
      headers: { Prefer: "return=representation" },
    });
    return response;
  } catch (error) {
    throw error;
  }
}

export async function getPontosFocais(area) {
  try {
    let allAreas = "";
    if (area.length > 1) {
      let tempArea = area;
      tempArea.forEach((area, index) => {
        allAreas += `"${area}"`;
        if (index !== tempArea.length - 1) {
          allAreas += ",";
        }
      });

      allAreas = allAreas.replace(/&/g, "%26");

      const response = await api.get(
        "/ponto_focal_view?area_name=%7B" + allAreas + "%7D"
      ); // %7B = { and %7D = }
      return response.data;
    } else {
      let allAreas = area;

      allAreas = allAreas.map((area) => area.replace(/&/g, "%26"));
      const response = await api.get("/ponto_focal_view?area=eq." + allAreas);
      return response.data;
    }
  } catch (error) {
    throw error;
  }
}
