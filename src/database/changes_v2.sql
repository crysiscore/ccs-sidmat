--  creat a table if not exists api.ponto_focal containing the following columns, id default nextval('api.ponto_focal_id_seq'::regclass) not null,
-- nome, contacto and unidade_sanitaria. unidade_sanitaria us a foreign key to api.unidade_sanitaria(id)

create table if not exists api.ponto_focal
(
    id                bigint  default nextval('api.ponto_focal_id_seq'::regclass) not null
        constraint ponto_focal_pk
            primary key,
    nome              varchar,
    contacto          varchar,
    area              bigint
        constraint ponto_focal_area_id_fk
            references api.area,
    unidade_sanitaria bigint
        constraint ponto_focal_unidade_sanitaria_id_fk
            references api.unidade_sanitaria,
    status            varchar default 'activo'::character varying,
    preferred         varchar(3)
);

alter table api.ponto_focal
    owner to sidmat;


grant delete, insert, select, update on api.ponto_focal to web_anon;


-- create a view to select all the data from api.ponto_focal , view should contain all data from api.ponto_focal and the name of the area and unidade_sanitaria as aditional columns

drop view if exists api.ponto_focal_view cascade;
create view api.ponto_focal_view as
    SELECT pf.id,
       pf.nome,
       pf.contacto,
       a.area,
       us.nome      AS unidade_sanitaria,
       a.id         AS area_id,
       us.id        AS unidade_sanitaria_id,
       pf.status,
       pf.preferred
FROM api.ponto_focal pf
         JOIN api.area a ON pf.area = a.id
         JOIN api.unidade_sanitaria us ON pf.unidade_sanitaria = us.id;

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


create or replace function api.sp_insert_ponto_focal(nome_ponto_focal character varying,  contacto_ponto_focal character varying,id_us bigint, id_area bigint) returns bigint
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


-- Create a trigger function that checks if the  there is already one ponto focal row in the table api.ponto_focal with the same unidae_sanitaria and area
-- if there is already one row with the same unidade_sanitaria and area then the set the preferred column to false else set the preferred column to true.
-- the trigger function should riun afrer insert or update on api.ponto_focal

-- first drop the trigger function if it exists
drop function if exists api.tf_ponto_focal_preferred() cascade;

create or replace function api.tf_ponto_focal_preferred() returns trigger
    language plpgsql
as
$$
begin
    if exists(select 1 from api.ponto_focal pf where pf.unidade_sanitaria = new.unidade_sanitaria and pf.area = new.area and pf.id <> new.id) then
        update api.ponto_focal set preferred = 'Nao' where id = new.id;
    else
        update api.ponto_focal set preferred = 'Sim' where id = new.id;
    end if;
    return new;
end; $$;

alter function api.tf_ponto_focal_preferred() owner to sidmat;
create trigger tf_ponto_focal_preferred
    after insert
    on api.ponto_focal
    for each row
execute procedure api.tf_ponto_focal_preferred();

grant execute on function api.tf_ponto_focal_preferred() to web_anon;


create function sp_update_ponto_focal_status(id_ponto_focal bigint, preferred_status character varying) returns text
    language plpgsql
as
$$
declare
    user_id bigint;
begin
    -- update usuario
    update api.ponto_focal set preferred = preferred_status where id = id_ponto_focal returning id into user_id;
    return 'Estado preferido actualizado com sucesso';
end; $$;

alter function sp_update_ponto_focal_status(bigint, varchar) owner to sidmat;



create or replace function api.sp_update_material(id_material bigint, material_nome character varying, quantidade bigint, previous_area_id bigint ,id_area bigint) returns text
    language plpgsql
as
$$
declare
   material_id bigint;
begin
    -- if the previous_area_id is not the same as id_area then check if there are requisitions for the material in the previous_area_id
    if previous_area_id <> id_area then
        if exists(select 1 from api.requisicao r where r.material = id_material ) then
            return 'Material cannot be moved because there are requisitions for the material in the previous area';
        else
                -- update material , because there arent any requisitions for the material in the previous_area_id
            update api.material set descricao= material_nome, qtd_stock = quantidade , area= id_area  where id = id_material returning id into material_id;
            return 'Actualizado com sucesso';
        end if;
    else
        -- update material
        update api.material set descricao= material_nome, qtd_stock = quantidade , area= id_area  where id = id_material returning id into material_id;
        return 'Actualizado com sucesso';
    end if;

end; $$;

alter function api.sp_update_material(bigint, varchar, bigint) owner to sidmat;

grant execute on function api.sp_update_material(bigint, varchar, bigint) to web_anon;