import {React} from "react";
import { NotificationManager } from "react-notifications";
import { useNavigate } from 'react-router-dom';


function RequisicoresAreaScrolledCard({ data, ...props }) {

  const navigate = useNavigate();

const handleClickRequisicoesArea = (area) => {
  // Show a notification of the area clicked
  navigate('/pedidosPendentesArea', {
    state: {area },
    replace: true,
  });

};


/* return(
  <div className={`scrolledCard ${data.color} text-slate-50 flex flex-col`}>
  <Button flat color="primary" lg onClick={(e)=>handleClickRequisicoesArea(data.area)} >
     <h1 className="pb-3 font-semibold">{data.area}</h1>
     <div className="text-medium">&nbsp;{data.total_unidade_sanitaria} unidades sanitarias </div>
     <div className="flex flex-row justify-between items-center gap-3">
     <span className="text-[0.7rem] font-semibold">&nbsp;&nbsp;&nbsp;</span>
     <span className="text-xs px-2 py-1 rounded-full bg-white">{data.total_requisicao} Pedidos </span>
    </div>
  </Button>
  </div>
); */


     return (
        <div onClick={(e) => handleClickRequisicoesArea(data.area)} className={`scrolledCard ${data.color} text-slate-50 flex flex-col`}>
          <h1 className="pb-3 font-semibold">{data.area}</h1>

          <div className="text-medium">&nbsp;{data.total_unidade_sanitaria} unidades sanitarias </div>
          <div className="flex flex-row justify-between items-center gap-3">
            <span className="text-[0.7rem] font-semibold">&nbsp;&nbsp;&nbsp;</span>
            <span className="text-xs px-2 py-1 rounded-full bg-white">
              {data.total_requisicao} Pedidos
            </span>
          </div>
        </div>
      ); 
    }
export default RequisicoresAreaScrolledCard;