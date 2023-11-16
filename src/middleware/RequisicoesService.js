import axios from 'axios';

const api_url = process.env.REACT_APP_API_URL;   

const api = axios.create({
    
    baseURL: api_url,
  });

//create a function to post requisicao object and include the header  Prefer: return=representation
export async function createRequisicao(data) {
    try{
        const response = await api.post('/requisicao', data, {headers: {'Prefer': 'return=representation'}});
        return response.data;
    }catch(error) {
        throw error;
    }
    
}
// create a funcion to get requisicoes by user_id and the canceled staus is No
export async function getRequisicoesByUser(area) {
    try{
        let tempArea =area;
        // if tempArea contains special character & replace it with  '%26'
        if (tempArea.includes('&')) {
            tempArea = tempArea.replace(/&/g, '%26');
          } 
        const response = await api.get('/vw_my_requisicao?area=eq.' + tempArea + '&canceled=eq.No');
        return await response.data;
    }catch(error) {
        throw error;
    }

}



// create a funcion to get requisicoes by area
export async function getRequisicoesByArea(area) {
    try{
        let tempArea =area;
        // if tempArea contains special character & replace it with  '%26'
        if (tempArea.includes('&')) {
            tempArea = tempArea.replace(/&/g, '%26');
          } 
        const response = await api.get('/vw_requisicao_by_area?area=eq.' + tempArea);
        return await response.data;
    }catch(error) {
        throw error;
    }

}

// create a funcion to get all requisicoes 
export async function getAllRequisicoes() {
    try{
        const response = await api.get('/vw_requisicoes_pendentes?canceled=eq.No');
        return await response.data;
    }catch(error) {
        throw error;
    }
}


// create a funcion to get requisicoes pendentes
export async function getRequisicoesPendentesArea() {
    try{
        const response = await api.get('/vw_sumario_requisicoes_pendentes');
        return await response.data;
    }catch(error) {
        throw error;
    }

}
// vw_material_solcitado_by_area_us
export async function getRequisicoesPendentesAreaUS(area,us) {
    try{
        let tempArea =area;
        // if tempArea contains special character & replace it with  '%26'
        if (tempArea.includes('&')) {
            tempArea = tempArea.replace(/&/g, '%26');
          } 
        const response = await api.get('/vw_material_solcitado_by_area_us?id_us=eq.' + us + '&area=eq.' + tempArea);
        return await response.data;
    }catch(error) {
        throw error;
    }

}

// create a function to cancell a requisicao by its id
export async function cancelRequisicao(id) {
    try {
        const response = await api.patch('/requisicao?id=eq.' + id, {"canceled" : 'Yes'}, {headers: {'Prefer': 'return=representation'}});
        return response.data;
    } catch(error) {
        throw error;
    }
}
