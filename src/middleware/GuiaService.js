import axios from "axios";

const api_url = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: api_url,
});

//create a function to create a guia  using the stored procedure sp_create_guia_saida,  using the following parameters:
// id_motorista , unidade_sanitaria , previsao_entrega ,status ,observacao ,id_area , data_guia , nr_guia , ids_requisicao  (array of ids)

export async function createGuia(guiaInfo) {
  try {
    const response = await api.post("/rpc/sp_create_guia_saida", guiaInfo, {
      headers: { Prefer: "return=representation" },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

// create a function to list all guias de saida by area
export async function listGuiasByArea(area) {
  let allAreas = "";

  try {
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
        "/vw_guias_saida?area=in.(" + allAreas + ")&status=eq.NOVA"
      );
      return response.data;
    } else {
      let tempArea = area[0];
      // if area = "all" then list all guias de saida  (Admin role)
      if (tempArea === "all") {
        const response = await api.get("/vw_guias_saida?status=eq.NOVA");
        return response.data;
      } else {
        // if tempArea contains special character & replace it with  '%26'
        if (tempArea.includes("&")) {
          tempArea = tempArea.replace(/&/g, "%26");
        }
        const response = await api.get(
          "/vw_guias_saida?area=eq." + tempArea + "&status=eq.NOVA"
        );
        return response.data;
      }
    }
  } catch (error) {
    throw error;
  }
}

// create a function to list all guias de saida by area
export async function listGuiasEntregues(area) {
  let allAreas = "";

  try {
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
        "/vw_guias_saida?area=in.(" + allAreas + ")&status=eq.ENTREGUE"
      );
      return response.data;
    } else {
      let tempArea = area[0];
      // if area = "all" then list all guias de saida else list guias de saida by area
      if (tempArea === "all") {
        const response = await api.get("/vw_guias_saida?status=eq.ENTREGUE");
        return response.data;
      } else {
        // if tempArea contains special character & replace it with  '%26'
        if (tempArea.includes("&")) {
          tempArea = tempArea.replace(/&/g, "%26");
        }
        const response = await api.get(
          "/vw_guias_saida?area=eq." + tempArea + "&status=eq.ENTREGUE"
        );
        return response.data;
      }
    }
  } catch (error) {
    throw error;
  }
}

// create a function to lista all requisicoes by guia
export async function listRequisicoesByGuia(nr_guia) {
  try {
    const response = await api.get(
      "/view_get_requisicoes_by_nr_guia?nr_guia=eq." + nr_guia
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

//create a function to update a guia  using the stored procedure sp_update_guia_saida,  using the nr_guia as parameter.
export async function updateGuia(guiaInfo) {
  try {
    const response = await api.post("/rpc/sp_confirmar_guia_saida", guiaInfo, {
      headers: { Prefer: "return=representation" },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

//create a function to update a guia  using the stored procedure sp_update_guia_saida,  using the nr_guia as parameter.
export async function getGuiaSaida(nr_guia) {
  try {
    const response = await api.get("/vw_guias_saida?nr_guia=eq." + nr_guia);
    return response.data;
  } catch (error) {
    throw error;
  }
}
