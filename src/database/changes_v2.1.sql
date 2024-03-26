-- ----------------------------- view to get all ponto focal
SELECT pf.id,
       pf.nome,
       pf.contacto,
       a.area,
       us.nome AS unidade_sanitaria,
       a.id    AS area_id,
       us.id   AS unidade_sanitaria_id,
       pf.status,
       pf.preferred
FROM api.ponto_focal pf
         JOIN api.area a ON pf.area = a.id
         JOIN api.unidade_sanitaria us ON pf.unidade_sanitaria = us.id
WHERE pf.status::text = 'activo'::text

-- ----------------------------- Ponto focal insert stored procedure  --
create or replace function api.sp_insert_ponto_focal(nome_ponto_focal character varying, contacto_ponto_focal character varying, id_us bigint, id_area bigint) returns bigint
    language plpgsql
as
$$
declare id_ponto_focal bigint;
begin
    -- first check if ponto_focal already exists
    if exists(select 1 from api.ponto_focal c where c.nome = nome_ponto_focal and c.contacto= contacto_ponto_focal and c.unidade_sanitaria = id_us and c.status = 'activo') then
        raise exception 'Ponto Focal already exists';
    end if;
    -- insert ponto_focal
    insert into api.ponto_focal (nome,  contacto, unidade_sanitaria, area) values (nome_ponto_focal, contacto_ponto_focal, id_us,id_area) returning id into id_ponto_focal;
    return id_ponto_focal;
end; $$;

alter function api.sp_insert_ponto_focal(varchar, varchar, bigint, bigint) owner to sidmat;

grant execute on function api.sp_insert_ponto_focal(varchar, varchar, bigint, bigint) to web_anon;
