import axios from 'axios';

const api_url = process.env.REACT_APP_API_URL;   

const api = axios.create({
    
    baseURL: api_url,
  });

  export const getMaterialLogistica = async () => {
    try {
      const response = await api.get('/vw_material_logistica');
      return response.data;
    } catch (error) {
      //throw new Error( error.response.data.error);
      throw error;
    }
  };

export async function getMaterialDisponivel(area) {

    try{
      let tempArea =area;
      // if tempArea contains special character & replace it with  '%26'
      if (tempArea.includes('&')) {
          tempArea = tempArea.replace(/&/g, '%26');
        } 
        const response = await api.get('/vw_material_disponivel?qtd_stock=gt.0&area=eq.' + tempArea);
        return await response.data;
    }catch(error) {
        throw error;
    }
    
}
// Function to get Material by ID
export async function getMaterialById(id) {
    try{
        const response = await api.get('/vw_material_by_id?id=eq.' + id);
        return await response.data;
    }catch(error) {
   // throw new Error( error.response.data.error);
   throw error;
    }
  }


export async function createUser(data) {
    const response = await fetch(`/api/user`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({user: data})
      })
    return await response.json();
}

export async function updateMaterial(material) {
  try{
    const response = await api.post('/rpc/sp_update_material',material, {headers: {'Prefer': 'return=representation'}} );
    return  response;
}
catch(error) {
  throw error;
}
}