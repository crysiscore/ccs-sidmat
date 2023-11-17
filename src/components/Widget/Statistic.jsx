import React from "react";
import Chart from "chart.js/auto";
import { Bar } from "react-chartjs-2";
import "./widget.css";

Chart.register();

function Statistic({ ...props }) {


// get current year
const currentYear = new Date().getFullYear();
// convert current year to string
const currentYearString = currentYear.toString();


const sumarioRequisicoes = props.dataset;

// store sumarioRequisicoes.mes_nome in array use the map function to extract the values
const mes_nome = sumarioRequisicoes.map(item => item.mes_nome);
// make mes_nome unique
const unique_mes_nome = [...new Set(mes_nome)];


const areas_name = sumarioRequisicoes.map(item => item.area);
// store sumarioRequisicoes.total_requisicao in array use the map function to extract the values
// const total_requisicao = sumarioRequisicoes.map(item => item.total_requisicao);

/*   const data = {
    labels: mes_nome,
    datasets: [
      {
        label: currentYearString,
        data:total_requisicao,
      }
    ],
  }; */

const arrayObjects = sumarioRequisicoes.map(item => {
  return {
    label: item.area,
    // make data = {mes_nome: total_requisicao}
    data: {[item.mes_nome]: item.total_requisicao}

  }
} );

let dados = { 

  unique_mes_nome,
  datasets: arrayObjects,
};



/*   const data = {
    labels: ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli"],
    datasets: [
      {
        label: "2023",
        data: ["12", "22", "90", "150", "145", "120", "190"],
      },
      {
        label: "Target",
        data: ["11", "20", "89", "149", "150"],
        type: "line",
      },
    ],
  }; */

   const options = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 2,
  }; 

/*    const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' ,
      },
      title: {
        display: true,
        text: 'Chart.js Bar Chart',
      },
    },
  }; */

  return (
    <div className={`widgetCard p-3 md:py-4 md:px-6 ${props.className}`}>
      <h1 className="text-medium font-semibold pb-4">Sumário de Requisições</h1>
      <div className="">
        <Bar data={dados} options={options} />
       </div>
    </div>
  );
}

export default Statistic;
