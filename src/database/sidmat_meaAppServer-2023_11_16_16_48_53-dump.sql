--
-- PostgreSQL database dump
--

-- Dumped from database version 13.12 (Debian 13.12-1.pgdg120+1)
-- Dumped by pg_dump version 13.12

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: api; Type: SCHEMA; Schema: -; Owner: sidmat
--

CREATE SCHEMA api;


ALTER SCHEMA api OWNER TO sidmat;

--
-- Name: fn_requisicoes_por_distrito(character varying); Type: FUNCTION; Schema: api; Owner: sidmat
--

CREATE FUNCTION api.fn_requisicoes_por_distrito(area_name character varying) RETURNS TABLE(distrito character varying, total_novas bigint, total_processadas bigint, total_completas bigint, color text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
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
    where gs.nr_guia is  null and a.area = area_name
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
    where gs.nr_guia is not null and s.name ='NOVA' and a.area = area_name
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
    where gs.nr_guia is not null and s.name ='ENTREGUE' and a.area = area_name
    group by d.distrito ) as req_completas on req_completas.distrito = req_novas.distrito;
END;
$$;


ALTER FUNCTION api.fn_requisicoes_por_distrito(area_name character varying) OWNER TO sidmat;

--
-- Name: fn_update_date_cancelled(); Type: FUNCTION; Schema: api; Owner: sidmat
--

CREATE FUNCTION api.fn_update_date_cancelled() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    -- if canceled is ''Yes then update date_cancelled to current date and increment the qtd_stock of the material
    -- based on the quantidade of the requisicao
    if new.canceled = 'Yes' then
        update api.requisicao set date_cancelled = current_date where id = new.id;
        update api.material set qtd_stock = qtd_stock + new.quantidade where id = new.material;
    end if;
    return new;

end; $$;


ALTER FUNCTION api.fn_update_date_cancelled() OWNER TO sidmat;

--
-- Name: login_user(character varying, character varying); Type: FUNCTION; Schema: api; Owner: sidmat
--

CREATE FUNCTION api.login_user(username character varying, password character varying) RETURNS TABLE(id bigint, user_name character varying, nome character varying, email character varying, contacto character varying, area character varying, role character varying)
    LANGUAGE plpgsql
    AS $$
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


ALTER FUNCTION api.login_user(username character varying, password character varying) OWNER TO sidmat;

--
-- Name: sp_confirmar_guia_saida(bigint, bigint, bigint); Type: FUNCTION; Schema: api; Owner: sidmat
--

CREATE FUNCTION api.sp_confirmar_guia_saida(id_guia bigint, driver_id bigint, confirmed_by bigint) RETURNS character varying
    LANGUAGE plpgsql
    AS $$
declare
    guia_nr varchar;
begin
    -- update guia_saida
    update api.guia_saida set status = 4, data_entrega = current_date , motorista = driver_id, confirmedby =confirmed_by  where id = id_guia
    returning id into guia_nr;
    return guia_nr;
end; $$;


ALTER FUNCTION api.sp_confirmar_guia_saida(id_guia bigint, driver_id bigint, confirmed_by bigint) OWNER TO sidmat;

--
-- Name: sp_create_guia_saida(bigint, bigint, date, character varying, bigint, character varying, bigint[], character varying); Type: FUNCTION; Schema: api; Owner: sidmat
--

CREATE FUNCTION api.sp_create_guia_saida(id_motorista bigint, us bigint, entrega date, notas character varying, id_area bigint, numero_guia character varying, id_requisicao bigint[], projecto character varying) RETURNS bigint
    LANGUAGE plpgsql
    AS $$
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


ALTER FUNCTION api.sp_create_guia_saida(id_motorista bigint, us bigint, entrega date, notas character varying, id_area bigint, numero_guia character varying, id_requisicao bigint[], projecto character varying) OWNER TO sidmat;

--
-- Name: sp_insert_area(character varying, character varying); Type: FUNCTION; Schema: api; Owner: sidmat
--

CREATE FUNCTION api.sp_insert_area(name_area character varying, descricao_area character varying) RETURNS bigint
    LANGUAGE plpgsql
    AS $$
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


ALTER FUNCTION api.sp_insert_area(name_area character varying, descricao_area character varying) OWNER TO sidmat;

--
-- Name: sp_insert_armazem(character varying, character varying); Type: FUNCTION; Schema: api; Owner: sidmat
--

CREATE FUNCTION api.sp_insert_armazem(nome_armazem character varying, cod_armazem character varying) RETURNS bigint
    LANGUAGE plpgsql
    AS $$
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


ALTER FUNCTION api.sp_insert_armazem(nome_armazem character varying, cod_armazem character varying) OWNER TO sidmat;

--
-- Name: sp_insert_colaborador(character varying, character varying, character varying, character varying, bigint, bigint, character varying, character varying); Type: FUNCTION; Schema: api; Owner: sidmat
--

CREATE FUNCTION api.sp_insert_colaborador(nome_colaborador character varying, emailaddress character varying, contacto_colaborador character varying, funcao_colaborador character varying, id_area bigint, id_role bigint, user_name character varying, pass character varying) RETURNS bigint
    LANGUAGE plpgsql
    AS $$
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


ALTER FUNCTION api.sp_insert_colaborador(nome_colaborador character varying, emailaddress character varying, contacto_colaborador character varying, funcao_colaborador character varying, id_area bigint, id_role bigint, user_name character varying, pass character varying) OWNER TO sidmat;

--
-- Name: sp_insert_onedrive_image(character varying, character varying, character varying, character varying); Type: FUNCTION; Schema: api; Owner: sidmat
--

CREATE FUNCTION api.sp_insert_onedrive_image(nr_guiasaida character varying, id_image character varying, image_name character varying, image_viewlink character varying) RETURNS character varying
    LANGUAGE plpgsql
    AS $$
declare
    id_newimage bigint;
begin
    -- insert onedrive_image
    insert into api.onedrive_image (drive_id, name, web_view_link) values (id_image, image_name, image_viewlink) returning id into id_newimage;
    -- update guia_saida with the new created id on onedrive_image
    update api.guia_saida set foto_id = id_newimage where nr_guia = nr_guiasaida;
    return image_viewlink;
end; $$;


ALTER FUNCTION api.sp_insert_onedrive_image(nr_guiasaida character varying, id_image character varying, image_name character varying, image_viewlink character varying) OWNER TO sidmat;

--
-- Name: sp_insert_projecto(character varying, character varying); Type: FUNCTION; Schema: api; Owner: sidmat
--

CREATE FUNCTION api.sp_insert_projecto(nome_projecto character varying, descricao_projecto character varying) RETURNS bigint
    LANGUAGE plpgsql
    AS $$
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


ALTER FUNCTION api.sp_insert_projecto(nome_projecto character varying, descricao_projecto character varying) OWNER TO sidmat;

--
-- Name: sp_update_area(bigint, character varying, character varying); Type: FUNCTION; Schema: api; Owner: sidmat
--

CREATE FUNCTION api.sp_update_area(id_area bigint, area_name character varying, area_descricao character varying) RETURNS text
    LANGUAGE plpgsql
    AS $$
declare
   area_id bigint;er_id bigint;
begin
    -- update area
    update api.area set area= area_name, descricao = area_descricao where id = id_area returning id into area_id;
    return 'Actualizado com sucesso';
end; $$;


ALTER FUNCTION api.sp_update_area(id_area bigint, area_name character varying, area_descricao character varying) OWNER TO sidmat;

--
-- Name: sp_update_area_status(bigint, character varying); Type: FUNCTION; Schema: api; Owner: sidmat
--

CREATE FUNCTION api.sp_update_area_status(id_area bigint, area_status character varying) RETURNS text
    LANGUAGE plpgsql
    AS $$
declare
    user_id bigint;
begin
    -- update area
    update api.area set status = area_status where id = id_area returning id into user_id;
    return 'Actualizado com sucesso';
end; $$;


ALTER FUNCTION api.sp_update_area_status(id_area bigint, area_status character varying) OWNER TO sidmat;

--
-- Name: sp_update_material(bigint, character varying, bigint); Type: FUNCTION; Schema: api; Owner: sidmat
--

CREATE FUNCTION api.sp_update_material(id_material bigint, material_nome character varying, quantidade bigint) RETURNS text
    LANGUAGE plpgsql
    AS $$
declare
   material_id bigint;
begin
    -- update material
    update api.material set descricao= material_nome, qtd_stock = quantidade where id = id_material returning id into material_id;
    return 'Actualizado com sucesso';
end; $$;


ALTER FUNCTION api.sp_update_material(id_material bigint, material_nome character varying, quantidade bigint) OWNER TO sidmat;

--
-- Name: sp_update_projecto_status(bigint, character varying); Type: FUNCTION; Schema: api; Owner: sidmat
--

CREATE FUNCTION api.sp_update_projecto_status(id_projecto bigint, projecto_status character varying) RETURNS text
    LANGUAGE plpgsql
    AS $$
declare
    projecto_id bigint;
begin
    -- update area
    update api.projecto set status = projecto_status where id = id_projecto returning id into projecto_id;
    return 'Actualizado com sucesso';
end; $$;


ALTER FUNCTION api.sp_update_projecto_status(id_projecto bigint, projecto_status character varying) OWNER TO sidmat;

--
-- Name: sp_update_usuario_status(bigint, character varying); Type: FUNCTION; Schema: api; Owner: sidmat
--

CREATE FUNCTION api.sp_update_usuario_status(id_usuario bigint, user_status character varying) RETURNS text
    LANGUAGE plpgsql
    AS $$
declare
    user_id bigint;
begin
    -- update usuario
    update api.usuario set status = user_status where colaborador = id_usuario returning id into user_id;
    return 'Actualizado com sucesso';
end; $$;


ALTER FUNCTION api.sp_update_usuario_status(id_usuario bigint, user_status character varying) OWNER TO sidmat;

--
-- Name: update_stock(); Type: FUNCTION; Schema: api; Owner: sidmat
--

CREATE FUNCTION api.update_stock() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    update api.material set qtd_stock = qtd_stock - new.quantidade where id = new.material;
    return new;
end; $$;


ALTER FUNCTION api.update_stock() OWNER TO sidmat;

--
-- Name: are_id_seq; Type: SEQUENCE; Schema: api; Owner: sidmat
--

CREATE SEQUENCE api.are_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE api.are_id_seq OWNER TO sidmat;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: area; Type: TABLE; Schema: api; Owner: sidmat
--

CREATE TABLE api.area (
    id bigint DEFAULT nextval('api.are_id_seq'::regclass) NOT NULL,
    area character varying,
    descricao character varying(255),
    status character varying(255) DEFAULT 'Active'::character varying
);


ALTER TABLE api.area OWNER TO sidmat;

--
-- Name: armazem_id_seq; Type: SEQUENCE; Schema: api; Owner: sidmat
--

CREATE SEQUENCE api.armazem_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE api.armazem_id_seq OWNER TO sidmat;

--
-- Name: armazem; Type: TABLE; Schema: api; Owner: sidmat
--

CREATE TABLE api.armazem (
    nome character varying,
    id bigint DEFAULT nextval('api.armazem_id_seq'::regclass) NOT NULL,
    cod_armazem integer
);


ALTER TABLE api.armazem OWNER TO sidmat;

--
-- Name: colab_area_id_seq; Type: SEQUENCE; Schema: api; Owner: sidmat
--

CREATE SEQUENCE api.colab_area_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE api.colab_area_id_seq OWNER TO sidmat;

--
-- Name: usuario_id_seq; Type: SEQUENCE; Schema: api; Owner: sidmat
--

CREATE SEQUENCE api.usuario_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE api.usuario_id_seq OWNER TO sidmat;

--
-- Name: colaborador; Type: TABLE; Schema: api; Owner: sidmat
--

CREATE TABLE api.colaborador (
    id bigint DEFAULT nextval('api.usuario_id_seq'::regclass) NOT NULL,
    nome character varying,
    contacto character varying,
    email character varying,
    funcao character varying
);


ALTER TABLE api.colaborador OWNER TO sidmat;

--
-- Name: colaborador_area; Type: TABLE; Schema: api; Owner: sidmat
--

CREATE TABLE api.colaborador_area (
    id bigint DEFAULT nextval('api.colab_area_id_seq'::regclass) NOT NULL,
    area bigint,
    colaborador bigint
);


ALTER TABLE api.colaborador_area OWNER TO sidmat;

--
-- Name: colaborador_id_seq; Type: SEQUENCE; Schema: api; Owner: sidmat
--

CREATE SEQUENCE api.colaborador_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE api.colaborador_id_seq OWNER TO sidmat;

--
-- Name: colaborador_role_id_seq; Type: SEQUENCE; Schema: api; Owner: sidmat
--

CREATE SEQUENCE api.colaborador_role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE api.colaborador_role_id_seq OWNER TO sidmat;

--
-- Name: distrito_id_seq; Type: SEQUENCE; Schema: api; Owner: sidmat
--

CREATE SEQUENCE api.distrito_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE api.distrito_id_seq OWNER TO sidmat;

--
-- Name: distrito; Type: TABLE; Schema: api; Owner: sidmat
--

CREATE TABLE api.distrito (
    id bigint DEFAULT nextval('api.distrito_id_seq'::regclass) NOT NULL,
    distrito character varying
);


ALTER TABLE api.distrito OWNER TO sidmat;

--
-- Name: guia_saida_id_seq; Type: SEQUENCE; Schema: api; Owner: sidmat
--

CREATE SEQUENCE api.guia_saida_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE api.guia_saida_id_seq OWNER TO sidmat;

--
-- Name: guia_saida; Type: TABLE; Schema: api; Owner: sidmat
--

CREATE TABLE api.guia_saida (
    motorista integer,
    unidade_sanitaria integer,
    previsao_entrega date,
    status integer,
    observacao text,
    id bigint DEFAULT nextval('api.guia_saida_id_seq'::regclass) NOT NULL,
    area integer,
    data_guia date,
    nr_guia character varying NOT NULL,
    foto_id bigint,
    data_entrega date,
    createdby bigint,
    confirmedby bigint,
    notification_status character(1) DEFAULT 'P'::bpchar NOT NULL
);


ALTER TABLE api.guia_saida OWNER TO sidmat;

--
-- Name: material_id_seq; Type: SEQUENCE; Schema: api; Owner: sidmat
--

CREATE SEQUENCE api.material_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE api.material_id_seq OWNER TO sidmat;

--
-- Name: material; Type: TABLE; Schema: api; Owner: sidmat
--

CREATE TABLE api.material (
    id bigint DEFAULT nextval('api.material_id_seq'::regclass) NOT NULL,
    projecto integer,
    armazem integer,
    familia character varying,
    cod character varying,
    descricao text,
    qtd_stock integer,
    area integer,
    prazo character varying,
    data_importacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    notification_status character(1) DEFAULT 'P'::bpchar
);


ALTER TABLE api.material OWNER TO sidmat;

--
-- Name: onedrive_image_id_seq; Type: SEQUENCE; Schema: api; Owner: sidmat
--

CREATE SEQUENCE api.onedrive_image_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE api.onedrive_image_id_seq OWNER TO sidmat;

--
-- Name: onedrive_image; Type: TABLE; Schema: api; Owner: sidmat
--

CREATE TABLE api.onedrive_image (
    id bigint DEFAULT nextval('api.onedrive_image_id_seq'::regclass) NOT NULL,
    drive_id character varying,
    name character varying,
    web_view_link text
);


ALTER TABLE api.onedrive_image OWNER TO sidmat;

--
-- Name: projecto_image_id_seq; Type: SEQUENCE; Schema: api; Owner: sidmat
--

CREATE SEQUENCE api.projecto_image_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE api.projecto_image_id_seq OWNER TO sidmat;

--
-- Name: projecto; Type: TABLE; Schema: api; Owner: sidmat
--

CREATE TABLE api.projecto (
    id bigint DEFAULT nextval('api.projecto_image_id_seq'::regclass) NOT NULL,
    nome character varying,
    descricao character varying,
    status character varying DEFAULT 'Active'::character varying
);


ALTER TABLE api.projecto OWNER TO sidmat;

--
-- Name: projecto_id_seq; Type: SEQUENCE; Schema: api; Owner: sidmat
--

CREATE SEQUENCE api.projecto_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE api.projecto_id_seq OWNER TO sidmat;

--
-- Name: requisicao_id_seq; Type: SEQUENCE; Schema: api; Owner: sidmat
--

CREATE SEQUENCE api.requisicao_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE api.requisicao_id_seq OWNER TO sidmat;

--
-- Name: requisicao; Type: TABLE; Schema: api; Owner: sidmat
--

CREATE TABLE api.requisicao (
    id bigint DEFAULT nextval('api.requisicao_id_seq'::regclass) NOT NULL,
    material integer NOT NULL,
    quantidade integer,
    unidade_sanitaria integer NOT NULL,
    pf_contacto character varying,
    pf_nome character varying NOT NULL,
    requisitante integer NOT NULL,
    nr_guia integer,
    observacao text,
    notas text,
    data_requisicao timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    canceled character varying(3) DEFAULT 'No'::character varying,
    date_cancelled timestamp without time zone
);


ALTER TABLE api.requisicao OWNER TO sidmat;

--
-- Name: unidade_sanitaria_id_seq; Type: SEQUENCE; Schema: api; Owner: sidmat
--

CREATE SEQUENCE api.unidade_sanitaria_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE api.unidade_sanitaria_id_seq OWNER TO sidmat;

--
-- Name: role; Type: TABLE; Schema: api; Owner: sidmat
--

CREATE TABLE api.role (
    id bigint DEFAULT nextval('api.unidade_sanitaria_id_seq'::regclass) NOT NULL,
    name character varying,
    description text
);


ALTER TABLE api.role OWNER TO sidmat;

--
-- Name: status_id_seq; Type: SEQUENCE; Schema: api; Owner: sidmat
--

CREATE SEQUENCE api.status_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE api.status_id_seq OWNER TO sidmat;

--
-- Name: status; Type: TABLE; Schema: api; Owner: sidmat
--

CREATE TABLE api.status (
    id bigint DEFAULT nextval('api.status_id_seq'::regclass) NOT NULL,
    name character varying
);


ALTER TABLE api.status OWNER TO sidmat;

--
-- Name: unidade_sanitaria; Type: TABLE; Schema: api; Owner: sidmat
--

CREATE TABLE api.unidade_sanitaria (
    nome character varying NOT NULL,
    distrito integer,
    id bigint DEFAULT nextval('api.unidade_sanitaria_id_seq'::regclass) NOT NULL
);


ALTER TABLE api.unidade_sanitaria OWNER TO sidmat;

--
-- Name: user_logs; Type: TABLE; Schema: api; Owner: sidmat
--

CREATE TABLE api.user_logs (
    id bigint NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    area bigint,
    total_material_importado bigint,
    notification_sent integer DEFAULT 0 NOT NULL
);


ALTER TABLE api.user_logs OWNER TO sidmat;

--
-- Name: usuario_role_seq; Type: SEQUENCE; Schema: api; Owner: sidmat
--

CREATE SEQUENCE api.usuario_role_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE api.usuario_role_seq OWNER TO sidmat;

--
-- Name: user_role; Type: TABLE; Schema: api; Owner: sidmat
--

CREATE TABLE api.user_role (
    id bigint DEFAULT nextval('api.usuario_role_seq'::regclass) NOT NULL,
    user_id integer NOT NULL,
    role_id bigint NOT NULL
);


ALTER TABLE api.user_role OWNER TO sidmat;

--
-- Name: user_roles; Type: VIEW; Schema: api; Owner: sidmat
--

CREATE VIEW api.user_roles AS
 SELECT col.nome,
    col.contacto,
    col.email,
    col.funcao,
    a.area
   FROM ((api.colaborador col
     JOIN api.colaborador_area ca ON ((col.id = ca.colaborador)))
     JOIN api.area a ON ((a.id = ca.area)));


ALTER TABLE api.user_roles OWNER TO sidmat;

--
-- Name: usuario; Type: TABLE; Schema: api; Owner: sidmat
--

CREATE TABLE api.usuario (
    id bigint DEFAULT nextval('api.usuario_id_seq'::regclass) NOT NULL,
    username character varying,
    password character varying,
    colaborador integer,
    status character varying(255) DEFAULT 'Active'::character varying
);


ALTER TABLE api.usuario OWNER TO sidmat;

--
-- Name: view_get_requisicoes_by_nr_guia; Type: VIEW; Schema: api; Owner: sidmat
--

CREATE VIEW api.view_get_requisicoes_by_nr_guia AS
 SELECT r.id,
    (r.data_requisicao)::date AS data_requisicao,
    m.descricao AS material_descricao,
    r.quantidade,
    us.nome AS unidade_sanitaria,
    'BOM'::text AS condicao,
    r.pf_contacto,
    r.pf_nome,
    c.nome AS requisitante,
    r.notas,
    gs.nr_guia,
    gs.id AS id_guia,
    col.nome AS motorista,
    gs.previsao_entrega,
    s.name AS status,
    gs.observacao,
    a.area,
    gs.data_guia,
    gs.data_entrega
   FROM (((((((api.requisicao r
     JOIN api.material m ON ((m.id = r.material)))
     JOIN api.unidade_sanitaria us ON ((us.id = r.unidade_sanitaria)))
     JOIN api.colaborador c ON ((c.id = r.requisitante)))
     JOIN api.area a ON ((a.id = m.area)))
     JOIN api.guia_saida gs ON ((gs.id = r.nr_guia)))
     JOIN api.colaborador col ON ((col.id = gs.motorista)))
     JOIN api.status s ON ((s.id = gs.status)));


ALTER TABLE api.view_get_requisicoes_by_nr_guia OWNER TO sidmat;

--
-- Name: vw_all_colaboradores; Type: VIEW; Schema: api; Owner: sidmat
--

CREATE VIEW api.vw_all_colaboradores AS
 SELECT DISTINCT c.id,
    c.nome,
    c.email,
    c.contacto,
    c.funcao,
    a.id AS id_area,
    a.area,
    r.id AS id_role,
    r.name AS role,
    u.status
   FROM (((((api.colaborador c
     JOIN api.colaborador_area ca ON ((ca.colaborador = c.id)))
     JOIN api.area a ON ((a.id = ca.area)))
     JOIN api.usuario u ON ((u.colaborador = c.id)))
     LEFT JOIN api.user_role ur ON ((ur.user_id = u.id)))
     LEFT JOIN api.role r ON ((r.id = ur.role_id)))
  ORDER BY c.id DESC;


ALTER TABLE api.vw_all_colaboradores OWNER TO sidmat;

--
-- Name: vw_all_requisicoes_by_month; Type: VIEW; Schema: api; Owner: sidmat
--

CREATE VIEW api.vw_all_requisicoes_by_month AS
 SELECT date_part('month'::text, r.data_requisicao) AS mes,
    to_char(r.data_requisicao, 'Month'::text) AS mes_nome,
    count(*) AS total_requisicao
   FROM (api.requisicao r
     JOIN api.material m ON ((m.id = r.material)))
  WHERE (date_part('year'::text, r.data_requisicao) = date_part('year'::text, CURRENT_DATE))
  GROUP BY (date_part('month'::text, r.data_requisicao)), (to_char(r.data_requisicao, 'Month'::text))
  ORDER BY (date_part('month'::text, r.data_requisicao));


ALTER TABLE api.vw_all_requisicoes_by_month OWNER TO sidmat;

--
-- Name: vw_authenticate; Type: VIEW; Schema: api; Owner: sidmat
--

CREATE VIEW api.vw_authenticate AS
 SELECT c.id,
    u.username,
    c.nome,
    c.email,
    c.contacto,
    a.area,
    r.name AS role
   FROM (((((api.usuario u
     JOIN api.colaborador c ON ((c.id = u.colaborador)))
     JOIN api.colaborador_area ca ON ((ca.colaborador = c.id)))
     JOIN api.area a ON ((a.id = ca.area)))
     JOIN api.user_role ur ON ((ur.user_id = u.id)))
     JOIN api.role r ON ((ur.role_id = r.id)));


ALTER TABLE api.vw_authenticate OWNER TO sidmat;

--
-- Name: vw_confirmacao_guia; Type: VIEW; Schema: api; Owner: sidmat
--

CREATE VIEW api.vw_confirmacao_guia AS
 SELECT gs.id,
    gs.nr_guia,
    gs.data_guia,
    s.name AS status,
    gs.previsao_entrega,
    gs.observacao,
    colab_motorista.nome AS motorista,
    us.nome AS unidade_sanitaria,
    a.area,
    gs.data_entrega,
    colab_confirmed.nome AS confirmed_by
   FROM (((((api.guia_saida gs
     JOIN api.colaborador colab_motorista ON ((colab_motorista.id = gs.motorista)))
     JOIN api.unidade_sanitaria us ON ((us.id = gs.unidade_sanitaria)))
     JOIN api.area a ON ((a.id = gs.area)))
     JOIN api.status s ON ((s.id = gs.status)))
     JOIN api.colaborador colab_confirmed ON ((colab_confirmed.id = gs.confirmedby)))
  WHERE ((gs.status = 4) AND (gs.notification_status = 'P'::bpchar));


ALTER TABLE api.vw_confirmacao_guia OWNER TO sidmat;

--
-- Name: vw_get_motoristas; Type: VIEW; Schema: api; Owner: sidmat
--

CREATE VIEW api.vw_get_motoristas AS
 SELECT c.id,
    u.username,
    c.nome,
    c.email,
    c.contacto,
    r.name AS role
   FROM (((api.usuario u
     JOIN api.colaborador c ON ((c.id = u.colaborador)))
     JOIN api.user_role ur ON ((ur.user_id = u.id)))
     JOIN api.role r ON ((ur.role_id = r.id)))
  WHERE ((r.name)::text = 'Motorista'::text);


ALTER TABLE api.vw_get_motoristas OWNER TO sidmat;

--
-- Name: vw_guias_saida; Type: VIEW; Schema: api; Owner: sidmat
--

CREATE VIEW api.vw_guias_saida AS
 SELECT gs.id,
    gs.nr_guia,
    gs.data_guia,
    s.name AS status,
    gs.previsao_entrega,
    gs.observacao,
    c.nome AS motorista,
    us.nome AS unidade_sanitaria,
    a.area,
    gs.data_entrega
   FROM ((((api.guia_saida gs
     JOIN api.colaborador c ON ((c.id = gs.motorista)))
     JOIN api.unidade_sanitaria us ON ((us.id = gs.unidade_sanitaria)))
     JOIN api.area a ON ((a.id = gs.area)))
     JOIN api.status s ON ((s.id = gs.status)));


ALTER TABLE api.vw_guias_saida OWNER TO sidmat;

--
-- Name: vw_material_by_id; Type: VIEW; Schema: api; Owner: sidmat
--

CREATE VIEW api.vw_material_by_id AS
 SELECT mat.id,
    mat.cod,
    mat.descricao,
    mat.qtd_stock,
    a.area,
    a2.nome AS armazem,
    mat.familia,
    mat.prazo,
    a.id AS id_area,
    (mat.data_importacao)::date AS data_importacao
   FROM ((api.material mat
     JOIN api.area a ON ((a.id = mat.area)))
     JOIN api.armazem a2 ON ((a2.id = mat.armazem)));


ALTER TABLE api.vw_material_by_id OWNER TO sidmat;

--
-- Name: vw_material_disponivel; Type: VIEW; Schema: api; Owner: sidmat
--

CREATE VIEW api.vw_material_disponivel AS
 SELECT mat.id,
    mat.cod,
    mat.descricao,
    mat.qtd_stock,
    a.area,
    mat.armazem,
    mat.familia,
    mat.prazo,
    a.id AS id_area
   FROM (api.material mat
     JOIN api.area a ON ((a.id = mat.area)))
  ORDER BY mat.qtd_stock DESC;


ALTER TABLE api.vw_material_disponivel OWNER TO sidmat;

--
-- Name: vw_material_logistica; Type: VIEW; Schema: api; Owner: sidmat
--

CREATE VIEW api.vw_material_logistica AS
 SELECT mat.id,
    mat.cod,
    mat.descricao,
    mat.qtd_stock,
    a.area,
    a2.nome AS armazem,
    mat.familia,
    mat.prazo,
    (mat.data_importacao)::date AS data_importacao,
    p.nome AS projecto,
    a.id AS id_area,
    a2.id AS id_armazem,
    p.id AS id_projecto
   FROM (((api.material mat
     JOIN api.area a ON ((a.id = mat.area)))
     JOIN api.projecto p ON ((p.id = mat.projecto)))
     JOIN api.armazem a2 ON ((a2.id = mat.armazem)))
  ORDER BY ((mat.data_importacao)::date) DESC;


ALTER TABLE api.vw_material_logistica OWNER TO sidmat;

--
-- Name: vw_material_solcitado_by_area_us; Type: VIEW; Schema: api; Owner: sidmat
--

CREATE VIEW api.vw_material_solcitado_by_area_us AS
 SELECT r.id AS id_requisicao,
    m.descricao AS material_descricao,
    r.quantidade,
    a.area,
    us.id AS id_us,
    r.pf_contacto,
    r.pf_nome,
    r.notas,
    c.nome AS requisitante_nome,
    (r.data_requisicao)::date AS data_requisicao
   FROM ((((api.requisicao r
     JOIN api.material m ON ((m.id = r.material)))
     JOIN api.area a ON ((a.id = m.area)))
     JOIN api.unidade_sanitaria us ON ((us.id = r.unidade_sanitaria)))
     JOIN api.colaborador c ON ((r.requisitante = c.id)));


ALTER TABLE api.vw_material_solcitado_by_area_us OWNER TO sidmat;

--
-- Name: vw_my_requisicao; Type: VIEW; Schema: api; Owner: sidmat
--

CREATE VIEW api.vw_my_requisicao AS
 SELECT r.id,
    (r.data_requisicao)::date AS data_requisicao,
    m.descricao AS material,
    r.quantidade,
    us.nome AS unidade_sanitaria,
    r.pf_contacto,
    r.pf_nome,
    c.nome AS requisitante,
    c.id AS requisitante_id,
    r.nr_guia AS id_guia,
    gs.nr_guia,
    s.name AS guia_status,
    r.notas,
    a.area,
    r.canceled
   FROM (((((((api.requisicao r
     JOIN api.material m ON ((m.id = r.material)))
     JOIN api.unidade_sanitaria us ON ((us.id = r.unidade_sanitaria)))
     JOIN api.colaborador c ON ((c.id = r.requisitante)))
     LEFT JOIN api.guia_saida gs ON ((gs.id = r.nr_guia)))
     LEFT JOIN api.colaborador_area ca ON ((ca.colaborador = c.id)))
     LEFT JOIN api.area a ON ((a.id = ca.area)))
     LEFT JOIN api.status s ON ((s.id = gs.status)));


ALTER TABLE api.vw_my_requisicao OWNER TO sidmat;

--
-- Name: vw_novo_material; Type: VIEW; Schema: api; Owner: sidmat
--

CREATE VIEW api.vw_novo_material AS
 SELECT m.id,
    m.descricao,
    m.qtd_stock,
    a.area,
    (m.data_importacao)::date AS data_importacao,
    m.notification_status
   FROM (api.material m
     JOIN api.area a ON ((a.id = m.area)))
  WHERE (m.notification_status = 'P'::bpchar);


ALTER TABLE api.vw_novo_material OWNER TO sidmat;

--
-- Name: vw_requisicao_by_area; Type: VIEW; Schema: api; Owner: sidmat
--

CREATE VIEW api.vw_requisicao_by_area AS
 SELECT a.area,
    us.id AS id_us,
    us.nome AS unidade_sanitaria,
    count(*) AS total_materiais,
    'cardSuccess'::text AS color
   FROM (((api.requisicao r
     JOIN api.material m ON ((m.id = r.material)))
     JOIN api.area a ON ((a.id = m.area)))
     JOIN api.unidade_sanitaria us ON ((us.id = r.unidade_sanitaria)))
  WHERE (r.nr_guia IS NULL)
  GROUP BY a.area, us.nome, us.id
  ORDER BY a.area;


ALTER TABLE api.vw_requisicao_by_area OWNER TO sidmat;

--
-- Name: vw_requisicao_by_guia; Type: VIEW; Schema: api; Owner: sidmat
--

CREATE VIEW api.vw_requisicao_by_guia AS
 SELECT r.id,
    (r.data_requisicao)::date AS data_requisicao,
    m.descricao AS material,
    r.quantidade,
    us.nome AS unidade_sanitaria,
    r.pf_contacto,
    r.pf_nome,
    c.nome AS requisitante,
    a.area,
    gs.nr_guia,
    r.notas
   FROM (((((api.requisicao r
     JOIN api.material m ON ((m.id = r.material)))
     JOIN api.unidade_sanitaria us ON ((us.id = r.unidade_sanitaria)))
     JOIN api.colaborador c ON ((c.id = r.requisitante)))
     JOIN api.area a ON ((a.id = m.area)))
     LEFT JOIN api.guia_saida gs ON ((gs.id = r.nr_guia)))
  WHERE (r.nr_guia IS NOT NULL);


ALTER TABLE api.vw_requisicao_by_guia OWNER TO sidmat;

--
-- Name: vw_requisicoes_by_distrito; Type: VIEW; Schema: api; Owner: sidmat
--

CREATE VIEW api.vw_requisicoes_by_distrito AS
 SELECT req_novas.distrito,
    req_novas.total_requisicoes AS total_novas,
    req_processadas.total_requisicoes AS total_processadas,
    req_completas.total_requisicoes AS total_completas,
    'cardSuccess'::text AS color
   FROM ((( SELECT d.distrito,
            count(*) AS total_requisicoes
           FROM ((((((((api.requisicao r
             JOIN api.material m ON ((m.id = r.material)))
             JOIN api.unidade_sanitaria us ON ((us.id = r.unidade_sanitaria)))
             JOIN api.colaborador c ON ((c.id = r.requisitante)))
             JOIN api.distrito d ON ((d.id = us.distrito)))
             LEFT JOIN api.guia_saida gs ON ((gs.id = r.nr_guia)))
             LEFT JOIN api.colaborador_area ca ON ((ca.colaborador = c.id)))
             LEFT JOIN api.area a ON ((a.id = ca.area)))
             LEFT JOIN api.status s ON ((s.id = gs.status)))
          WHERE (gs.nr_guia IS NULL)
          GROUP BY d.distrito) req_novas
     LEFT JOIN ( SELECT d.distrito,
            count(*) AS total_requisicoes
           FROM ((((((((api.requisicao r
             JOIN api.material m ON ((m.id = r.material)))
             JOIN api.unidade_sanitaria us ON ((us.id = r.unidade_sanitaria)))
             JOIN api.colaborador c ON ((c.id = r.requisitante)))
             JOIN api.distrito d ON ((d.id = us.distrito)))
             LEFT JOIN api.guia_saida gs ON ((gs.id = r.nr_guia)))
             LEFT JOIN api.colaborador_area ca ON ((ca.colaborador = c.id)))
             LEFT JOIN api.area a ON ((a.id = ca.area)))
             LEFT JOIN api.status s ON ((s.id = gs.status)))
          WHERE ((gs.nr_guia IS NOT NULL) AND ((s.name)::text = 'NOVA'::text))
          GROUP BY d.distrito) req_processadas ON (((req_processadas.distrito)::text = (req_novas.distrito)::text)))
     LEFT JOIN ( SELECT d.distrito,
            count(*) AS total_requisicoes
           FROM ((((((((api.requisicao r
             JOIN api.material m ON ((m.id = r.material)))
             JOIN api.unidade_sanitaria us ON ((us.id = r.unidade_sanitaria)))
             JOIN api.colaborador c ON ((c.id = r.requisitante)))
             JOIN api.distrito d ON ((d.id = us.distrito)))
             LEFT JOIN api.guia_saida gs ON ((gs.id = r.nr_guia)))
             LEFT JOIN api.colaborador_area ca ON ((ca.colaborador = c.id)))
             LEFT JOIN api.area a ON ((a.id = ca.area)))
             LEFT JOIN api.status s ON ((s.id = gs.status)))
          WHERE ((gs.nr_guia IS NOT NULL) AND ((s.name)::text = 'ENTREGUE'::text))
          GROUP BY d.distrito) req_completas ON (((req_completas.distrito)::text = (req_novas.distrito)::text)));


ALTER TABLE api.vw_requisicoes_by_distrito OWNER TO sidmat;

--
-- Name: vw_requisicoes_by_month; Type: VIEW; Schema: api; Owner: sidmat
--

CREATE VIEW api.vw_requisicoes_by_month AS
 SELECT a.area,
    date_part('month'::text, r.data_requisicao) AS mes,
    to_char(r.data_requisicao, 'Month'::text) AS mes_nome,
    count(*) AS total_requisicao
   FROM ((api.requisicao r
     JOIN api.material m ON ((m.id = r.material)))
     JOIN api.area a ON ((a.id = m.area)))
  WHERE (date_part('year'::text, r.data_requisicao) = date_part('year'::text, CURRENT_DATE))
  GROUP BY a.area, (date_part('month'::text, r.data_requisicao)), (to_char(r.data_requisicao, 'Month'::text))
  ORDER BY a.area, (date_part('month'::text, r.data_requisicao));


ALTER TABLE api.vw_requisicoes_by_month OWNER TO sidmat;

--
-- Name: vw_requisicoes_pendentes; Type: VIEW; Schema: api; Owner: sidmat
--

CREATE VIEW api.vw_requisicoes_pendentes AS
 SELECT r.id AS id_requisicao,
    (r.data_requisicao)::date AS data_requisicao,
    m.descricao AS material_descricao,
    r.quantidade,
    a.area,
    us.id AS id_us,
    us.nome AS unidade_sanitaria,
    r.pf_nome,
    r.pf_contacto,
    r.requisitante,
    c.nome AS requisitante_nome,
    r.notas,
    p.nome AS projecto,
    r.canceled
   FROM (((((api.requisicao r
     JOIN api.material m ON ((m.id = r.material)))
     JOIN api.area a ON ((a.id = m.area)))
     JOIN api.unidade_sanitaria us ON ((us.id = r.unidade_sanitaria)))
     JOIN api.colaborador c ON ((r.requisitante = c.id)))
     JOIN api.projecto p ON ((p.id = m.projecto)))
  WHERE (r.nr_guia IS NULL);


ALTER TABLE api.vw_requisicoes_pendentes OWNER TO sidmat;

--
-- Name: vw_sumario_requisicoes_pendentes; Type: VIEW; Schema: api; Owner: sidmat
--

CREATE VIEW api.vw_sumario_requisicoes_pendentes AS
 SELECT a.id,
    a.area,
    count(r.id) AS total_requisicao,
    count(DISTINCT r.unidade_sanitaria) AS total_unidade_sanitaria,
    'cardSuccess'::text AS color
   FROM ((api.requisicao r
     JOIN api.material m ON ((m.id = r.material)))
     JOIN api.area a ON ((a.id = m.area)))
  WHERE (r.nr_guia IS NULL)
  GROUP BY a.id, a.area;


ALTER TABLE api.vw_sumario_requisicoes_pendentes OWNER TO sidmat;

--
-- Name: vw_unidades_sanitarias; Type: VIEW; Schema: api; Owner: sidmat
--

CREATE VIEW api.vw_unidades_sanitarias AS
 SELECT us.id,
    us.nome,
    d.distrito,
    us.distrito AS id_distrito
   FROM (api.unidade_sanitaria us
     JOIN api.distrito d ON ((d.id = us.distrito)));


ALTER TABLE api.vw_unidades_sanitarias OWNER TO sidmat;

--
-- Data for Name: area; Type: TABLE DATA; Schema: api; Owner: sidmat
--

COPY api.area (id, area, descricao, status) FROM stdin;
19	M&A	Monitoria & Avaliação	Active
10	LAB	Laboratório 	Active
23	LOGISTICA	Logistica	Active
11	MQ	Melhoria de Qualidade	Active
16	TB	Tuberculose	Active
25	Motoristas	Motoristas	Active
2	APSS	Apoio Psicossocial	Active
26	SMI	Saude Materno Infantil	Active
1	C&T	Cuidado e Tratamento Adulto	Active
3	ATS	Aconselhamento e Testagem em Saude	Active
28	CACUM	Cuidados do Cancro do colo uterino	Active
29	COM	Comunicação	Active
30	P&I	Pesquisa & Investigação	Active
31	PED	Cuidados &Tratamento Pediatrico	Active
32	FARM	Farmacia	Active
27	EC	Envolvimomunitárioento C	Active
17	VBG/PREV	Violencia Baseada no Genero	Active
22	RH	Recursos Humanos	Inactive
33	FG/TB	Fundo Global TB	Active
34	APSS/FG	Fundo Global APSS	Active
35	FG/DH	Direitos Humanos Fundo Global	Active
36	FG/EC	Envolvimento Comunitário FG	Active
\.


--
-- Data for Name: armazem; Type: TABLE DATA; Schema: api; Owner: sidmat
--

COPY api.armazem (nome, id, cod_armazem) FROM stdin;
ARMAZEM MAPUTO CIDADE	1	202
ARMAZEM ZIMPETO	2	200
ARMAZEM HEAD OFFICE	3	201
\.


--
-- Data for Name: colaborador; Type: TABLE DATA; Schema: api; Owner: sidmat
--

COPY api.colaborador (id, nome, contacto, email, funcao) FROM stdin;
4	Bibi Aly	83 234 9432	bibialy@ccsaude.org.mz	Assessora de APSS
6	Nuno Moura	82 412 5680	nunomoura@ccsaude.org.mz	Oficial Logístico
9	Brigida Mavie	82 456 4343	brigidamavie@ccsaude.org.mz	Assessora de VGB
24	Agnaldo Samuel	849004564	agnaldosamuel@ccsaude.org.mz	Gestor de Sistemas
53	Denilson	N/A	denilsonmucavele@ccsaude.org.mz	Programador
55	Admin	N/A	admin@ccsaude.org.mz	Administrador
1	Mauricio Timecane	86 554 3876	mauriciotimecane@ccsaude.org.mz	Assessor de M&A
8	Maira Marra	84 342 3945	mairamarra@ccsaude.org.mz	Assessora de SMI/PTV
51	Jose Bavo	871234560	motorista@ccsaude.org.mz	Motorista
57	Armindo Coana	847976921	armindocoana@ccsaude.org.mz	Oficial Senior de Logística e Procurement
59	Hugo Azevedo	N/A	hugoazevedo@ccsaude.org.mz	Gestor Sénior de Logística
61	Alberto Magalhaes	N/A	albertomagalhaes@ccsaude.org.mz	Oficial de Inventários e Armazéns
63	Decio Gomes	N/A	deciogomes@ccsaude.org.mz	Gestor Logistica
67	Paulino Junior	N/A	paulinojunior@ccsaude.org.mz	Oficial de Procurement
69	Sérgio Comé	844756595	motorista10@ccsaude.org.mz	Motorista
71	Issufo Tavá	N/A	issufotava@ccsaude.org.mz	Motorista
73	Ventura Carrasco	N/A	motorista1@ccsaude.org.mz	Motorista
75	Sérgio Tamele	843023757	sergiotamele@ccsaude.org.mz	motorista
77	Inacio DIque	N/A	motorista2@ccsaude.org.mz	Motorista
79	Fernando Xerinda	N/A	fernandoxerinda@ccsaude.org.mz	Motorista
81	José Basilio	847163757	josebasilio@ccsaude.org.mz	Motorista
83	Sergio Mahenjane	N/A	motorista3@ccsaude.org.mz	 Motorista
85	Daniel Bernardo	866687664	danielbernardo@ccsaude.org.mz	Motorista
87	Sergio Madede	848543416	sergiomadede@ccsaude.org.mz	Motorista
89	Sunil Budia	844621056	sunilbudia@ccsaude.org.mz	Motorista
91	Cesar Mualiolane	848851817	cesarmualiolane@ccsaude.org.mz	Motorista
93	Pedro Langa	824595457	pedrolanga@ccsaude-org.mz	Motorista
95	Silva Sousa	844279817	silvasousa@ccsaude.org.mz	Motorista
97	Fornecedor Entrega	N/A	fornecedor@ccsaude.org.mz	Motorista
99	Edite Guila	N/A	editeguila@ccsaude.org.mz	Assessora de C&T
101	Ermelinda Fumo	N/A	ermelindafumo@ccsaude.org.mz	Gestora de APSS
103	Selma Khan	N/A	selmakhan@ccsaude.org.mz	Assessora de ATS
105	Aventina Cardoso	N/A	aventinacardoso@ccsaude.org.mz	Gestora de SMI
107	Moisés Dias	N/A	moisesdias@ccsaude.org.mz	Assessor de Envolvimento Comunitario
109	Nádia Amade	N/A	nadiaamade@ccsaude.org.mz	Assessora de Laboratorio
111	Marilene Madivadua	N/A	marilenemadivadua@ccsaude.org.mz	Gestora de Farmacia
113	Tatiana Fonseca	N/A	tatianafonseca@ccsaude.org.mz	Assessora de Farmacia
115	Adielo Zacarias	N/A	adielozacarias@ccsaude.org.mz	Gestor de TB
117	Jonas Deve	N/A	jonasdeve@ccsaude.org.mz	Assessor de TB
119	Olivia Moçambique	N/A	oliviamocambique@ccsaude.org.mz	Assessora de CT Pediatrico
121	Florbela Bata	N/A	florbelabata@ccsaude.org.mz	Coordenadora de C&T
65	Shital Mobaracaly	N/A	shitalmobaracaly@ccsaude.org.mz	Directora Provincial
123	Maria 	N/A	mariasilva@ccsaude.org.mz	SMI
125	Rosa Pedro	866761661	rosapedro@ccsaude.org.mz	Oficial
127	Julio Holauene	875527886	JulioHolauene@ccsaude.org.mz	Oficial
129	Manuel	N/A	manuelmuianga@ccsaude.org.mz	TB
131	Celina Domingos	826498070	celinadomingos@ccsaude.org.mz	Oficial
133	Inocencio Tamele	827500331	inocenciotamele@ccsaude.org.mz	Oficial
135	Celina	N/A	celinadomingoss@ccsaude.org.mz	ATS
137	Ana Lampião	867950278	analampiao@ccsaude.org.mz	Oficial
139	ats	N/A	celina@ccsaude.org.mz	ATS
141	Justino Machonisse	824348020	justinomachonisse@ccsaude.org.mz	Gestor MQ
143	Alcino	N/A	alcinobuque@ccsaude.org.mz	M&A
145	Alcino	N/A	buque@ccsaude.org.mz	Gestor
147	Nogar Uateca	N/A	nogaruateca@ccsaude.org.mz	Gestor
149	Eunice Francisco	N/A	eunicefrancisco@ccsaude.org.mz	Gestora de EC
\.


--
-- Data for Name: colaborador_area; Type: TABLE DATA; Schema: api; Owner: sidmat
--

COPY api.colaborador_area (id, area, colaborador) FROM stdin;
1	19	1
4	2	4
5	23	6
6	17	9
11	19	24
24	25	51
7	26	8
25	19	53
26	23	55
27	23	57
28	23	59
29	23	61
30	23	63
31	23	65
32	23	67
33	25	69
34	25	71
35	25	73
36	25	75
37	25	77
38	25	79
39	25	81
40	25	83
41	25	85
42	25	87
43	25	89
44	25	91
45	25	93
46	25	95
47	23	97
48	1	99
49	2	101
50	3	103
51	28	105
52	27	107
53	10	109
54	32	111
55	32	113
56	16	115
57	16	117
58	31	119
59	1	121
60	26	123
61	3	125
62	10	127
63	16	129
64	3	131
65	16	133
66	3	135
67	2	137
68	3	139
69	11	141
70	19	143
71	19	145
72	17	147
73	27	149
\.


--
-- Data for Name: distrito; Type: TABLE DATA; Schema: api; Owner: sidmat
--

COPY api.distrito (id, distrito) FROM stdin;
1	Kamavota
2	Kamaxakeni
3	Kampfumu
4	Kamubukwana
5	Kanyaka
6	Katembe
7	Nlhamankulu
8	Escolas
\.


--
-- Data for Name: guia_saida; Type: TABLE DATA; Schema: api; Owner: sidmat
--

COPY api.guia_saida (motorista, unidade_sanitaria, previsao_entrega, status, observacao, id, area, data_guia, nr_guia, foto_id, data_entrega, createdby, confirmedby, notification_status) FROM stdin;
73	9	2023-06-10	4	nada	41	19	2023-11-15	CDC-2023-5151	\N	2023-11-15	\N	63	P
75	2	2023-11-15	4		39	2	2023-11-15	CDC-2023-101	\N	2023-11-15	\N	67	P
93	9	2023-11-15	4		42	2	2023-11-15	CDC-2023-012	\N	2023-11-15	\N	61	P
77	18	2023-07-10	4		44	2	2023-11-15	CDC-2023-5152	\N	2023-11-15	\N	63	P
51	23	2023-11-21	1		46	2	2023-11-15	CDC-2023-1215	\N	\N	\N	\N	P
79	2	2023-11-29	4	Observation	45	19	2023-11-15	CDC-2023-342	\N	2023-11-15	\N	6	P
83	2	2023-11-20	4		49	19	2023-11-15	CDC-2023-1219	\N	2023-11-15	\N	6	P
81	4	2023-11-21	4		48	31	2023-11-15	CDC-2023-1217	\N	2023-11-15	\N	6	P
71	2	2023-11-22	1		52	1	2023-11-15	CDC-2023-134	\N	\N	\N	\N	P
69	3	2023-11-15	1		53	1	2023-11-15	CDC-2023-135413	\N	\N	\N	\N	P
69	4	2023-11-12	1		54	1	2023-11-15	CDC-2023-123412	\N	\N	\N	\N	P
75	5	2023-11-19	1		55	1	2023-11-15	CDC-2023-1234523	\N	\N	\N	\N	P
75	10	2023-11-20	1		56	2	2023-11-15	CDC-2023-234253	\N	\N	\N	\N	P
69	11	2023-11-20	1		57	2	2023-11-15	CDC-2023-765643	\N	\N	\N	\N	P
69	1	2023-11-20	1		58	2	2023-11-15	CDC-2023-3423	\N	\N	\N	\N	P
51	1	2023-11-19	1		62	19	2023-11-15	CDC-2023-765432	\N	\N	\N	\N	P
69	1	2023-11-27	1		65	31	2023-11-15	CDC-2023-423572563	\N	\N	\N	\N	P
69	5	2023-11-20	1		66	32	2023-11-15	CDC-2023-23562364	\N	\N	\N	\N	P
51	12	2023-11-27	1		67	2	2023-11-15	CDC-2023-46325	\N	\N	\N	\N	P
73	3	2023-11-22	1		68	2	2023-11-15	CDC-2023-w572623	\N	\N	\N	\N	P
69	4	2023-11-19	1		69	2	2023-11-15	CDC-2023-4363542	\N	\N	\N	\N	P
69	17	2023-11-20	1		70	2	2023-11-15	CDC-2023-24525	\N	\N	\N	\N	P
51	45	2023-11-13	1		71	2	2023-11-15	CDC-2023-245245	\N	\N	\N	\N	P
69	16	2023-11-20	1		72	2	2023-11-15	CDC-2023-46254	\N	\N	\N	\N	P
69	1	2023-11-20	1		74	10	2023-11-15	CDC-2023-342765	\N	\N	\N	\N	P
69	16	2023-11-22	1		75	10	2023-11-15	CDC-2023-635636	\N	\N	\N	\N	P
69	42	2023-11-27	1		76	16	2023-11-15	CDC-2023-q5433	\N	\N	\N	\N	P
51	1	2023-11-20	1		77	26	2023-11-15	CDC-2023-34634	\N	\N	\N	\N	P
51	10	2023-11-20	1		78	26	2023-11-15	CDC-2023-2351342	\N	\N	\N	\N	P
69	8	2023-11-20	1		79	26	2023-11-15	CDC-2023-2342342	\N	\N	\N	\N	P
73	1	2023-11-20	1		80	31	2023-11-15	CDC-2023-234234	\N	\N	\N	\N	P
69	21	2023-11-21	1		81	2	2023-11-15	CDC-2023-23424	\N	\N	\N	\N	P
77	16	2023-11-21	1		82	26	2023-11-15	CDC-2023-2345243	\N	\N	\N	\N	P
69	12	2023-11-22	1		83	19	2023-11-15	CDC-2023-325624	\N	\N	\N	\N	P
79	10	2023-11-21	1		84	10	2023-11-15	CDC-2023-23452345	\N	\N	\N	\N	P
79	10	2023-11-21	1		85	10	2023-11-15	CDC-2023-23452345	\N	\N	\N	\N	P
51	8	2023-11-20	1		86	28	2023-11-15	CDC-2023-24353	\N	\N	\N	\N	P
73	23	2023-11-22	1		87	26	2023-11-15	CDC-2023-23423	\N	\N	\N	\N	P
51	10	2023-11-28	1		88	31	2023-11-15	CDC-2023-3444343	\N	\N	\N	\N	P
69	1	2023-11-22	1		89	2	2023-11-15	CDC-2023-65566	\N	\N	\N	\N	P
51	10	2023-11-26	1		90	2	2023-11-15	CDC-2023-7577	\N	\N	\N	\N	P
69	1	2023-11-20	1		96	19	2023-11-15	CDC-2023-54214	\N	\N	\N	\N	P
51	10	2023-11-20	1		97	19	2023-11-15	CDC-2023-3242	\N	\N	\N	\N	P
51	3	2023-11-26	1		98	19	2023-11-15	CDC-2023-2342432	\N	\N	\N	\N	P
69	19	2023-11-20	1		99	10	2023-11-15	CDC-2023-234333	\N	\N	\N	\N	P
51	2	2023-11-27	1		100	31	2023-11-15	CDC-2023-3453	\N	\N	\N	\N	P
69	6	2023-11-19	1		101	10	2023-11-15	CDC-2023-42532512	\N	\N	\N	\N	P
51	16	2023-11-20	1		102	16	2023-11-15	CDC-2023-2342343	\N	\N	\N	\N	P
51	1	2023-11-27	1		103	26	2023-11-15	CDC-2023-5555678	\N	\N	\N	\N	P
51	22	2023-11-26	4		91	3	2023-11-15	CDC-2023-4545	\N	2023-11-15	\N	6	P
77	14	2023-11-21	4		50	1	2023-11-15	CDC-2023-1234567	\N	2023-11-15	\N	6	P
71	4	2023-11-15	4		38	2	2023-11-15	CDC-2023-1213	\N	2023-11-15	\N	6	P
79	3	2023-11-22	4		63	26	2023-11-15	CDC-2023-09876523	\N	2023-11-15	\N	6	P
69	10	2023-11-27	4		64	28	2023-11-15	CDC-2023-35634	\N	2023-11-15	\N	6	P
81	10	2023-11-19	4		51	1	2023-11-15	CDC-2023-2343	\N	2023-11-15	\N	6	P
69	1	2023-11-19	4		61	16	2023-11-15	CDC-2023-8765432	\N	2023-11-15	\N	6	P
69	17	2023-11-20	4		92	3	2023-11-15	CDC-2023-5774	\N	2023-11-15	\N	6	P
69	12	2023-11-20	4		95	3	2023-11-15	CDC-2023-6543	\N	2023-11-15	\N	6	P
75	2	2023-11-28	4		93	3	2023-11-15	CDC-2023-4545445	\N	2023-11-15	\N	6	P
69	17	2023-11-13	4		73	3	2023-11-15	CDC-2023-245225	\N	2023-11-15	\N	6	P
79	2	2023-11-22	4		59	3	2023-11-15	CDC-2023-8765	\N	2023-11-15	\N	6	P
69	1	2023-11-21	4		94	3	2023-11-15	CDC-2023-45454456	\N	2023-11-15	\N	6	P
75	3	2023-11-21	4		47	19	2023-11-15	CDC-2023-1216	\N	2023-11-15	\N	6	P
69	3	2023-11-19	4		60	10	2023-11-15	CDC-2023-098765	\N	2023-11-15	\N	6	P
77	41	2023-11-29	1		107	27	2023-11-16	CDC-2023-943	\N	\N	\N	\N	P
51	46	2023-11-29	4		104	27	2023-11-16	CDC-2023-734	\N	2023-11-16	\N	6	P
83	12	2023-11-29	4		106	17	2023-11-16	CDC-2023-874	\N	2023-11-16	\N	6	P
69	16	2023-11-29	4		105	17	2023-11-16	CDC-2023-678	\N	2023-11-16	\N	6	P
\.


--
-- Data for Name: material; Type: TABLE DATA; Schema: api; Owner: sidmat
--

COPY api.material (id, projecto, armazem, familia, cod, descricao, qtd_stock, area, prazo, data_importacao, notification_status) FROM stdin;
99	1	1	Escritório	ESCRIT0110	Computador HP	456	33	\N	2023-11-15 13:13:40.668888	P
74	1	1	Escritório	ESCRIT0102	Iimpressora canon	3	31	\N	2023-11-15 09:04:42.798232	S
76	1	1	Printing	PRINT1157	LIVRO DE REGISTO DE CHAMADAS E VD 	30	2	\N	2023-11-15 09:05:16.097275	S
73	1	1	Escritório	ESCRIT0101	Impressora HP 	0	31	\N	2023-11-15 09:04:42.798232	S
78	1	1	Diversos	MEDCIRG0969	CARRINHO DE DOSE UNITARIA 	0	32	\N	2023-11-15 09:05:16.097275	S
75	1	1	Printing	PRINT1351	LIVRO DE PLANEAMENTO FAMILIAR INTEGRADO 	135	1	\N	2023-11-15 09:05:16.097275	S
80	1	1	Electronico	INFORM0241	PoE INJECTOR "Ubiquiti" 48W 	9	19	\N	2023-11-15 09:05:16.097275	S
66	1	1	Printing	PRINT1512	Cartaz Sobre Autotestagem "CASAL"	453	19	\N	2023-10-30 08:58:05.940458	S
65	1	1	Printing	PRINT1506	RESUMO MENSAL DE ITS (Para US)	0	19	\N	2023-10-30 08:58:05.940458	S
77	1	1	Printing	PRINT1567	LIVRO DE REGISTO DE CONSULTA DA CRIANCA SADIA	0	26	\N	2023-11-15 09:05:16.097275	S
98	1	1	Escritório	ESCRIT0109	Computador HP	489	28	\N	2023-11-15 13:13:40.668888	P
79	1	1	Diversos	PRINT1193	PASTA DE COSTAS (P/ Laptop) 	51	31	\N	2023-11-15 09:05:16.097275	S
67	1	1	Printing	PRINT1513	Cartaz Sobre Autotestagem "LGBT"	0	19	\N	2023-10-30 08:58:05.940458	S
101	1	1	Escritório	ESCRIT0110	Computador HP	376	17	\N	2023-11-16 10:39:44.507282	P
100	1	1	Escritório	ESCRIT0109	Computador HP	250	27	\N	2023-11-16 10:39:44.507282	P
83	1	1	PRINT	PRINT0012	Livro de registo de ats	10	32	\N	2023-11-15 09:07:22.918312	S
81	1	1	Electronico	INFORM0172	Telemovel Samsung A04 	39	3	\N	2023-11-15 09:05:16.097275	S
84	1	1	DIVERSOS	DIV21314151	Camisetes Polo cor Azul	59	27	10	2023-11-15 09:08:13.432454	S
85	1	1	DIVERSOS	DIV21314152	Bonés timbrados Cor Azul	59	27	10	2023-11-15 09:08:13.432454	S
96	1	1	Electronico	DIVERSOS0607	Adaptadores	0	16	\N	2023-11-15 12:35:40.219534	P
93	1	1	Electronico	INFORM0172	Telemovel Samsung A04 	0	3	\N	2023-11-15 12:35:40.219534	P
89	1	1	Printing	PRINT1567	LIVRO DE REGISTO DE CONSULTA DA CRIANCA SADIA	40	26	\N	2023-11-15 12:35:40.219534	P
94	1	1	Electronico	DIVERSOS0605	Adaptadores	7	3	\N	2023-11-15 12:35:40.219534	P
86	1	1	Legumes	BAT001	Batatas	100	23	\N	2023-11-15 09:09:25.235975	S
90	1	1	Diversos	MEDCIRG0969	CARRINHO DE DOSE UNITARIA 	2	32	\N	2023-11-15 12:35:40.219534	P
91	1	1	Diversos	PRINT1193	PASTA DE COSTAS (P/ Laptop) 	51	31	\N	2023-11-15 12:35:40.219534	P
92	1	1	Electronico	INFORM0241	PoE INJECTOR "Ubiquiti" 48W 	9	19	\N	2023-11-15 12:35:40.219534	P
97	1	1	Electronico	DIVERSOS0608	Adaptadores	24	32	\N	2023-11-15 12:35:40.219534	P
82	1	1	Electronico	DIVERSOS0605	Adaptadores	14	3	\N	2023-11-15 09:05:16.097275	S
88	1	1	Printing	PRINT1157	LIVRO DE REGISTO DE CHAMADAS E VD 	5	2	\N	2023-11-15 12:35:40.219534	P
95	1	1	Electronico	DIVERSOS0606	Adaptadores	-20	10	\N	2023-11-15 12:35:40.219534	P
87	1	1	Printing	PRINT1351	LIVRO DE PLANEAMENTO FAMILIAR INTEGRADO 	0	1	\N	2023-11-15 12:35:40.219534	P
\.


--
-- Data for Name: onedrive_image; Type: TABLE DATA; Schema: api; Owner: sidmat
--

COPY api.onedrive_image (id, drive_id, name, web_view_link) FROM stdin;
\.


--
-- Data for Name: projecto; Type: TABLE DATA; Schema: api; Owner: sidmat
--

COPY api.projecto (id, nome, descricao, status) FROM stdin;
1	CDC	\N	Active
2	FG	\N	Active
\.


--
-- Data for Name: requisicao; Type: TABLE DATA; Schema: api; Owner: sidmat
--

COPY api.requisicao (id, material, quantidade, unidade_sanitaria, pf_contacto, pf_nome, requisitante, nr_guia, observacao, notas, data_requisicao, canceled, date_cancelled) FROM stdin;
69	76	3	4		pf	4	38	\N		2023-11-15 09:12:10.376365	No	\N
68	76	4	2		ponto focal	4	39	\N		2023-11-15 09:12:10.376365	No	\N
72	65	2	9			24	41	\N		2023-11-15 09:17:06.086981	No	\N
74	76	3	9			4	42	\N		2023-11-15 09:17:47.165538	No	\N
113	75	5	14	846744198	Idiamine Amade	99	50	\N		2023-11-15 13:19:00.883841	No	\N
73	76	3	18			4	44	\N		2023-11-15 09:17:47.165538	No	\N
70	67	5	2			24	45	\N		2023-11-15 09:13:16.831786	No	\N
71	65	5	2			24	45	\N		2023-11-15 09:13:38.297756	No	\N
81	79	2	3			119	\N	\N		2023-11-15 12:36:52.175701	No	\N
83	79	4	5			119	\N	\N		2023-11-15 12:36:52.175701	No	\N
75	76	2	23			4	46	\N		2023-11-15 09:17:47.165538	No	\N
77	65	2	3		Agnaldo Samuel	24	47	\N		2023-11-15 12:36:06.402547	No	\N
82	79	4	4			119	48	\N		2023-11-15 12:36:52.175701	No	\N
76	65	3	2		ponto focal	24	49	\N		2023-11-15 12:36:06.402547	No	\N
94	67	2	12		Anibal	1	\N	\N		2023-11-15 13:13:27.085234	No	\N
95	67	5	52		Estudante	1	\N	\N		2023-11-15 13:13:27.085234	No	\N
112	75	10	10	864197578	Luis Machava	99	51	\N		2023-11-15 13:19:00.883841	No	\N
130	87	25	2			121	52	\N		2023-11-15 13:20:52.525656	No	\N
131	87	25	3			121	53	\N		2023-11-15 13:20:52.525656	No	\N
132	87	50	4			121	54	\N		2023-11-15 13:20:52.525656	No	\N
133	87	50	5			121	55	\N		2023-11-15 13:20:52.525656	No	\N
115	88	5	11		elisa	4	57	\N		2023-11-15 13:19:07.69122	No	\N
96	76	19	1	867689051	Francisco	137	58	\N		2023-11-15 13:15:40.594882	No	\N
103	94	10	2	876899999	Maria Joao	125	59	\N		2023-11-15 13:16:21.093471	No	\N
118	95	6	3		lucia	109	60	\N		2023-11-15 13:19:20.951329	No	\N
90	96	12	1	870000000	denilson	115	61	\N		2023-11-15 13:11:47.20415	No	\N
92	67	20	1		Edson	1	62	\N		2023-11-15 13:13:27.085234	No	\N
129	77	11	6			8	\N	\N		2023-11-15 13:20:47.695039	Yes	2023-11-15 00:00:00
139	77	2	1			8	\N	\N		2023-11-15 13:21:11.347044	Yes	2023-11-15 00:00:00
145	77	2	7	820868037	Sandra	123	\N	\N		2023-11-15 13:21:33.026173	Yes	2023-11-15 00:00:00
134	98	10	10	847156624	Virginia 	105	64	\N		2023-11-15 13:20:57.011076	No	\N
144	77	2	6	820868037	Sandra	123	\N	\N		2023-11-15 13:21:33.026173	Yes	2023-11-15 00:00:00
128	77	10	4		Maria	8	\N	\N		2023-11-15 13:20:47.695039	Yes	2023-11-15 00:00:00
143	77	2	4	820868037	Sandra	123	\N	\N		2023-11-15 13:21:33.026173	Yes	2023-11-15 00:00:00
79	79	1	1			119	65	\N		2023-11-15 12:36:52.175701	No	\N
126	77	37	2		Luisa	8	\N	\N		2023-11-15 13:20:47.695039	Yes	2023-11-15 00:00:00
127	77	20	3	824444445	Maria	8	63	\N		2023-11-15 13:20:47.695039	Yes	2023-11-15 00:00:00
125	77	20	1			8	\N	\N		2023-11-15 13:20:47.695039	Yes	2023-11-15 00:00:00
142	77	90	3	820868037	Sandra	123	\N	\N		2023-11-15 13:21:33.026173	Yes	2023-11-15 00:00:00
141	77	2	2	820868037	Sandra	123	\N	\N		2023-11-15 13:21:33.026173	Yes	2023-11-15 00:00:00
109	78	2	5	842733763	Dimpal	111	66	\N		2023-11-15 13:17:20.052768	No	\N
140	77	2	1	820868037	Sandra	123	\N	\N		2023-11-15 13:21:33.026173	Yes	2023-11-15 00:00:00
116	88	5	12		elisa	4	67	\N		2023-11-15 13:19:07.69122	No	\N
97	76	10	4	876543210	Virginia	137	69	\N		2023-11-15 13:15:40.594882	No	\N
124	88	12	17	841638839	junior	101	70	\N		2023-11-15 13:20:44.420138	No	\N
99	76	6	45	870620073	Arleth	137	71	\N		2023-11-15 13:15:40.594882	No	\N
98	76	22	16	878797920	Anifa	137	72	\N		2023-11-15 13:15:40.594882	No	\N
111	95	12	1	875527886	Marina	127	74	\N		2023-11-15 13:17:43.172334	No	\N
110	95	12	16	845527886	Michela	127	75	\N		2023-11-15 13:17:43.172334	No	\N
89	96	10	42	878766543	Marcia	133	76	\N		2023-11-15 13:11:45.58532	No	\N
146	77	20	1	820868037	Sandra	123	77	\N		2023-11-15 13:31:53.839138	No	\N
147	77	20	10	820868037	Sandra	123	78	\N		2023-11-15 13:31:53.839138	No	\N
100	76	10	21	843935196	Ruth Uamba	137	81	\N		2023-11-15 13:15:40.594882	No	\N
78	65	2	12		Agnaldo Samuel	24	83	\N		2023-11-15 12:36:06.402547	No	\N
135	98	10	8	827157624	Joana	105	86	\N		2023-11-15 13:20:57.011076	No	\N
117	95	6	10		Hacita	109	85	\N		2023-11-15 13:19:20.951329	No	\N
108	73	1	10	826735654	muianga	119	88	\N		2023-11-15 13:17:03.542357	No	\N
122	88	50	1	841638839	ermelinda	101	89	\N		2023-11-15 13:20:44.420138	No	\N
123	88	50	10	841638839	isabel	101	90	\N		2023-11-15 13:20:44.420138	No	\N
105	94	2	22	828888888	Maria Jose	125	91	\N		2023-11-15 13:16:21.093471	No	\N
106	94	3	17		tereza	103	92	\N		2023-11-15 13:16:45.387725	No	\N
86	82	10	2		Emilia	139	93	\N		2023-11-15 13:04:00.792881	No	\N
101	93	10	1		antonio	103	94	\N		2023-11-15 13:15:57.264551	No	\N
102	93	29	12		Feijao	103	95	\N		2023-11-15 13:15:57.264551	No	\N
87	67	10	1	820000000	Edson Moreira	145	96	\N		2023-11-15 13:09:28.886861	No	\N
88	67	20	10	840000000	Marcia Jasse	145	97	\N		2023-11-15 13:09:28.886861	No	\N
93	67	5	3		Jose	1	98	\N		2023-11-15 13:13:27.085234	No	\N
119	95	6	19		joana	109	99	\N		2023-11-15 13:19:20.951329	No	\N
80	79	1	2			119	100	\N		2023-11-15 12:36:52.175701	No	\N
91	96	2	16	846000000	ana	115	102	\N		2023-11-15 13:12:52.104572	No	\N
84	79	13	6			119	\N	\N		2023-11-15 12:36:52.175701	Yes	2023-11-15 00:00:00
138	98	53	23	870157624	Millene	105	\N	\N		2023-11-15 13:20:57.011076	Yes	2023-11-15 00:00:00
114	88	5	10		elisa	4	56	\N		2023-11-15 13:19:07.69122	Yes	2023-11-15 00:00:00
136	98	50	4	820157624	Gertrudes 	105	\N	\N		2023-11-15 13:20:57.011076	Yes	2023-11-15 00:00:00
121	88	5	3			4	68	\N		2023-11-15 13:19:56.501261	Yes	2023-11-15 00:00:00
104	94	2	17	867777777	Joana Carlos	125	73	\N		2023-11-15 13:16:21.093471	No	\N
149	77	20	8	820868037	Sandra	123	79	\N		2023-11-15 13:31:53.839138	No	\N
107	73	1	1	826735654	muinga	119	80	\N		2023-11-15 13:17:03.542357	No	\N
148	77	20	16	820868037	Sandra	123	82	\N		2023-11-15 13:31:53.839138	No	\N
150	77	42	23	820868037	Sandra	123	87	\N		2023-11-15 13:31:53.839138	No	\N
152	89	20	18			8	\N	\N		2023-11-15 13:36:54.320541	No	\N
153	89	10	15		Maria	8	\N	\N		2023-11-15 13:36:54.320541	No	\N
154	89	20	8			8	\N	\N		2023-11-15 13:36:54.320541	No	\N
120	95	2	6		vitoria	109	101	\N		2023-11-15 13:19:20.951329	No	\N
151	89	10	1			8	103	\N		2023-11-15 13:36:54.320541	No	\N
137	98	38	15	840157624	Nilza	105	\N	\N		2023-11-15 13:20:57.011076	Yes	2023-11-15 00:00:00
85	79	12	7			119	\N	\N		2023-11-15 12:36:52.175701	Yes	2023-11-15 00:00:00
155	67	2	2		Ponto focal albase	24	\N	\N		2023-11-16 10:26:35.679633	No	\N
156	67	5	5	849004534	Pf Mavalane	24	\N	\N		2023-11-16 10:26:35.679633	No	\N
157	67	1	8			24	\N	\N		2023-11-16 10:26:35.679633	No	\N
160	101	45	5	832046790	Lina	147	\N	\N		2023-11-16 10:45:38.223314	No	\N
162	100	47	40			149	\N	\N		2023-11-16 10:47:18.30581	No	\N
161	100	50	46	826190563	ISA	149	104	\N		2023-11-16 10:47:18.30581	No	\N
158	101	23	16	876023011	Latifo Banze	147	105	\N		2023-11-16 10:45:38.223314	No	\N
159	101	12	12	841112450	Meriba Mazive	147	106	\N		2023-11-16 10:45:38.223314	No	\N
163	100	109	41	845678333	Dongo	149	107	\N		2023-11-16 10:47:18.30581	No	\N
\.


--
-- Data for Name: role; Type: TABLE DATA; Schema: api; Owner: sidmat
--

COPY api.role (id, name, description) FROM stdin;
29	Logistica	\N
30	Requisitante	\N
31	Motorista	\N
32	Admin	\N
\.


--
-- Data for Name: status; Type: TABLE DATA; Schema: api; Owner: sidmat
--

COPY api.status (id, name) FROM stdin;
1	NOVA
2	PROCESSAMENTO
3	A CAMINHO
4	ENTREGUE
5	CANCELADA
\.


--
-- Data for Name: unidade_sanitaria; Type: TABLE DATA; Schema: api; Owner: sidmat
--

COPY api.unidade_sanitaria (nome, distrito, id) FROM stdin;
1 de Junho PS	1	1
Albasine PS	1	2
Hulene PSA	1	3
Mavalane CS	1	4
Mavalane HG	1	5
Pescadores PS	1	6
Romão PSA	1	7
1º de Maio PS	2	8
Polana Caniço CS II	2	9
Alto-Maé CSURB	3	10
HCM Pediatrico	3	11
Malhangalene CS	3	12
Maxaquene CSURB	3	13
Polana Cimento CSURB	3	14
Porto CSURB	3	15
Bagamoio CS III	4	16
HPI	4	17
Inhagoia PS	4	18
Magoanine PS	4	19
Magoanine Tenda PSA	4	20
Zimpeto PS	4	21
Inhaca PS	5	22
Catembe CS II	6	23
Incassane	6	24
Chamanculo CS	7	25
Jose Macamo CS	7	26
José Macamo HG	7	27
Xipamanine CSURB	7	28
OCB – Kuyakana	1	40
OCB – RENCONTRO	1	41
OCB-KUTENGA	2	42
TDM FORMACOES	3	43
OCB-ASCODECHA	7	44
CS Chamissava	6	45
OCB-HIXIKAMWE	4	46
HEAD OFFICE	3	47
DEPOSITO DE MEDICAMENTOS	3	48
SERVICOS DE SAUDE DA CIDADE DE MAPUTO – SSCM	3	49
ESCOLA SECUNDARIA EDUARDO MONDLANE	8	50
ESCOLA SECUNDARIA ESTRELA VERMELHA	8	51
ESCOLA SECUNDARIA FRANCISCO MANYANGA	8	52
ESCOLA SECUNDARIA SAMORA MACHEL	8	53
ESCOLA COMUNITARIA DA POLANA	8	54
ESCOLA SECUNDARIA SANTO ANTONIO DA POLANA	8	55
\.


--
-- Data for Name: user_logs; Type: TABLE DATA; Schema: api; Owner: sidmat
--

COPY api.user_logs (id, date, area, total_material_importado, notification_sent) FROM stdin;
\.


--
-- Data for Name: user_role; Type: TABLE DATA; Schema: api; Owner: sidmat
--

COPY api.user_role (id, user_id, role_id) FROM stdin;
1	3	30
2	5	30
4	7	29
6	10	30
7	11	30
12	25	30
25	52	31
26	54	30
27	56	29
28	58	29
29	60	29
30	62	29
31	64	29
32	66	29
33	68	29
34	70	31
35	72	31
36	74	31
37	76	31
38	78	31
39	80	31
40	82	31
41	84	31
42	86	31
43	88	31
44	90	31
45	92	31
46	94	31
47	96	31
48	98	31
49	100	30
50	102	30
51	104	30
52	106	30
53	108	30
54	110	30
55	112	30
56	114	30
57	116	30
58	118	30
59	120	30
60	122	30
61	124	30
62	126	30
63	128	30
64	130	30
65	132	30
66	134	30
67	136	30
68	138	30
69	140	30
70	142	30
71	144	30
72	146	30
73	148	30
74	150	30
\.


--
-- Data for Name: usuario; Type: TABLE DATA; Schema: api; Owner: sidmat
--

COPY api.usuario (id, username, password, colaborador, status) FROM stdin;
25	agnaldosamuel@ccsaude.org.mz	8845ea08c808e8798f20f78a85b20336	24	Active
7	nunomoura@ccsaude.org.mz	8845ea08c808e8798f20f78a85b20336	6	Active
52	sevenemario9@ccsaude.org.mz	2639dd4cf9567171caf0ea498c94e5f9	51	Active
54	denilsonmucavele@ccsaude.org.mz	3fc0a7acf087f549ac2b266baf94b8b1	53	Active
56	admin@ccsaude.org.mz	0192023a7bbd73250516f069df18b500	55	Active
58	armindocoana@ccsaude.org.mz	bb96bd329b62c028ec6d132f89211d0b	57	Active
60	hugoazevedo@ccsaude.org.mz	50f8bf21955bf75b27504443b84422d8	59	Active
62	albertomagalhaes@ccsaude.org.mz	fc6227b100511f17870d68cf875183ba	61	Active
64	deciogomes@ccsaude.org.mz	1e22eee5a3acea28181be44300977e25	63	Active
66	shitalmobaracaly@ccsaude.org.mz	80c9f89e9c343b8dacd399772edc89ce	65	Active
68	paulinojunior@ccsaude.org.mz	377c4b3fafcc77ebd48faedd1e7960f3	67	Active
70	motorista10@ccsaude.org.mz	85d7d7e650e8882737ef481d3a8badad	69	Active
72	issufotava@ccsaude.org.mz	85d7d7e650e8882737ef481d3a8badad	71	Active
74	motorista1@ccsaude.org.mz	85d7d7e650e8882737ef481d3a8badad	73	Active
76	sergiotamele@ccsaude.org.mz	85d7d7e650e8882737ef481d3a8badad	75	Active
78	motorista2@ccsaude.org.mz	85d7d7e650e8882737ef481d3a8badad	77	Active
80	fernandoxerinda@ccsaude.org.mz	85d7d7e650e8882737ef481d3a8badad	79	Active
82	josebasilio@ccsaude.org.mz	f8e7f2c96c12d1d0115bace2f3c90a1b	81	Active
84	motorista3@ccsaude.org.mz	85d7d7e650e8882737ef481d3a8badad	83	Active
86	danielbernardo@ccsaude.org.mz	22a3e28d5c82bbb8fdf46d931bed6bbe	85	Active
88	sergiomadede@ccsaude.org.mz	3bdc4e0e99b25cd29616f2d99713a62d	87	Active
90	sunilbudia@ccsaude.org.mz	7fde427b1940b385b08f3136cd528612	89	Active
92	cesarmualiolane@ccsaude.org.mz	85d7d7e650e8882737ef481d3a8badad	91	Active
94	pedrolanga@ccsaude-org.mz	3bdc4e0e99b25cd29616f2d99713a62d	93	Active
96	silvasousa@ccsaude.org.mz	c697ca9a1969e7e125c208dec5ff8ba8	95	Active
98	fornecedor@ccsaude.org.mz	06ade7c7ac320844b69d0b477adad4a5	97	Active
100	editeguila@ccsaude.org.mz	6e837e7b02a1d8addd019f2cce0c9bd0	99	Active
102	ermelindafumo@ccsaude.org.mz	0ea1206b3ad6fba5120ce1a93c201846	101	Active
106	aventinacardoso@ccsaude.org.mz	516f6ba0d4827e6842cb53b941e66ec8	105	Active
108	moisesdias@ccsaude.org.mz	ec41ea40fd7aaee696e94436c05e3aed	107	Active
110	nadiaamade@ccsaude.org.mz	d45fa6bcf9224c9164171bca5f2806b8	109	Active
112	marilenemadivadua@ccsaude.org.mz	3f6ec19d1ec7352833ec184be3c5f96c	111	Active
114	tatianafonseca@ccsaude.org.mz	44bfdafba4567701755f1fdd39d41209	113	Active
116	adielozacarias@ccsaude.org.mz	6dbcfddeea79bcc5d371429bc9cc18f7	115	Active
118	jonasdeve@ccsaude.org.mz	d307844437ff2dba5cdf4866a7897b4f	117	Active
10	brigidamavie@ccsaude.org.mz	9b674ec1037a07f9d66b6efa384d393d	9	Active
5	bibialy@ccsaude.org.mz	f16d0dbba70103b88f7d0ff154ca5fe1	4	Active
11	mairamarra@ccsaude.org.mz	a43b7a40fe6e9f1b7311129759397129	8	Active
3	mauriciotimecane@ccsaude.org.mz	01cbcf54de2786fd85ae3e8c62a55cbd	1	Active
120	oliviamocambique@ccsaude.org.mz	c4a76e2c6b96f97ad7147de7976e3491	119	Active
122	florbelabata@ccsaude.org.mz	db9bb18698c65736fd4a706d373ff3ae	121	Active
104	selmakhan@ccsaude.org.mz	89afc8aa4e817f160d347b7d7632d47f	103	Active
124	mariasilva@ccsaude.org.mz	0ee953fee2227d36c3fce0b7f14c9fb8	123	Active
126	rosapedro@ccsaude.org.mz	aaa5eb5f0ab8636b7e8618b86ec099a8	125	Active
128	JulioHolauene@ccsaude.org.mz	c4721efc659c512d70fb77b26bd40e1d	127	Active
130	manuelmuianga@ccsaude.org.mz	5b2e512f434743988ece3c25dcd688ff	129	Active
132	celinadomingos@ccsaude.org.mz	bc7e46eeea2014dd2c70c75c09243360	131	Active
134	inocenciotamele@ccsaude.org.mz	06b325be547a45c6cd4e087dfd85085b	133	Active
138	analampiao@ccsaude.org.mz	c5dc0349c114afbb5b5255730ad5321b	137	Active
136	celinadomingoss@ccsaude.org.mz	bc7e46eeea2014dd2c70c75c09243360	135	Inactive
140	celina@ccsaude.org.mz	bc7e46eeea2014dd2c70c75c09243360	139	Active
142	justinomachonisse@ccsaude.org.mz	7e57f13f15ce0df8cb358c14f26590f0	141	Active
144	alcinobuque@ccsaude.org.mz	7a5f3925ad45559080425831518b7315	143	Active
146	buque@ccsaude.org.mz	7a5f3925ad45559080425831518b7315	145	Active
148	nogaruateca@ccsaude.org.mz	1d2fae0e9b1548685fb8b5b18430e501	147	Active
150	eunicefrancisco@ccsaude.org.mz	9c7f47f1d6b19e7ecc833b79528b6d95	149	Active
\.


--
-- Name: are_id_seq; Type: SEQUENCE SET; Schema: api; Owner: sidmat
--

SELECT pg_catalog.setval('api.are_id_seq', 36, true);


--
-- Name: armazem_id_seq; Type: SEQUENCE SET; Schema: api; Owner: sidmat
--

SELECT pg_catalog.setval('api.armazem_id_seq', 3, true);


--
-- Name: colab_area_id_seq; Type: SEQUENCE SET; Schema: api; Owner: sidmat
--

SELECT pg_catalog.setval('api.colab_area_id_seq', 73, true);


--
-- Name: colaborador_id_seq; Type: SEQUENCE SET; Schema: api; Owner: sidmat
--

SELECT pg_catalog.setval('api.colaborador_id_seq', 1, false);


--
-- Name: colaborador_role_id_seq; Type: SEQUENCE SET; Schema: api; Owner: sidmat
--

SELECT pg_catalog.setval('api.colaborador_role_id_seq', 1, false);


--
-- Name: distrito_id_seq; Type: SEQUENCE SET; Schema: api; Owner: sidmat
--

SELECT pg_catalog.setval('api.distrito_id_seq', 7, true);


--
-- Name: guia_saida_id_seq; Type: SEQUENCE SET; Schema: api; Owner: sidmat
--

SELECT pg_catalog.setval('api.guia_saida_id_seq', 107, true);


--
-- Name: material_id_seq; Type: SEQUENCE SET; Schema: api; Owner: sidmat
--

SELECT pg_catalog.setval('api.material_id_seq', 101, true);


--
-- Name: onedrive_image_id_seq; Type: SEQUENCE SET; Schema: api; Owner: sidmat
--

SELECT pg_catalog.setval('api.onedrive_image_id_seq', 1, false);


--
-- Name: projecto_id_seq; Type: SEQUENCE SET; Schema: api; Owner: sidmat
--

SELECT pg_catalog.setval('api.projecto_id_seq', 1, false);


--
-- Name: projecto_image_id_seq; Type: SEQUENCE SET; Schema: api; Owner: sidmat
--

SELECT pg_catalog.setval('api.projecto_image_id_seq', 3, true);


--
-- Name: requisicao_id_seq; Type: SEQUENCE SET; Schema: api; Owner: sidmat
--

SELECT pg_catalog.setval('api.requisicao_id_seq', 163, true);


--
-- Name: status_id_seq; Type: SEQUENCE SET; Schema: api; Owner: sidmat
--

SELECT pg_catalog.setval('api.status_id_seq', 5, true);


--
-- Name: unidade_sanitaria_id_seq; Type: SEQUENCE SET; Schema: api; Owner: sidmat
--

SELECT pg_catalog.setval('api.unidade_sanitaria_id_seq', 34, true);


--
-- Name: usuario_id_seq; Type: SEQUENCE SET; Schema: api; Owner: sidmat
--

SELECT pg_catalog.setval('api.usuario_id_seq', 150, true);


--
-- Name: usuario_role_seq; Type: SEQUENCE SET; Schema: api; Owner: sidmat
--

SELECT pg_catalog.setval('api.usuario_role_seq', 74, true);


--
-- Name: area area_pkey; Type: CONSTRAINT; Schema: api; Owner: sidmat
--

ALTER TABLE ONLY api.area
    ADD CONSTRAINT area_pkey PRIMARY KEY (id);


--
-- Name: armazem armazem_pk; Type: CONSTRAINT; Schema: api; Owner: sidmat
--

ALTER TABLE ONLY api.armazem
    ADD CONSTRAINT armazem_pk PRIMARY KEY (id);


--
-- Name: colaborador_area colaborador_area_pk; Type: CONSTRAINT; Schema: api; Owner: sidmat
--

ALTER TABLE ONLY api.colaborador_area
    ADD CONSTRAINT colaborador_area_pk PRIMARY KEY (id);


--
-- Name: colaborador colaborador_pkey; Type: CONSTRAINT; Schema: api; Owner: sidmat
--

ALTER TABLE ONLY api.colaborador
    ADD CONSTRAINT colaborador_pkey PRIMARY KEY (id);


--
-- Name: distrito distrito_pkey; Type: CONSTRAINT; Schema: api; Owner: sidmat
--

ALTER TABLE ONLY api.distrito
    ADD CONSTRAINT distrito_pkey PRIMARY KEY (id);


--
-- Name: guia_saida guia_saida_pk; Type: CONSTRAINT; Schema: api; Owner: sidmat
--

ALTER TABLE ONLY api.guia_saida
    ADD CONSTRAINT guia_saida_pk PRIMARY KEY (id);


--
-- Name: material material_pkey; Type: CONSTRAINT; Schema: api; Owner: sidmat
--

ALTER TABLE ONLY api.material
    ADD CONSTRAINT material_pkey PRIMARY KEY (id);


--
-- Name: onedrive_image onedrive_image_pk; Type: CONSTRAINT; Schema: api; Owner: sidmat
--

ALTER TABLE ONLY api.onedrive_image
    ADD CONSTRAINT onedrive_image_pk PRIMARY KEY (id);


--
-- Name: projecto projecto_pk; Type: CONSTRAINT; Schema: api; Owner: sidmat
--

ALTER TABLE ONLY api.projecto
    ADD CONSTRAINT projecto_pk PRIMARY KEY (id);


--
-- Name: requisicao requisicao_pk; Type: CONSTRAINT; Schema: api; Owner: sidmat
--

ALTER TABLE ONLY api.requisicao
    ADD CONSTRAINT requisicao_pk PRIMARY KEY (id);


--
-- Name: role role_unique_constraint; Type: CONSTRAINT; Schema: api; Owner: sidmat
--

ALTER TABLE ONLY api.role
    ADD CONSTRAINT role_unique_constraint UNIQUE (id);


--
-- Name: status status_pk; Type: CONSTRAINT; Schema: api; Owner: sidmat
--

ALTER TABLE ONLY api.status
    ADD CONSTRAINT status_pk PRIMARY KEY (id);


--
-- Name: unidade_sanitaria unidade_sanitaria_pk; Type: CONSTRAINT; Schema: api; Owner: sidmat
--

ALTER TABLE ONLY api.unidade_sanitaria
    ADD CONSTRAINT unidade_sanitaria_pk PRIMARY KEY (id);


--
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: api; Owner: sidmat
--

ALTER TABLE ONLY api.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (id);


--
-- Name: user_logs_id_uindex; Type: INDEX; Schema: api; Owner: sidmat
--

CREATE UNIQUE INDEX user_logs_id_uindex ON api.user_logs USING btree (id);


--
-- Name: requisicao trg_update_date_cancelled; Type: TRIGGER; Schema: api; Owner: sidmat
--

CREATE TRIGGER trg_update_date_cancelled AFTER UPDATE OF canceled ON api.requisicao FOR EACH ROW EXECUTE FUNCTION api.fn_update_date_cancelled();


--
-- Name: requisicao update_stock; Type: TRIGGER; Schema: api; Owner: sidmat
--

CREATE TRIGGER update_stock AFTER INSERT ON api.requisicao FOR EACH ROW EXECUTE FUNCTION api.update_stock();


--
-- Name: colaborador_area colaborador_area_area_id_fk; Type: FK CONSTRAINT; Schema: api; Owner: sidmat
--

ALTER TABLE ONLY api.colaborador_area
    ADD CONSTRAINT colaborador_area_area_id_fk FOREIGN KEY (area) REFERENCES api.area(id);


--
-- Name: colaborador_area colaborador_area_colaborador_id_fk; Type: FK CONSTRAINT; Schema: api; Owner: sidmat
--

ALTER TABLE ONLY api.colaborador_area
    ADD CONSTRAINT colaborador_area_colaborador_id_fk FOREIGN KEY (colaborador) REFERENCES api.colaborador(id);


--
-- Name: guia_saida guia_saida_area_id_fk; Type: FK CONSTRAINT; Schema: api; Owner: sidmat
--

ALTER TABLE ONLY api.guia_saida
    ADD CONSTRAINT guia_saida_area_id_fk FOREIGN KEY (area) REFERENCES api.area(id);


--
-- Name: guia_saida guia_saida_colaborador_id_fk; Type: FK CONSTRAINT; Schema: api; Owner: sidmat
--

ALTER TABLE ONLY api.guia_saida
    ADD CONSTRAINT guia_saida_colaborador_id_fk FOREIGN KEY (motorista) REFERENCES api.colaborador(id);


--
-- Name: guia_saida guia_saida_onedrive_image_id_fk; Type: FK CONSTRAINT; Schema: api; Owner: sidmat
--

ALTER TABLE ONLY api.guia_saida
    ADD CONSTRAINT guia_saida_onedrive_image_id_fk FOREIGN KEY (foto_id) REFERENCES api.onedrive_image(id);


--
-- Name: guia_saida guia_saida_status_id_fk; Type: FK CONSTRAINT; Schema: api; Owner: sidmat
--

ALTER TABLE ONLY api.guia_saida
    ADD CONSTRAINT guia_saida_status_id_fk FOREIGN KEY (status) REFERENCES api.status(id);


--
-- Name: guia_saida guia_saida_unidade_sanitaria_id_fk; Type: FK CONSTRAINT; Schema: api; Owner: sidmat
--

ALTER TABLE ONLY api.guia_saida
    ADD CONSTRAINT guia_saida_unidade_sanitaria_id_fk FOREIGN KEY (unidade_sanitaria) REFERENCES api.unidade_sanitaria(id);


--
-- Name: material material_area_id_fk; Type: FK CONSTRAINT; Schema: api; Owner: sidmat
--

ALTER TABLE ONLY api.material
    ADD CONSTRAINT material_area_id_fk FOREIGN KEY (area) REFERENCES api.area(id);


--
-- Name: material material_armazem_id_fk; Type: FK CONSTRAINT; Schema: api; Owner: sidmat
--

ALTER TABLE ONLY api.material
    ADD CONSTRAINT material_armazem_id_fk FOREIGN KEY (armazem) REFERENCES api.armazem(id);


--
-- Name: material material_projecto_id_fk; Type: FK CONSTRAINT; Schema: api; Owner: sidmat
--

ALTER TABLE ONLY api.material
    ADD CONSTRAINT material_projecto_id_fk FOREIGN KEY (projecto) REFERENCES api.projecto(id);


--
-- Name: requisicao requisicao_colaborador_id_fk; Type: FK CONSTRAINT; Schema: api; Owner: sidmat
--

ALTER TABLE ONLY api.requisicao
    ADD CONSTRAINT requisicao_colaborador_id_fk FOREIGN KEY (requisitante) REFERENCES api.colaborador(id);


--
-- Name: requisicao requisicao_guia_saida_id_fk; Type: FK CONSTRAINT; Schema: api; Owner: sidmat
--

ALTER TABLE ONLY api.requisicao
    ADD CONSTRAINT requisicao_guia_saida_id_fk FOREIGN KEY (nr_guia) REFERENCES api.guia_saida(id);


--
-- Name: requisicao requisicao_material_id_fk; Type: FK CONSTRAINT; Schema: api; Owner: sidmat
--

ALTER TABLE ONLY api.requisicao
    ADD CONSTRAINT requisicao_material_id_fk FOREIGN KEY (material) REFERENCES api.material(id);


--
-- Name: requisicao requisicao_unidade_sanitaria_id_fk; Type: FK CONSTRAINT; Schema: api; Owner: sidmat
--

ALTER TABLE ONLY api.requisicao
    ADD CONSTRAINT requisicao_unidade_sanitaria_id_fk FOREIGN KEY (unidade_sanitaria) REFERENCES api.unidade_sanitaria(id);


--
-- Name: unidade_sanitaria unidade_sanitaria_distrito_fk; Type: FK CONSTRAINT; Schema: api; Owner: sidmat
--

ALTER TABLE ONLY api.unidade_sanitaria
    ADD CONSTRAINT unidade_sanitaria_distrito_fk FOREIGN KEY (distrito) REFERENCES api.distrito(id);


--
-- Name: user_role user_id; Type: FK CONSTRAINT; Schema: api; Owner: sidmat
--

ALTER TABLE ONLY api.user_role
    ADD CONSTRAINT user_id FOREIGN KEY (user_id) REFERENCES api.usuario(id);


--
-- Name: user_logs user_logs_area_id_fk; Type: FK CONSTRAINT; Schema: api; Owner: sidmat
--

ALTER TABLE ONLY api.user_logs
    ADD CONSTRAINT user_logs_area_id_fk FOREIGN KEY (area) REFERENCES api.area(id);


--
-- Name: user_role user_role_role_id_fk; Type: FK CONSTRAINT; Schema: api; Owner: sidmat
--

ALTER TABLE ONLY api.user_role
    ADD CONSTRAINT user_role_role_id_fk FOREIGN KEY (role_id) REFERENCES api.role(id);


--
-- Name: usuario usuario_colaborador_id_fk; Type: FK CONSTRAINT; Schema: api; Owner: sidmat
--

ALTER TABLE ONLY api.usuario
    ADD CONSTRAINT usuario_colaborador_id_fk FOREIGN KEY (colaborador) REFERENCES api.colaborador(id);


--
-- Name: SCHEMA api; Type: ACL; Schema: -; Owner: sidmat
--

GRANT USAGE ON SCHEMA api TO web_anon;


--
-- Name: FUNCTION fn_update_date_cancelled(); Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON FUNCTION api.fn_update_date_cancelled() TO web_anon;


--
-- Name: FUNCTION sp_insert_onedrive_image(nr_guiasaida character varying, id_image character varying, image_name character varying, image_viewlink character varying); Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON FUNCTION api.sp_insert_onedrive_image(nr_guiasaida character varying, id_image character varying, image_name character varying, image_viewlink character varying) TO web_anon;


--
-- Name: SEQUENCE are_id_seq; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,UPDATE ON SEQUENCE api.are_id_seq TO web_anon;


--
-- Name: TABLE area; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.area TO web_anon;


--
-- Name: SEQUENCE armazem_id_seq; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,UPDATE ON SEQUENCE api.armazem_id_seq TO web_anon;


--
-- Name: TABLE armazem; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.armazem TO web_anon;


--
-- Name: SEQUENCE colab_area_id_seq; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,UPDATE ON SEQUENCE api.colab_area_id_seq TO web_anon;


--
-- Name: SEQUENCE usuario_id_seq; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,UPDATE ON SEQUENCE api.usuario_id_seq TO web_anon;


--
-- Name: TABLE colaborador; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.colaborador TO web_anon;


--
-- Name: TABLE colaborador_area; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.colaborador_area TO web_anon;


--
-- Name: SEQUENCE colaborador_id_seq; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,UPDATE ON SEQUENCE api.colaborador_id_seq TO web_anon;


--
-- Name: SEQUENCE colaborador_role_id_seq; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,UPDATE ON SEQUENCE api.colaborador_role_id_seq TO web_anon;


--
-- Name: SEQUENCE distrito_id_seq; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,UPDATE ON SEQUENCE api.distrito_id_seq TO web_anon;


--
-- Name: TABLE distrito; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.distrito TO web_anon;


--
-- Name: SEQUENCE guia_saida_id_seq; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,UPDATE ON SEQUENCE api.guia_saida_id_seq TO web_anon;


--
-- Name: TABLE guia_saida; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.guia_saida TO web_anon;


--
-- Name: SEQUENCE material_id_seq; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,UPDATE ON SEQUENCE api.material_id_seq TO web_anon;


--
-- Name: TABLE material; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.material TO web_anon;


--
-- Name: SEQUENCE onedrive_image_id_seq; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,UPDATE ON SEQUENCE api.onedrive_image_id_seq TO web_anon;


--
-- Name: TABLE onedrive_image; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.onedrive_image TO web_anon;


--
-- Name: SEQUENCE projecto_image_id_seq; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,UPDATE ON SEQUENCE api.projecto_image_id_seq TO web_anon;


--
-- Name: TABLE projecto; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.projecto TO web_anon;


--
-- Name: SEQUENCE projecto_id_seq; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,UPDATE ON SEQUENCE api.projecto_id_seq TO web_anon;


--
-- Name: SEQUENCE requisicao_id_seq; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,UPDATE ON SEQUENCE api.requisicao_id_seq TO web_anon;


--
-- Name: TABLE requisicao; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.requisicao TO web_anon;


--
-- Name: SEQUENCE unidade_sanitaria_id_seq; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,UPDATE ON SEQUENCE api.unidade_sanitaria_id_seq TO web_anon;


--
-- Name: TABLE role; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.role TO web_anon;


--
-- Name: SEQUENCE status_id_seq; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,UPDATE ON SEQUENCE api.status_id_seq TO web_anon;


--
-- Name: TABLE status; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.status TO web_anon;


--
-- Name: TABLE unidade_sanitaria; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.unidade_sanitaria TO web_anon;


--
-- Name: TABLE user_logs; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.user_logs TO web_anon;


--
-- Name: SEQUENCE usuario_role_seq; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,UPDATE ON SEQUENCE api.usuario_role_seq TO web_anon;


--
-- Name: TABLE user_role; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.user_role TO web_anon;


--
-- Name: TABLE user_roles; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.user_roles TO web_anon;


--
-- Name: TABLE usuario; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.usuario TO web_anon;


--
-- Name: TABLE view_get_requisicoes_by_nr_guia; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.view_get_requisicoes_by_nr_guia TO web_anon;


--
-- Name: TABLE vw_all_colaboradores; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.vw_all_colaboradores TO web_anon;


--
-- Name: TABLE vw_all_requisicoes_by_month; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.vw_all_requisicoes_by_month TO web_anon;


--
-- Name: TABLE vw_authenticate; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.vw_authenticate TO web_anon;


--
-- Name: TABLE vw_confirmacao_guia; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT ON TABLE api.vw_confirmacao_guia TO web_anon;


--
-- Name: TABLE vw_get_motoristas; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.vw_get_motoristas TO web_anon;


--
-- Name: TABLE vw_guias_saida; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.vw_guias_saida TO web_anon;


--
-- Name: TABLE vw_material_by_id; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.vw_material_by_id TO web_anon;


--
-- Name: TABLE vw_material_disponivel; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.vw_material_disponivel TO web_anon;


--
-- Name: TABLE vw_material_logistica; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.vw_material_logistica TO web_anon;


--
-- Name: TABLE vw_material_solcitado_by_area_us; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.vw_material_solcitado_by_area_us TO web_anon;


--
-- Name: TABLE vw_my_requisicao; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT ON TABLE api.vw_my_requisicao TO web_anon;


--
-- Name: TABLE vw_novo_material; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.vw_novo_material TO web_anon;


--
-- Name: TABLE vw_requisicao_by_area; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.vw_requisicao_by_area TO web_anon;


--
-- Name: TABLE vw_requisicao_by_guia; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.vw_requisicao_by_guia TO web_anon;


--
-- Name: TABLE vw_requisicoes_by_distrito; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.vw_requisicoes_by_distrito TO web_anon;


--
-- Name: TABLE vw_requisicoes_by_month; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.vw_requisicoes_by_month TO web_anon;


--
-- Name: TABLE vw_requisicoes_pendentes; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT ON TABLE api.vw_requisicoes_pendentes TO web_anon;


--
-- Name: TABLE vw_sumario_requisicoes_pendentes; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.vw_sumario_requisicoes_pendentes TO web_anon;


--
-- Name: TABLE vw_unidades_sanitarias; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.vw_unidades_sanitarias TO web_anon;


--
-- PostgreSQL database dump complete
--

