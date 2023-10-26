import React from 'react';

const MaterialInfo = ({ descricao, qtd_stock, armazem, cod }) => {
  // if properties are null , set empty strings
  descricao = descricao ? descricao : '';
  qtd_stock = qtd_stock ? qtd_stock : '';
  armazem = armazem ? armazem : '';
  cod = cod ? cod : '';

  return (
    <div class="wrapper" >
      <div> <b>Material: </b>  {descricao}</div>
      <div>  <b>Quantidade:</b>  {qtd_stock}</div>
      <div><b>Armazem:</b>  {armazem}</div>
      <div> <b>Cod:</b>{cod}</div>

{/*       
      <h2 className="product-name">Material : {descricao}</h2>
      <p className="product-stock">Quantidade : {qtd_stock}</p>
      <p className="product-armazem">Armazem : {armazem}</p>
      <p className="product-cod">Cod :{cod}</p> */}
    </div>


  );
};

export default MaterialInfo;
