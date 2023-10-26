import * as React from 'react';
import {Table} from 'nextui-v1';

function GuiaTemplate({ columns, rows, ...props }) {

  const reorderedRows = rows.map((row) => {
    return {
      id_requisicao: row.id_requisicao,
      material_descricao: row.material_descricao,
      quantidade: row.quantidade,
      pf_nome: row.pf_nome,
      pf_contacto: row.pf_contacto,
      notas: row.notas,
      data_requisicao: row.data_requisicao,
    };
  });

    return (
        <Table
      aria-label="Example table with dynamic content"
      css={{
        height: "auto",
        minWidth: "100%",
      }}
    >
      <Table.Header columns={columns}>
        {(column) => (
          <Table.Column key={column.key}>{column.label}</Table.Column>
        )}
      </Table.Header>
      <Table.Body items={reorderedRows}>
        {(item) => (
          <Table.Row key={item.key}>
            {(columnKey) => <Table.Cell>{item[columnKey]}</Table.Cell>}
          </Table.Row>
        )}
      </Table.Body>
    </Table>
      );
};
export default GuiaTemplate;