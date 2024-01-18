--  creat a table if not exists api.ponto_focal containing the following columns, id default nextval('api.ponto_focal_id_seq'::regclass) not null,
-- nome, contacto and unidade_sanitaria. unidade_sanitaria us a foreign key to api.unidade_sanitaria(id)

create table api.ponto_focal
(
    id                bigint default nextval('api.ponto_focal_id_seq'::regclass) not null
        constraint ponto_focal_pk
            primary key,
    nome              varchar,
    contacto          varchar,
    area              bigint                                                     not null
        constraint ponto_focal_area_id_fk
            references api.area,
    unidade_sanitaria bigint
        constraint ponto_focal_unidade_sanitaria_id_fk
            references api.unidade_sanitaria
);

alter table api.ponto_focal
    owner to sidmat;


grant delete, insert, select, update on api.ponto_focal to web_anon;

-- create a view to select all the data from api.ponto_focal , view should contain all data from api.ponto_focal and the name of the area and unidade_sanitaria as aditional columns

create view api.ponto_focal_view as
    select pf.id,
           pf.nome,
           pf.contacto,
           a.area as area,
           us.nome as unidade_sanitaria,
           a.id as area_id,
           us.id as unidade_sanitaria_id
    from api.ponto_focal pf
             join api.area a on pf.area = a.id
             join api.unidade_sanitaria us on pf.unidade_sanitaria = us.id;

alter table api.ponto_focal_view   owner to sidmat;

grant select on api.ponto_focal_view to web_anon;

create or replace function api.sp_update_pf_status(id_pf bigint, pf_status character varying) returns text
    language plpgsql
as
$$
declare
    user_id bigint;
begin
    -- update usuario
    update api.ponto_focal set status = pf_status where id = id_pf returning id into user_id;
    return 'Actualizado com sucesso';
end; $$;

alter function api.sp_update_pf_status(bigint, varchar) owner to sidmat;


create function api.sp_insert_ponto_focal(nome_ponto_focal character varying,  contacto_ponto_focal character varying,id_us bigint, id_area bigint) returns bigint
    language plpgsql
as
$$
declare id_ponto_focal bigint;
begin
    -- first check if ponto_focal already exists
    if exists(select 1 from api.ponto_focal c where c.nome = nome_ponto_focal or c.contacto= contacto_ponto_focal) then
        raise exception 'Ponto Focal already exists';
    end if;
    -- insert ponto_focal
    insert into api.ponto_focal (nome,  contacto, unidade_sanitaria, area) values (nome_ponto_focal, contacto_ponto_focal, id_us,id_area) returning id into id_ponto_focal;
    return id_ponto_focal;
end; $$;

alter function api.sp_insert_ponto_focal(varchar, varchar, bigint, bigint) owner to sidmat;

grant execute on function api.sp_insert_ponto_focal(varchar, varchar, bigint, bigint) to web_anon;

