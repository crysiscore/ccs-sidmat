create role web_anon nologin;
grant usage on schema api to web_anon;



-- grant insert on all tables to web_anon;
grant select, insert , update, delete on all tables in schema api to web_anon;
-- grant usage on all sequences in schema api to web_anon;
grant select, update on all sequences in schema api to web_anon;

drop role  if exists  authenticator;
create role authenticator noinherit login password 'ccs_sidmat_2023';

grant web_anon to authenticator;

 -- grant select on role, user_role, usuario, colaborador, area,  colaborador_area, material, armazem to web_anon;

 -- - ----------------------+ vw_authenticate  +-------------------------------------------------
drop view if exists  api.vw_authenticate;
create or replace view api.vw_authenticate as
    SELECT c.id, u.username, c.nome,c.email,c.contacto  , a.area, r.name as role
      from usuario u inner join colaborador c on c.id = u.colaborador
      inner join colaborador_area ca on ca.colaborador = c.id
      inner join area a on a.id = ca.area
      inner join user_role ur on ur.user_id = u.id
    inner join role r on ur.role_id = r.id;
 grant select on api.vw_authenticate to web_anon;

-- -----------------------+ vw_material_disponivel  +------------------------------------------------
drop view if exists api.vw_material_disponivel;
create or replace view api.vw_material_disponivel as
SELECT mat.id,cod,descricao,qtd_stock,a.area , armazem,familia,prazo, a.id as id_area
FROM api.material mat inner join api.area a on a.id = mat.area order by qtd_stock desc ;

 grant select on api.vw_material_disponivel to web_anon;

-- -----------------------------------------------------------------------------------------

-- -----------------------+ vw_material_logistica  +-----------------------------------
drop view if exists api.vw_material_logistica;
create or replace view api.vw_material_logistica as
SELECT mat.id,cod, mat.descricao, qtd_stock,a.area,a2.nome as armazem,familia,prazo,
       data_importacao::date as data_importacao, p.nome as projecto,  a.id as id_area, a2.id as id_armazem, p.id as id_projecto
FROM api.material mat
    inner join api.area a on a.id = mat.area
     inner join api.projecto p on p.id = mat.projecto
     inner join api.armazem a2 on a2.id = mat.armazem

order by data_importacao desc ;

 grant select on api.vw_material_logistica to web_anon;
-- -----------------------------------------------------------------------------------------
-- -----------------------+ vw_material_by_id  +-----------------------------------
drop view if exists api.vw_material_by_id;
create or replace view api.vw_material_by_id as
SELECT mat.id,cod, mat.descricao, qtd_stock,a.area , a2.nome as armazem,familia,prazo, a.id as id_area,
       data_importacao::date as data_importacao
FROM api.material mat
    inner join api.area a on a.id = mat.area
inner join armazem a2 on a2.id = mat.armazem;

 grant select on api.vw_material_by_id to web_anon;
-- -----------------------------------------------------------------------------------------
-- -----------------------+ vw_unidades_sanitarias  +-----------------------------------
drop view if exists api.vw_unidades_sanitarias;
create or replace view api.vw_unidades_sanitarias as
SELECT us.id , us.nome,  d.distrito, us.distrito as id_distrito from unidade_sanitaria us inner join distrito d on d.id = us.distrito;


grant select on api.vw_unidades_sanitarias to web_anon;
-- -----------------------------------------------------------------------------------------
 -- -----------------------+ stored_procedure_login  +-----------------------------------
drop function if exists login_user(varchar, varchar);
create function login_user(username character varying, password character varying)
    returns TABLE(id bigint, user_name varchar, nome character varying, email character varying, contacto character varying, area character varying, role character varying)
    language plpgsql
as
$$
BEGIN
  -- Check if the username and password match
  IF EXISTS (
    SELECT 1 FROM usuario u
    WHERE u.username = login_user.username
    AND u.password = login_user.password
  ) THEN
    -- Fetch user information
    RETURN QUERY
    SELECT * from api.vw_authenticate v
      where v.username = login_user.username;
    END IF;

  -- If the login is unsuccessful, return NULL
  RETURN;
END;
$$;

alter function login_user(varchar, varchar) owner to sidmat;


GRANT EXECUTE ON FUNCTION login_user(varchar, varchar) TO web_anon;

-- -----------------------------------------------------------------------------------------
-- create a trigger on insert on requisicao that will update the stock of the material table

drop function if exists update_stock();
create or replace function update_stock()
    returns trigger
    language plpgsql
as $$
begin
    update api.material set qtd_stock = qtd_stock - new.quantidade where id = new.material;
    return new;
end; $$;

alter function update_stock() owner to sidmat;

create trigger update_stock after insert on requisicao for each row execute procedure update_stock();
GRANT EXECUTE ON FUNCTION update_stock() TO web_anon;

-- -----------------------------------------------------------------------------------------

-- -----------------------+ vw_my_requisicao  +-----------------------------------
-- create a view thal will show the requisicao of the user, the result must contain the folowing fields
-- id, data_requisicao, material, quantidade, unidade_sanitaria, pf_contacto, pf_nome, user as requisitante, notas, nr_guia
-- the view must be created in the api schema
-- the view must be created with the name vw_my_requisicao
drop view if exists api.vw_my_requisicao;
create or replace view api.vw_my_requisicao as
SELECT r.id, r.data_requisicao::date, m.descricao as material, r.quantidade, us.nome as unidade_sanitaria,
       r.pf_contacto, r.pf_nome, c.nome as requisitante, c.id as requisitante_id, r.nr_guia as id_guia ,gs.nr_guia as nr_guia,s.name as guia_status,  r.notas, a.area, r.canceled
FROM api.requisicao r
    inner join api.material m on m.id = r.material
    inner join api.unidade_sanitaria us on us.id = r.unidade_sanitaria
    inner join api.colaborador c on c.id = r.requisitante
    left join api.guia_saida gs on gs.id = r.nr_guia
    left join api.colaborador_area ca on ca.colaborador = c.id
    left join api.area a on a.id = ca.area
    left join api.status s on s.id = gs.status;
grant select on api.vw_my_requisicao to web_anon;
select  * from api.vw_my_requisicao where area = 'APSS';
-------------------------------------------------------------------------------------------------------------------------------
-- -----------------------+ vw_my_requisicao  +-----------------------------------
-- create a view thal will show the requisicao of the user, the result must contain the folowing fields
-- id, data_requisicao, material, quantidade, unidade_sanitaria, pf_contacto, pf_nome, user as requisitante, notas, nr_guia
-- the view must be created in the api schema
-- the view must be created with the name vw_my_requisicao
drop view if exists api.vw_my_area_requisicao;
create or replace view api.vw_my_area_requisicao as
SELECT r.id, r.data_requisicao::date, m.descricao as material, r.quantidade, us.nome as unidade_sanitaria,
       r.pf_contacto, r.pf_nome, c.nome as requisitante, c.id as requisitante_id, r.nr_guia as id_guia ,gs.nr_guia as nr_guia,s.name as guia_status,  r.notas, a.area, r.canceled
FROM api.requisicao r
    inner join api.material m on m.id = r.material
    inner join api.unidade_sanitaria us on us.id = r.unidade_sanitaria
    inner join api.colaborador c on c.id = r.requisitante
    left join api.guia_saida gs on gs.id = r.nr_guia
    left join api.colaborador_area ca on ca.colaborador = c.id
    left join api.area a on a.id = ca.area
    left join api.status s on s.id = gs.status;
grant select on api.vw_my_area_requisicao to web_anon;
select  * from api.vw_my_area_requisicao where area = 'APSS';
-- -----------------------------------------------------------------------------------------
-- -----------------------+ vw_requisicao_by_area      +-----------------------------------
-- create a view thal will show the total of  requisicao of the area, the result must contain the folowing fields
-- area, total_requisicao, total_unidade_sanitaria
-- the view must be created in the api schema
-- the view must be created with the name vw_requisicao_by_area
drop view if exists api.vw_requisicao_by_area;
create or replace view api.vw_requisicao_by_area as
SELECT   a.area , us.id as id_us, us.nome as unidade_sanitaria, count(*) as total_materiais ,'cardSuccess' as color
FROM api.requisicao r
    inner join api.material m on m.id = r.material
    inner join api.area a on a.id = m.area
inner join api.unidade_sanitaria  us on us.id = r.unidade_sanitaria
 where nr_guia is null  group by  a.area ,  us.nome , us.id
order by a.area;
grant select on api.vw_requisicao_by_area to web_anon;
-- -----------------------------------------------------------------------------------------
-- -----------------------+ vw_sumario_requisicoes_pendentes  +-----------------------------------
drop view if exists api.vw_sumario_requisicoes_pendentes;
create or replace view api.vw_sumario_requisicoes_pendentes as
SELECT a.id, a.area , count(r.id) as total_requisicao, count(distinct r.unidade_sanitaria) as total_unidade_sanitaria, 'cardSuccess' as color
FROM api.requisicao r
    inner join api.material m on m.id = r.material
    inner join api.area a on a.id = m.area
 where r.canceled='No' and nr_guia is null group by a.id,a.area;
grant select on api.vw_sumario_requisicoes_pendentes to web_anon;
-- -----------------------------------------------------------------------------------------
-- -----------------------+ vw_requisicoes_pendentes  +-----------------------------------
--  create a view to get all requisicoes that are not yet delivered
drop view if exists api.vw_requisicoes_pendentes;
create or replace view api.vw_requisicoes_pendentes as
SELECT   r.id as id_requisicao, r.data_requisicao::date, m.descricao as material_descricao, r.quantidade, a.area , us.id as id_us,
         us.nome as unidade_sanitaria,pf_nome,pf_contacto,  r.requisitante, c.nome as requisitante_nome, r.notas, p.nome as projecto, r.canceled
FROM api.requisicao r
    inner join api.material m on m.id = r.material
    inner join api.area a on a.id = m.area
    inner join api.unidade_sanitaria  us on us.id = r.unidade_sanitaria
    inner join api.colaborador c on r.requisitante = c.id
    inner join api.projecto p on p.id = m.projecto
where nr_guia is null;
grant select on api.vw_requisicoes_pendentes to web_anon;
-- -----------------------------------------------------------------------------------------

-------------------------------------------------------------------------------------------
-------------------------+ vw_material_solcitado_by_area_us      +-----------------------------------
-- create a view thal will show all material from requisicao the result must contain the folowing fields

/*
drop view if exists api.vw_material_solcitado_by_area_us;
create or replace view api.vw_material_solcitado_by_area_us as
SELECT   r.id as id_requisicao, m.descricao as material_descricao, r.quantidade, a.area , us.id as id_us,  us.nome as unidade_sanitaria,pf_contacto, pf_nome, r.notas, r.nr_guia, r.requisitante, c.nome as requisitante_nome, r.data_requisicao::date
FROM api.requisicao r
    inner join api.material m on m.id = r.material
    inner join api.area a on a.id = m.area
    inner join api.unidade_sanitaria  us on us.id = r.unidade_sanitaria
    inner join api.colaborador c on r.requisitante = c.id;
*/
drop view if exists api.vw_material_solcitado_by_area_us;
create or replace view api.vw_material_solcitado_by_area_us as
SELECT   r.id as id_requisicao, m.descricao as material_descricao, r.quantidade, a.area , us.id as id_us, pf_contacto, pf_nome,
         r.notas, c.nome as requisitante_nome, r.data_requisicao::date
FROM api.requisicao r
    inner join api.material m on m.id = r.material
    inner join api.area a on a.id = m.area
    inner join api.unidade_sanitaria  us on us.id = r.unidade_sanitaria
    inner join api.colaborador c on r.requisitante = c.id;
grant select on api.vw_material_solcitado_by_area_us to web_anon;
------------------------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------------
-------------------------+ vw_get_motoristas     +-----------------------------------
-- create a view thal will show all users with the role "motorista"
drop view if exists api.vw_get_motoristas;
create or replace view api.vw_get_motoristas as
SELECT c.id, u.username, c.nome,c.email,c.contacto  , r.name as role
      from usuario u inner join colaborador c on c.id = u.colaborador
      inner join user_role ur on ur.user_id = u.id
    inner join role r on ur.role_id = r.id
where r.name = 'Motorista';
grant select on api.vw_get_motoristas to web_anon;

-------------------------------------------------------------------------------------------
-------------------------+ sp_create_guia_saida     +-----------------------------------------------------
-- Create a stored procedure to create a guia de saida
-- the stored procedure must be created in the api schema
-- the stored procedure must be created with the name sp_create_guia_saida
-- the stored procedure must have the following parameters
-- id_motorista, unidade_sanitria, previsao_entrega, status, observacao,area, data_guia, nr_guia, id_requisicao array
-- the stored procedure must return the id of the guia de saida
drop function if exists api.sp_create_guia_saida( bigint,  bigint,  date,    varchar,  bigint,  varchar,  bigint[],varchar );
create or replace function  api.sp_create_guia_saida(
 id_motorista bigint,
 us bigint,
 entrega date,
 notas varchar,
 id_area bigint,
 numero_guia varchar,
 id_requisicao bigint[],
 projecto varchar)
 returns bigint
 language plpgsql
 as $$
declare
    id_guia bigint;
    current_year integer;
    guia_with_prefix text;
begin

    -- Retrieve the current year and store it in the variable
    SELECT EXTRACT(YEAR FROM CURRENT_DATE) INTO current_year;
     --   Concatenate the current year to the numero_guia
    guia_with_prefix :=  projecto || '-' ||  current_year || '-' || numero_guia::text;
     -- first check of nr_guia is unique ( note that nr guia is a varchar) if not return  not unique error.
         if exists(select 1 from api.guia_saida where nr_guia = guia_with_prefix) then
        raise exception 'nr_guia must be unique';
    end if;

    -- insert  guia_saida
    insert into api.guia_saida (motorista, unidade_sanitaria, previsao_entrega, status, observacao, area, data_guia, nr_guia)
    values (id_motorista, us, entrega, 1, notas, id_area, current_date, guia_with_prefix)
    returning id into id_guia;
    -- update all requisicao with the id_guia
    update api.requisicao set nr_guia = id_guia where id = any(id_requisicao);
    return id_guia;
end; $$;
alter function api.sp_create_guia_saida( bigint,  bigint,  date,    varchar,  bigint,  varchar,  bigint[], varchar) owner to sidmat;
grant execute on function api.sp_create_guia_saida(  bigint,  bigint,  date,    varchar,  bigint,  varchar,  bigint[], varchar) to web_anon;
------------------------------------------------------------------------------------------------------
-------------------------+ sp_confirmar_guia_saida     +-----------------------------------------------------
-- Create a stored procedure to update a guia de saida from status Nova (1) to Entregue (4)
-- the stored procedure must be created in the api schema
-- the stored procedure must be created with the name sp_confirmar_guia_saida
-- the stored procedure must have the following parameters
-- id_guia
-- the stored procedure must return the guia_nr of the guia de saida
drop function if exists api.sp_confirmar_guia_saida( bigint,bigint,bigint);
create or replace function  api.sp_confirmar_guia_saida(id_guia bigint, driver_id bigint, confirmed_by bigint)
 returns varchar
 language plpgsql
 as $$
declare
    guia_nr varchar;
begin
    -- update guia_saida
    update api.guia_saida set status = 4, data_entrega = current_date , motorista = driver_id, confirmedby =confirmed_by  where id = id_guia
    returning id into guia_nr;
    return guia_nr;
end; $$;

alter function api.sp_confirmar_guia_saida( bigint,bigint,bigint) owner to sidmat;
grant execute on function api.sp_confirmar_guia_saida( bigint,bigint,bigint) to web_anon;
------------------------------------------------------------------------------------------------------

-------------------------+ vw_guia_saida     +-----------------------------------------------------
-- create a view to list all guia de saida including all requisicoes beloging to the guia de saida
-- the view must be created in the api schema
-- the view must be created with the name vw_guias_saida
drop view if exists api.vw_guias_saida;
create or replace view api.vw_guias_saida as
SELECT gs.id, gs.nr_guia, gs.data_guia::date, s.name as status, gs.previsao_entrega::date, gs.observacao,
       c.nome as motorista, us.nome as unidade_sanitaria, a.area, gs.data_entrega::date
FROM api.guia_saida gs
    inner join api.colaborador c on c.id = gs.motorista
    inner join api.unidade_sanitaria us on us.id = gs.unidade_sanitaria
    inner join api.area a on a.id = gs.area
    inner join api.status s on s.id = gs.status;
grant select on api.vw_guias_saida to web_anon;
------------------------------------------------------------------------------------------------------
-------------------------+ vw_requisicao_by_guia     +-----------------------------------------------------
-- create a view to list all requisicoes beloging to a guia de saida
-- the view must be created in the api schema
-- the view must be created with the name vw_requisicao_by_guia
drop view if exists api.vw_requisicao_by_guia;
create or replace view api.vw_requisicao_by_guia as
SELECT r.id, r.data_requisicao::date, m.descricao as material, r.quantidade, us.nome as unidade_sanitaria,
       r.pf_contacto, r.pf_nome, c.nome as requisitante, a.area, gs.nr_guia ,  r.notas
FROM api.requisicao r
    inner join api.material m on m.id = r.material
    inner join api.unidade_sanitaria us on us.id = r.unidade_sanitaria
    inner join api.colaborador c on c.id = r.requisitante
    inner join api.area a on a.id = m.area
left join api.guia_saida gs on gs.id = r.nr_guia
where r.nr_guia is not null;
grant select on api.vw_requisicao_by_guia to web_anon;
------------------------------------------------------------------------------------------------------
-------------------------+ view_get_requisicoes_by_nr_guia   +-----------------------------------------------------
-- create a view  that returns all requisicoes beloging to a guia de saida. the input parameter
-- should be the nr_guia and contain  information from guia_saida table as well
--  the view must return the following fields id, data_requisicao, material, quantidade, unidade_sanitaria, pf_contacto, pf_nome, user as requisitante, notas, nr_guia, id_guia, motorista, previsao_entrega, status, observacao, area, data_guia, data_entrega
-- the view must be created with the name view_get_requisicoes_by_nr_guia
drop view if exists  api.view_get_requisicoes_by_nr_guia;
create or replace view  api.view_get_requisicoes_by_nr_guia as

    SELECT r.id, r.data_requisicao::date, m.descricao as material_descricao, r.quantidade, us.nome as unidade_sanitaria, 'BOM' as condicao,
       r.pf_contacto, r.pf_nome, c.nome as requisitante, r.notas, gs.nr_guia as nr_guia, gs.id as id_guia, col.nome as motorista, gs.previsao_entrega::date, s.name as status, gs.observacao, a.area, gs.data_guia::date, gs.data_entrega::date as data_entrega
FROM api.requisicao r
    inner join api.material m on m.id = r.material
    inner join api.unidade_sanitaria us on us.id = r.unidade_sanitaria
    inner join api.colaborador c on c.id = r.requisitante
    inner join api.area a on a.id = m.area
    inner join api.guia_saida gs on gs.id = r.nr_guia
    inner join api.colaborador col on col.id = gs.motorista
    inner join api.status s on s.id = gs.status;
grant select on api.view_get_requisicoes_by_nr_guia to web_anon;
------------------------------------------------------------------------------------------------------
-------------------------+ vw_requisicoes_by_month    +-----------------------------------------------------
-- create a view that returns total of requisicoes grouped by month and area: ex: january, february, march, etc
-- the view must be created with the name view_requisicoes_by_month
-- the month must be a name of the month
drop view if exists api.vw_requisicoes_by_month;
create or replace view api.vw_requisicoes_by_month as
SELECT a.area, extract( MONTH from r.data_requisicao) as mes,to_char(r.data_requisicao, 'Month') as mes_nome, count(*) as total_requisicao
FROM api.requisicao r
    inner join api.material m on m.id = r.material
    inner join api.area a on a.id = m.area
where date_part('year', r.data_requisicao) = date_part('year', current_date)
and r.canceled = 'No'
group by a.area, mes , mes_nome
order by a.area, mes asc;
grant select on api.vw_requisicoes_by_month to web_anon;

-----------------------------------------------------------------------------------------------------
-------------------------+ vw_all_requisicoes_by_month    +-----------------------------------------------------
-- create a view that returns total of requisicoes grouped by month and area: ex: january, february, march, etc
-- the view must be created with the name view_requisicoes_by_month
-- the month must be a name of the month
drop view if exists api.vw_all_requisicoes_by_month;
create or replace view api.vw_all_requisicoes_by_month as
SELECT  extract( MONTH from r.data_requisicao) as mes,to_char(r.data_requisicao, 'Month') as mes_nome, count(*) as total_requisicao
FROM api.requisicao r
    inner join api.material m on m.id = r.material
   -- inner join api.area a on a.id = m.area
where date_part('year', r.data_requisicao) = date_part('year', current_date)
and r.canceled = 'No'
group by  mes , mes_nome
order by  mes asc;
grant select on api.vw_all_requisicoes_by_month to web_anon;

------------------------------------------------------------------------------------------------------

-------------------------+ fn_requisicoes_by_distrito    +-----------------------------------------------------
-- using the above code as template, create a postgres stored procedure that receives the area as the parameter and returns the total number
-- of requisicoes by distrito for that area
drop function if exists  api.fn_requisicoes_por_distrito;
CREATE OR REPLACE FUNCTION api.fn_requisicoes_por_distrito(area_name varchar[])
RETURNS TABLE (distrito varchar, total_novas BIGINT, total_processadas BIGINT,total_completas  BIGINT , color text) AS $$
BEGIN
    RETURN QUERY
 select total_req.distrito, req_novas.total_requisicoes as total_novas,
       req_processadas.total_requisicoes as total_processadas,
       req_completas.total_requisicoes as total_completas , 'cardSuccess' as color from (
SELECT  d.distrito, count(*) as total_requisicoes
FROM api.requisicao r
    inner join api.material m on m.id = r.material
    inner join api.unidade_sanitaria us on us.id = r.unidade_sanitaria
    inner join api.colaborador c on c.id = r.requisitante
    inner join api.distrito d on d.id = us.distrito
    left join api.guia_saida gs on gs.id = r.nr_guia
    left join api.colaborador_area ca on ca.colaborador = c.id
    left join api.area a on a.id = ca.area
    left join api.status s on s.id = gs.status
    where  a.area =any(ARRAY[area_name]) and r.canceled = 'No'
    group by d.distrito )  as total_req
left join ( SELECT  d.distrito, count(*) as total_requisicoes
FROM api.requisicao r
    inner join api.material m on m.id = r.material
    inner join api.unidade_sanitaria us on us.id = r.unidade_sanitaria
    inner join api.colaborador c on c.id = r.requisitante
    inner join api.distrito d on d.id = us.distrito
    left join api.guia_saida gs on gs.id = r.nr_guia
    left join api.colaborador_area ca on ca.colaborador = c.id
    left join api.area a on a.id = ca.area
    left join api.status s on s.id = gs.status
    where gs.nr_guia is  null and a.area =any(ARRAY[area_name]) and r.canceled = 'No'
    group by d.distrito ) as req_novas on req_novas.distrito = total_req.distrito
left join (
SELECT  d.distrito, count(*) as total_requisicoes
FROM api.requisicao r
    inner join api.material m on m.id = r.material
    inner join api.unidade_sanitaria us on us.id = r.unidade_sanitaria
    inner join api.colaborador c on c.id = r.requisitante
    inner join api.distrito d on d.id = us.distrito
    left join api.guia_saida gs on gs.id = r.nr_guia
    left join api.colaborador_area ca on ca.colaborador = c.id
    left join api.area a on a.id = ca.area
    left join api.status s on s.id = gs.status
    where gs.nr_guia is not null and s.name ='NOVA' and a.area =any(ARRAY[area_name]) and r.canceled = 'No'
    group by d.distrito ) as req_processadas on req_processadas.distrito = total_req.distrito
left join (
SELECT  d.distrito, count(*) as total_requisicoes
FROM api.requisicao r
    inner join api.material m on m.id = r.material
    inner join api.unidade_sanitaria us on us.id = r.unidade_sanitaria
    inner join api.colaborador c on c.id = r.requisitante
    inner join api.distrito d on d.id = us.distrito
    left join api.guia_saida gs on gs.id = r.nr_guia
    left join api.colaborador_area ca on ca.colaborador = c.id
    left join api.area a on a.id = ca.area
    left join api.status s on s.id = gs.status
    where gs.nr_guia is not null and s.name ='ENTREGUE' and a.area =any(ARRAY[area_name]) and r.canceled = 'No'
    group by d.distrito ) as req_completas on req_completas.distrito = total_req.distrito;
END;
$$ LANGUAGE plpgsql;
grant execute on function api.fn_requisicoes_por_distrito(varchar[]) to web_anon;
select * from fn_requisicoes_por_distrito(ARRAY['APSS']);
----------------------------------------------------------------------
-------------------------+ vw_requisicoes_by_distrito    +-----------------------------------------------------
-- using the above code as template, create a view hat receives the area as the parameter and returns the total number
-- of requisicoes by distrito for that area
drop view if exists api.vw_requisicoes_by_distrito;
CREATE OR REPLACE view api.vw_requisicoes_by_distrito as
    select req_novas.distrito, req_novas.total_requisicoes as total_novas,
       req_processadas.total_requisicoes as total_processadas,
       req_completas.total_requisicoes as total_completas , 'cardSuccess' as color from (
SELECT  d.distrito, count(*) as total_requisicoes
FROM api.requisicao r
    inner join api.material m on m.id = r.material
    inner join api.unidade_sanitaria us on us.id = r.unidade_sanitaria
    inner join api.colaborador c on c.id = r.requisitante
    inner join api.distrito d on d.id = us.distrito
    left join api.guia_saida gs on gs.id = r.nr_guia
    left join api.colaborador_area ca on ca.colaborador = c.id
    left join api.area a on a.id = ca.area
    left join api.status s on s.id = gs.status
    where gs.nr_guia is  null and r.canceled = 'No'
    group by d.distrito ) as req_novas

left join (
SELECT  d.distrito, count(*) as total_requisicoes
FROM api.requisicao r
    inner join api.material m on m.id = r.material
    inner join api.unidade_sanitaria us on us.id = r.unidade_sanitaria
    inner join api.colaborador c on c.id = r.requisitante
    inner join api.distrito d on d.id = us.distrito
    left join api.guia_saida gs on gs.id = r.nr_guia
    left join api.colaborador_area ca on ca.colaborador = c.id
    left join api.area a on a.id = ca.area
    left join api.status s on s.id = gs.status
    where gs.nr_guia is not null and s.name ='NOVA' and r.canceled = 'No'
    group by d.distrito ) as req_processadas on req_processadas.distrito = req_novas.distrito
left join (
SELECT  d.distrito, count(*) as total_requisicoes
FROM api.requisicao r
    inner join api.material m on m.id = r.material
    inner join api.unidade_sanitaria us on us.id = r.unidade_sanitaria
    inner join api.colaborador c on c.id = r.requisitante
    inner join api.distrito d on d.id = us.distrito
    left join api.guia_saida gs on gs.id = r.nr_guia
    left join api.colaborador_area ca on ca.colaborador = c.id
    left join api.area a on a.id = ca.area
    left join api.status s on s.id = gs.status
    where gs.nr_guia is not null and s.name ='ENTREGUE' and r.canceled = 'No'
    group by d.distrito ) as req_completas on req_completas.distrito = req_novas.distrito;

grant select on  api.vw_requisicoes_by_distrito to web_anon;
select * from vw_requisicoes_by_distrito;
----------------------------------------------------------------------

-------------------------------------------------------------------------------------------
-------------------------+ sp_insert_area    +-----------------------------------------------------
-- Create a stored procedure to insert a new area into the area table, the stored procedure must check
-- if the area already exists, if it does, it must return an error message.
-- the stored procedure must be created in the api schema
-- the stored procedure must be created with the name sp_insert_area
-- the stored procedure must have the following parameters: area
-- the stored procedure must return the name of the area
drop function if exists api.sp_insert_area(varchar);
create or replace function api.sp_insert_area(name_area varchar)
 returns varchar
 language plpgsql
 as $$
declare
    area_name varchar;
begin
    -- first check if area already exists
    if exists(select 1 from api.area a where a.area = name_area) then
        raise exception 'area already exists';
    end if;
    -- insert area
    insert into api.area (area) values (name_area) returning area into area_name;
    return area_name;
end; $$;

alter function api.sp_insert_area(varchar) owner to sidmat;
grant execute on function api.sp_insert_area(varchar) to web_anon;
------------------------------------------------------------------------------------------------------

-------------------------+ sp_insert_projecto   +-----------------------------------------------------
-- Create a stored procedure to insert a new projecto into the projecto table, the stored procedure must check
-- if the area already exists, if it does, it must return an error message.
-- the stored procedure must be created in the api schema
-- the stored procedure must be created with the name sp_insert_projecto
-- the stored procedure must have the following parameters: nome_projecto, descricao_projecto
-- the stored procedure must return the id
drop function if exists api.sp_insert_projecto(varchar, varchar);
create or replace function api.sp_insert_projecto(nome_projecto varchar, descricao_projecto varchar)
 returns bigint
 language plpgsql
 as $$
declare
    id_projecto bigint;
begin
    -- first check if projecto already exists
    if exists(select 1 from api.projecto p where p.nome = nome_projecto) then
        raise exception 'projecto already exists';
    end if;
    -- insert projecto
    insert into api.projecto (nome, descricao) values (nome_projecto, descricao_projecto) returning id into id_projecto;
    return id_projecto;
end; $$;

alter function api.sp_insert_projecto(varchar, varchar) owner to sidmat;
grant execute on function api.sp_insert_projecto(varchar, varchar) to web_anon;
------------------------------------------------------------------------------------------------------
-------------------------+ sp_insert_armazem   +-----------------------------------------------------
-- Create a stored procedure to insert a new armazem into the armazem table, the stored procedure must check
-- if the armazem already exists, if it does, it must return an error message.
-- the stored procedure must be created in the api schema
-- the stored procedure must be created with the name sp_insert_armazem
-- the stored procedure must have the following parameters: nome_armazem, cod_armazem
-- the stored procedure must return the id
drop function if exists api.sp_insert_armazem(varchar, varchar);
create or replace function api.sp_insert_armazem(nome_armazem varchar, cod_armazem varchar)
 returns bigint
 language plpgsql
 as $$
declare
    id_armazem bigint;
begin
    -- first check if armazem already exists
    if exists(select 1 from api.armazem a where a.nome = nome_armazem) then
        raise exception 'armazem already exists';
    end if;
    -- insert armazem
    insert into api.armazem (nome, cod) values (nome_armazem, cod_armazem) returning id into id_armazem;
    return id_armazem;
end; $$;

alter function api.sp_insert_armazem(varchar, varchar) owner to sidmat;
grant execute on function api.sp_insert_armazem(varchar, varchar) to web_anon;
------------------------------------------------------------------------------------------------------
-------------------------+ sp_insert_colaborador   +-----------------------------------------------------
-- Create a stored procedure to insert a new colaborador into the colaborador table, the stored procedure must check
-- if the colaborador already exists, if it does, it must return an error message. The stored procedure must also insert the area of the colaborador in the colaborador_area table
-- as well as a user for that colaborador in the usuario table and a role in the user_role table
-- the stored procedure must have the following parameters: nome, email, contacto, area, role, username, password
-- the stored procedure must return the id
drop function if exists api.sp_insert_colaborador(varchar, varchar, varchar, varchar, bigint, bigint, varchar, varchar);
create or replace function api.sp_insert_colaborador(nome_colaborador varchar, emailaddress varchar, contacto_colaborador varchar,
funcao_colaborador varchar, id_area bigint, id_role bigint, user_name varchar, pass varchar)
 returns bigint
 language plpgsql
 as $$
declare
    id_colaborador bigint;
    id_usuario bigint;
begin
    -- first check if colaborador already exists
    if exists(select 1 from api.colaborador c where c.email = emailaddress) then
        raise exception 'colaborador already exists';
    end if;
    -- insert colaborador
    insert into api.colaborador (nome, email, contacto,funcao) values (nome_colaborador, emailaddress, contacto_colaborador,funcao_colaborador) returning id into id_colaborador;
    -- insert colaborador_area
    insert into api.colaborador_area (colaborador, area) values (id_colaborador, id_area);
    -- insert usuario
    insert into api.usuario (username, password, colaborador) values (user_name, pass, id_colaborador) returning id into id_usuario;
    -- insert user_role
    insert into api.user_role (user_id, role_id) values (id_usuario, id_role);
    return id_colaborador;
end; $$;

alter function api.sp_insert_colaborador(varchar, varchar, varchar, varchar, bigint, bigint, varchar, varchar) owner to sidmat;
grant execute on function api.sp_insert_colaborador(varchar, varchar, varchar, varchar, bigint, bigint, varchar, varchar) to web_anon;
------------------------------------------------------------------------------------------------------
-------------------------+ vw_all_colaboradores   +-----------------------------------------------------
-- create a view that returns all colaboradores including the area and role
-- the view must be created with the name vw_all_colaboradores
drop view if exists api.vw_all_colaboradores;
create or replace view api.vw_all_colaboradores as
SELECT distinct c.id, c.nome, c.email, c.contacto, c.funcao,a.id as id_area, a.area,r.id as id_role,  r.name as role, u.status
FROM api.colaborador c
    inner join api.colaborador_area ca on ca.colaborador = c.id
    inner join api.area a on a.id = ca.area
    inner join api.usuario u on u.colaborador = c.id
    left join api.user_role ur on ur.user_id = u.id
    left join api.role r on r.id = ur.role_id
order by c.id desc;

grant select on api.vw_all_colaboradores to web_anon;
------------------------------------------------------------------------------------------------------
-------------------------+ sp_update_usuario_status   +-----------------------------------------------------
-- Create a stored procedure to update the status of a user
-- the stored procedure must be created in the api schema
-- the stored procedure must be created with the name sp_update_usuario_status
-- the stored procedure must have the following parameters: id_usuario, status
-- the stored procedure must return the id of the usuario
drop function if exists api.sp_update_usuario_status(bigint, varchar);
create or replace function api.sp_update_usuario_status(id_usuario bigint, user_status varchar)
 returns text
 language plpgsql
 as $$
declare
    user_id bigint;
begin
    -- update usuario
    update api.usuario set status = user_status where colaborador = id_usuario returning id into user_id;
    return 'Actualizado com sucesso';
end; $$;

alter function api.sp_update_usuario_status(bigint, varchar) owner to sidmat;
grant execute on function api.sp_update_usuario_status(bigint, varchar) to web_anon;
------------------------------------------------------------------------------------------------------
-------------------------+ sp_insert_area   +-----------------------------------------------------
-- Create a stored procedure to insert a new area into the area table, the stored procedure must check
-- if the area already exists, if it does, it must return an error message.
-- the stored procedure must be created in the api schema
-- the stored procedure must be created with the name sp_insert_area
-- the stored procedure must have the following parameters: area
-- the stored procedure must return the name of the area
drop function if exists api.sp_insert_area(varchar, varchar);
create or replace function api.sp_insert_area(name_area varchar, descricao_area varchar)
 returns bigint
 language plpgsql
 as $$
declare
    id_area varchar;
begin
    -- first check if area already exists
    if exists(select 1 from api.area a where a.area = name_area) then
        raise exception 'area already exists';
    end if;
    -- insert area
    insert into api.area (area, descricao) values (name_area ,  descricao_area  ) returning id into id_area;
    return id_area;
end; $$;
alter function api.sp_insert_area(varchar, varchar) owner to sidmat;
grant execute on function api.sp_insert_area(varchar, varchar) to web_anon;
------------------------------------------------------------------------------------------------------

-------------------------+ sp_update_area_status   +-----------------------------------------------------
-- Create a stored procedure to update the status of an area
-- the stored procedure must be created in the api schema
-- the stored procedure must be created with the name sp_update_area_status
-- the stored procedure must have the following parameters: id_area, status
-- the stored procedure must return the id of the area
drop function if exists api.sp_update_area_status(bigint, varchar);
create or replace function api.sp_update_area_status(id_area bigint, area_status varchar)
 returns text
 language plpgsql
 as $$
declare
    area_id bigint;
begin
    -- update area
    update api.area set status = area_status where id = id_area returning id into area_id;
    return 'Actualizado com sucesso';
end; $$;

alter function api.sp_update_area_status(bigint, varchar) owner to sidmat;
grant execute on function api.sp_update_area_status(bigint, varchar) to web_anon;
------------------------------------------------------------------------------------------------------
-------------------------+ sp_update_projecto_status   +-----------------------------------------------------
-- Create a stored procedure to update the status of a projecto
-- the stored procedure must be created in the api schema
-- the stored procedure must be created with the name sp_update_projecto_status
-- the stored procedure must have the following parameters: id_projecto, status
-- the stored procedure must return the id of the projecto
drop function if exists api.sp_update_projecto_status(bigint, varchar);
create or replace function api.sp_update_projecto_status(id_projecto bigint, projecto_status varchar)
 returns text
 language plpgsql
 as $$
declare
    projecto_id bigint;
begin
    -- update area
    update api.projecto set status = projecto_status where id = id_projecto returning id into projecto_id;
    return 'Actualizado com sucesso';
end; $$;

alter function api.sp_update_projecto_status(bigint, varchar) owner to sidmat;
grant execute on function api.sp_update_projecto_status(bigint, varchar) to web_anon;


-------------------------+ sp_update_area   +-----------------------------------------------------
-- Create a stored procedure to update the  area
-- the stored procedure must be created in the api schema
-- the stored procedure must be created with the name sp_update_area
-- the stored procedure must have the following parameters: id_area, area, desc
-- the stored procedure must return the id of the area
drop function if exists api.sp_update_area(bigint, varchar);
create or replace function api.sp_update_area(id_area bigint, area_name varchar, area_descricao varchar)
 returns text
 language plpgsql
 as $$
declare
   area_id bigint;er_id bigint;
begin
    -- update area
    update api.area set area= area_name, descricao = area_descricao where id = id_area returning id into area_id;
    return 'Actualizado com sucesso';
end; $$;

alter function api.sp_update_area(bigint, varchar, varchar) owner to sidmat;
grant execute on function api.sp_update_area(bigint, varchar,varchar) to web_anon;
-- ----------------------------------------------------------------------------------------------------------------
-- create a view to select newly inserted material (notification_status ='P") including the area name as well as the colaborador_area information
-- the view must be created with the name vw_novo_material ;

drop view if exists api.vw_novo_material;
create or replace view api.vw_novo_material as
select m.id, m.descricao, m.qtd_stock, a.area, m.data_importacao::date, m.notification_status
    from api.material m inner join api.area a on a.id = m.area
where  notification_status = 'P';
grant select on api.vw_novo_material to web_anon;
----------------------------------------------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------------------------------------------
-- create a view to select newly confirmed guia (status = 4 and notification_status ='P") including the area name as well as user who confirmed delivery
-- the view must be created with the name vw_confirmacao_guia
drop view if exists api.vw_confirmacao_guia;
create or replace view api.vw_confirmacao_guia as
select gs.id, gs.nr_guia, gs.data_guia::date, s.name as status, gs.previsao_entrega::date, gs.observacao,
       colab_motorista.nome as motorista, us.nome as unidade_sanitaria, a.area, gs.data_entrega::date, colab_confirmed.nome as confirmed_by
from api.guia_saida gs
    inner join api.colaborador colab_motorista on colab_motorista.id = gs.motorista
    inner join api.unidade_sanitaria us on us.id = gs.unidade_sanitaria
    inner join api.area a on a.id = gs.area
    inner join api.status s on s.id = gs.status
    inner join api.colaborador colab_confirmed  on colab_confirmed.id = gs.confirmedby
where gs.status = 4 and gs.notification_status = 'P';
grant select on api.vw_confirmacao_guia to web_anon;
-------------------------------------------------------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------------------------------------------------------

--------------------+ sp_update_material   +-----------------------------------------------------
-- Create a stored procedure to update the  material
-- the stored procedure must be created in the api schema
-- the stored procedure must be created with the name sp_update_material
-- the stored procedure must have the following parameters: id_material, material, desc
-- the stored procedure must return the id of the material
drop function if exists api.sp_update_material(bigint, varchar,bigint);
create or replace function api.sp_update_material(id_material bigint,  material_nome varchar, quantidade bigint)
 returns text
 language plpgsql
 as $$
declare
   material_id bigint;
begin
    -- update material
    update api.material set descricao= material_nome, qtd_stock = quantidade where id = id_material returning id into material_id;
    return 'Actualizado com sucesso';
end; $$;

alter function api.sp_update_material(bigint, varchar, bigint) owner to sidmat;
grant execute on function api.sp_update_material(bigint, varchar,bigint) to web_anon;
-- ----------------------------------------------------------------------------------------------------------------

----------------------------------------------------------------------------------------------------------------------------------------
-- create the api.fn_update_date_cancelled() function
drop function if exists api.fn_update_date_cancelled();
create or replace function api.fn_update_date_cancelled()
 returns trigger
 language plpgsql
 as $$
begin
    -- if canceled is ''Yes then update date_cancelled to current date and increment the qtd_stock of the material
    -- based on the quantidade of the requisicao
    if new.canceled = 'Yes' then
        update api.requisicao set date_cancelled = current_date where id = new.id;
        update api.material set qtd_stock = qtd_stock + new.quantidade where id = new.material;
    end if;
    return new;

end; $$;

alter function api.fn_update_date_cancelled() owner to sidmat;
grant execute on function api.fn_update_date_cancelled() to web_anon;
-------------------------------------------------------------------------------------------------------------------
-----------------------
-- create a trigger function to update the date_cancelled  of requisicao to the current date whenever canceled column is set to 'Yes'
-- the trigger funcition must be called every time canceled column   is updated using the api.fn_update_date_cancelled() function
drop trigger if exists trg_update_date_cancelled on api.requisicao ;
create trigger trg_update_date_cancelled
after update of canceled on api.requisicao
for each row
execute procedure api.fn_update_date_cancelled();

-------------------------------------------------------------------------------------------------------------------
