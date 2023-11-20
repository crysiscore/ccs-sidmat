SELECT r.id,
       r.data_requisicao::date AS data_requisicao,
       m.descricao             AS material_descricao,
       r.quantidade,
       us.nome                 AS unidade_sanitaria,
       'BOM'::text             AS condicao,
       r.pf_contacto,
       r.pf_nome,
       c.nome                  AS requisitante,
       r.notas,
       gs.nr_guia,
       gs.id                   AS id_guia,
       col.nome                AS motorista,
       gs.previsao_entrega,
       s.name                  AS status,
       gs.observacao,
       a.area,
       gs.data_guia,
       gs.data_entrega
FROM api.requisicao r
         JOIN api.material m ON m.id = r.material
         JOIN api.unidade_sanitaria us ON us.id = r.unidade_sanitaria
         JOIN api.colaborador c ON c.id = r.requisitante
         JOIN api.area a ON a.id = m.area
         JOIN api.guia_saida gs ON gs.id = r.nr_guia
         JOIN api.colaborador col ON col.id = gs.motorista
         JOIN api.status s ON s.id = gs.status