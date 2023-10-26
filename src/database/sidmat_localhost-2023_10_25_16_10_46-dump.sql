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
    foto_id integer,
    data_entrega date,
    createdby bigint,
    confirmedby bigint
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
    one_drive_id character varying,
    name character varying,
    file text
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
    data_requisicao timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    a.area
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
    p.nome AS projecto
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
1	ACT	Cuidado e Tratamento Adulto	Active
22	RH	Recursos Humanos	Active
2	APSS	Apoio Psicossocial	Active
23	LOGISTICA	Logistica	Active
11	MQ	Melhoria de Qualidade	Active
24	TESTE	Nova Area	Active
17	VBG	Violencia Baseada no Genero	Active
16	TB	Tuberculose	Active
8	FARMACIA	Farmácia	Inactive
25	Motoristas	Motoristas	Active
3	ATS	Aconselhamento e Testagem em Saude	Inactive
12	PCT	Cuidado e Tratamento Adulto	Active
6	DH	Direitos Humanos	Active
21	MANUTENCAO	Manutencao	Active
20	PESQUISA	Pesquisa	Active
18	INFORMATICA	Tecnologias de Informacao	Active
15	SMI/PTV	Saude Materno Infantil/Prevencao de Transmissao Vertical	Active
9	HO	Head Office	Active
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
1	Mauricio Timecane	86 554 3876	mauriciotimecane@ccsaude.org.mz	Assessor de M&A
4	Bibi Aly	83 234 9432	bibialy@ccsaude.org.mz	Assessora de APSS
6	Nuno Moura	82 412 5680	nunomoura@ccsaude.org.mz	Oficial Logístico
8	Maira Marra	84 342 3945	mairamarra@ccsaude.org.mz	Assessora de SMI/PTV
9	Brigida Mavie	82 456 4343	brigidamavie@ccsaude.org.mz	Assessora de VGB
24	Agnaldo Samuel	849004564	agnaldosamuel@ccsaude.org.mz	Gestor de Sistemas
\.


--
-- Data for Name: colaborador_area; Type: TABLE DATA; Schema: api; Owner: sidmat
--

COPY api.colaborador_area (id, area, colaborador) FROM stdin;
1	19	1
4	2	4
5	23	6
6	17	9
7	15	8
11	19	24
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

COPY api.guia_saida (motorista, unidade_sanitaria, previsao_entrega, status, observacao, id, area, data_guia, nr_guia, foto_id, data_entrega, createdby, confirmedby) FROM stdin;
\.


--
-- Data for Name: material; Type: TABLE DATA; Schema: api; Owner: sidmat
--

COPY api.material (id, projecto, armazem, familia, cod, descricao, qtd_stock, area, prazo, data_importacao, notification_status) FROM stdin;
\.


--
-- Data for Name: onedrive_image; Type: TABLE DATA; Schema: api; Owner: sidmat
--

COPY api.onedrive_image (id, one_drive_id, name, file) FROM stdin;
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

COPY api.requisicao (id, material, quantidade, unidade_sanitaria, pf_contacto, pf_nome, requisitante, nr_guia, observacao, notas, data_requisicao) FROM stdin;
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
\.


--
-- Data for Name: usuario; Type: TABLE DATA; Schema: api; Owner: sidmat
--

COPY api.usuario (id, username, password, colaborador, status) FROM stdin;
25	agnaldosamuel@ccsaude.org.mz	8845ea08c808e8798f20f78a85b20336	24	Active
3	mauriciotimecane@ccsaude.org.mz	8845ea08c808e8798f20f78a85b20336	1	Active
7	nunomoura@ccsaude.org.mz	8845ea08c808e8798f20f78a85b20336	6	Active
5	bibialy@ccsaude.org.mz	8845ea08c808e8798f20f78a85b20336	4	Active
10	brigidamavie@ccsaude.org.mz	8845ea08c808e8798f20f78a85b20336	9	Active
11	mairamarra@ccsaude.org.mz	8845ea08c808e8798f20f78a85b20336	8	Active
\.


--
-- Name: are_id_seq; Type: SEQUENCE SET; Schema: api; Owner: sidmat
--

SELECT pg_catalog.setval('api.are_id_seq', 25, true);


--
-- Name: armazem_id_seq; Type: SEQUENCE SET; Schema: api; Owner: sidmat
--

SELECT pg_catalog.setval('api.armazem_id_seq', 3, true);


--
-- Name: colab_area_id_seq; Type: SEQUENCE SET; Schema: api; Owner: sidmat
--

SELECT pg_catalog.setval('api.colab_area_id_seq', 23, true);


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

SELECT pg_catalog.setval('api.guia_saida_id_seq', 28, true);


--
-- Name: material_id_seq; Type: SEQUENCE SET; Schema: api; Owner: sidmat
--

SELECT pg_catalog.setval('api.material_id_seq', 64, true);


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

SELECT pg_catalog.setval('api.requisicao_id_seq', 47, true);


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

SELECT pg_catalog.setval('api.usuario_id_seq', 50, true);


--
-- Name: usuario_role_seq; Type: SEQUENCE SET; Schema: api; Owner: sidmat
--

SELECT pg_catalog.setval('api.usuario_role_seq', 24, true);


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

GRANT ALL ON SCHEMA api TO web_anon;


--
-- Name: FUNCTION fn_requisicoes_por_distrito(area_name character varying); Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON FUNCTION api.fn_requisicoes_por_distrito(area_name character varying) TO web_anon;


--
-- Name: FUNCTION login_user(username character varying, password character varying); Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON FUNCTION api.login_user(username character varying, password character varying) TO web_anon;


--
-- Name: FUNCTION sp_confirmar_guia_saida(id_guia bigint, driver_id bigint, confirmed_by bigint); Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON FUNCTION api.sp_confirmar_guia_saida(id_guia bigint, driver_id bigint, confirmed_by bigint) TO web_anon;


--
-- Name: FUNCTION sp_create_guia_saida(id_motorista bigint, us bigint, entrega date, notas character varying, id_area bigint, numero_guia character varying, id_requisicao bigint[], projecto character varying); Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON FUNCTION api.sp_create_guia_saida(id_motorista bigint, us bigint, entrega date, notas character varying, id_area bigint, numero_guia character varying, id_requisicao bigint[], projecto character varying) TO web_anon;


--
-- Name: FUNCTION sp_insert_area(name_area character varying, descricao_area character varying); Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON FUNCTION api.sp_insert_area(name_area character varying, descricao_area character varying) TO web_anon;


--
-- Name: FUNCTION sp_insert_armazem(nome_armazem character varying, cod_armazem character varying); Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON FUNCTION api.sp_insert_armazem(nome_armazem character varying, cod_armazem character varying) TO web_anon;


--
-- Name: FUNCTION sp_insert_colaborador(nome_colaborador character varying, emailaddress character varying, contacto_colaborador character varying, funcao_colaborador character varying, id_area bigint, id_role bigint, user_name character varying, pass character varying); Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON FUNCTION api.sp_insert_colaborador(nome_colaborador character varying, emailaddress character varying, contacto_colaborador character varying, funcao_colaborador character varying, id_area bigint, id_role bigint, user_name character varying, pass character varying) TO web_anon;


--
-- Name: FUNCTION sp_insert_projecto(nome_projecto character varying, descricao_projecto character varying); Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON FUNCTION api.sp_insert_projecto(nome_projecto character varying, descricao_projecto character varying) TO web_anon;


--
-- Name: FUNCTION sp_update_area(id_area bigint, area_name character varying, area_descricao character varying); Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON FUNCTION api.sp_update_area(id_area bigint, area_name character varying, area_descricao character varying) TO web_anon;


--
-- Name: FUNCTION sp_update_area_status(id_area bigint, area_status character varying); Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON FUNCTION api.sp_update_area_status(id_area bigint, area_status character varying) TO web_anon;


--
-- Name: FUNCTION sp_update_material(id_material bigint, material_nome character varying, quantidade bigint); Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON FUNCTION api.sp_update_material(id_material bigint, material_nome character varying, quantidade bigint) TO web_anon;


--
-- Name: FUNCTION sp_update_projecto_status(id_projecto bigint, projecto_status character varying); Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON FUNCTION api.sp_update_projecto_status(id_projecto bigint, projecto_status character varying) TO web_anon;


--
-- Name: FUNCTION sp_update_usuario_status(id_usuario bigint, user_status character varying); Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON FUNCTION api.sp_update_usuario_status(id_usuario bigint, user_status character varying) TO web_anon;


--
-- Name: FUNCTION update_stock(); Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON FUNCTION api.update_stock() TO web_anon;


--
-- Name: SEQUENCE are_id_seq; Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON SEQUENCE api.are_id_seq TO web_anon;


--
-- Name: TABLE area; Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON TABLE api.area TO web_anon;


--
-- Name: SEQUENCE armazem_id_seq; Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON SEQUENCE api.armazem_id_seq TO web_anon;


--
-- Name: TABLE armazem; Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON TABLE api.armazem TO web_anon;


--
-- Name: SEQUENCE colab_area_id_seq; Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON SEQUENCE api.colab_area_id_seq TO web_anon;


--
-- Name: SEQUENCE usuario_id_seq; Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON SEQUENCE api.usuario_id_seq TO web_anon;


--
-- Name: TABLE colaborador; Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON TABLE api.colaborador TO web_anon;


--
-- Name: TABLE colaborador_area; Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON TABLE api.colaborador_area TO web_anon;


--
-- Name: SEQUENCE colaborador_id_seq; Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON SEQUENCE api.colaborador_id_seq TO web_anon;


--
-- Name: SEQUENCE colaborador_role_id_seq; Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON SEQUENCE api.colaborador_role_id_seq TO web_anon;


--
-- Name: SEQUENCE distrito_id_seq; Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON SEQUENCE api.distrito_id_seq TO web_anon;


--
-- Name: TABLE distrito; Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON TABLE api.distrito TO web_anon;


--
-- Name: SEQUENCE guia_saida_id_seq; Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON SEQUENCE api.guia_saida_id_seq TO web_anon;


--
-- Name: TABLE guia_saida; Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON TABLE api.guia_saida TO web_anon;


--
-- Name: SEQUENCE material_id_seq; Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON SEQUENCE api.material_id_seq TO web_anon;


--
-- Name: TABLE material; Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON TABLE api.material TO web_anon;


--
-- Name: SEQUENCE onedrive_image_id_seq; Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON SEQUENCE api.onedrive_image_id_seq TO web_anon;


--
-- Name: TABLE onedrive_image; Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON TABLE api.onedrive_image TO web_anon;


--
-- Name: SEQUENCE projecto_image_id_seq; Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON SEQUENCE api.projecto_image_id_seq TO web_anon;


--
-- Name: TABLE projecto; Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON TABLE api.projecto TO web_anon;


--
-- Name: SEQUENCE projecto_id_seq; Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON SEQUENCE api.projecto_id_seq TO web_anon;


--
-- Name: SEQUENCE requisicao_id_seq; Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON SEQUENCE api.requisicao_id_seq TO web_anon;


--
-- Name: TABLE requisicao; Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON TABLE api.requisicao TO web_anon;


--
-- Name: SEQUENCE unidade_sanitaria_id_seq; Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON SEQUENCE api.unidade_sanitaria_id_seq TO web_anon;


--
-- Name: TABLE role; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.role TO web_anon;


--
-- Name: SEQUENCE status_id_seq; Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON SEQUENCE api.status_id_seq TO web_anon;


--
-- Name: TABLE status; Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON TABLE api.status TO web_anon;


--
-- Name: TABLE unidade_sanitaria; Type: ACL; Schema: api; Owner: sidmat
--

GRANT ALL ON TABLE api.unidade_sanitaria TO web_anon;


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

GRANT ALL ON TABLE api.usuario TO web_anon;


--
-- Name: TABLE view_get_requisicoes_by_nr_guia; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.view_get_requisicoes_by_nr_guia TO web_anon;


--
-- Name: TABLE vw_all_colaboradores; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT ON TABLE api.vw_all_colaboradores TO web_anon;


--
-- Name: TABLE vw_all_requisicoes_by_month; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT ON TABLE api.vw_all_requisicoes_by_month TO web_anon;


--
-- Name: TABLE vw_authenticate; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.vw_authenticate TO web_anon;


--
-- Name: TABLE vw_get_motoristas; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.vw_get_motoristas TO web_anon;


--
-- Name: TABLE vw_guias_saida; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT ON TABLE api.vw_guias_saida TO web_anon;


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

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE api.vw_my_requisicao TO web_anon;


--
-- Name: TABLE vw_novo_material; Type: ACL; Schema: api; Owner: sidmat
--

GRANT SELECT ON TABLE api.vw_novo_material TO web_anon;


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

