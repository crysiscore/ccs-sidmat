import React from "react";

function ScrolledCard({ data, ...props }) {

  const novas = data.total_novas? data.total_novas:0;
  const processadas = data.total_processadas? data.total_processadas:0;
  const finalizadas = data.total_completas? data.total_completas:0;


    const handleClick = () => {
      window.location.href = '/minhasRequisicoes';
    }
    
  return (
    <div className={`scrolledCard ${data.color} text-slate-50 flex flex-col`} onClick={handleClick}>
      <h1 className="pb-3 font-semibold">{data.distrito}</h1>
    {/*   <div className="text-[0.6rem] text-slate-700 font-semibold">
        {data.date} (YtD)
      </div> */}
      {/* <div className="text-medium">OS:{data.os} M</div> */}
      <div className="flex flex-row justify-between items-center gap-3">
        <span className="text-[0.8rem] font-semibold">Novas: </span>
        <span className="text-xs px-2 py-1 rounded-full bg-white">
          {novas}
        </span>
      </div>
     
      <div style={{ paddingTop: '5px' }} className="flex flex-row justify-between items-center gap-3">
        <span className="text-[0.8rem] font-semibold">Processadas: </span>
        <span className="text-xs px-2 py-1 rounded-full bg-white">
          {processadas}
        </span>
      </div>
      <div style={{ paddingTop: '5px' }} className="flex flex-row justify-between items-center gap-3">
        <span className="text-[0.8rem] font-semibold">Finalizadas: </span>
        <span className="text-xs px-2 py-1 rounded-full bg-white">
          {finalizadas}
        </span>
      </div>
    </div>
  );
}

export default ScrolledCard;
