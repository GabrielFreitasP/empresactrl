-- Criação do banco de dados
CREATE DATABASE "gabrielfp"
ENCODING 'UFT-8'
TEMPLATE = template0
CONNECTION LIMIT 10;

-- Criação da tabela de Cargo
CREATE TABLE tb_cargo (
id_cargo	SERIAL,
descricao	VARCHAR(20) CONSTRAINT nn_cargo_descricao NOT NULL,
CONSTRAINT pk_cargo_id_cargo PRIMARY KEY (id_cargo)
);

-- Preenche a tabela de cargo
INSERT INTO tb_cargo
VALUES (1, 'Programador'),
	(2, 'Designer'),
	(3, 'Administração');

-- Criação da tabela de Login
CREATE TABLE tb_login (
id_login		SERIAL,
email			VARCHAR(60) CONSTRAINT u_nn_login_email UNIQUE NOT NULL,
senha			VARCHAR(32) CONSTRAINT nn_login_senha NOT NULL,
permissao_admin	BOOLEAN CONSTRAINT nn_login_permissa_admin NOT NULL,
CONSTRAINT pk_login_id_login PRIMARY KEY (id_login)
);

-- Login fixo de administrador
INSERT INTO tb_login (id_login, email, senha, permissao_admin)
VALUES (default, 'admin@admin.com', md5('admin'), true);

-- Criação da tabela de Empresa
CREATE TABLE tb_empresa (
id_empresa	SERIAL,
id_login	INTEGER CONSTRAINT nn_empresa_id_login NOT NULL,
nome		VARCHAR(200) CONSTRAINT nn_empresa_nome NOT NULL,
telefone	VARCHAR(12) CONSTRAINT nn_empresa_telefone NOT NULL,
cep			VARCHAR(8) CONSTRAINT nn_empresa_cep NOT NULL,
logradouro	VARCHAR(200) CONSTRAINT nn_empresa_logradouro NOT NULL,
nro			INTEGER,
complemento	VARCHAR(200),
bairro		VARCHAR(200) CONSTRAINT nn_empresa_bairro NOT NULL,
cidade		VARCHAR(200) CONSTRAINT nn_empresa_cidade NOT NULL,
uf			CHAR(2) CONSTRAINT nn_empresa_uf NOT NULL,
CONSTRAINT pk_empresa_id_empresa PRIMARY KEY (id_empresa),
CONSTRAINT fk_empresa_id_login FOREIGN KEY (id_login)
	REFERENCES tb_login (id_login)
);

-- Criação da tabela de Funcionário
CREATE TABLE tb_funcionario (
id_funcionario	SERIAL,
id_empresa		INTEGER CONSTRAINT nn_funcionario_id_empresa NOT NULL,
nome			VARCHAR(200) CONSTRAINT nn_funcionario_nome NOT NULL,
id_cargo		INTEGER CONSTRAINT nn_funcionario_id_cargo NOT NULL,
salario			NUMERIC(11,2) CONSTRAINT nn_funcionario_salario NOT NULL,
CONSTRAINT pk_funiconario_id_funcionario_id_empresa PRIMARY KEY (id_funcionario, id_empresa),
CONSTRAINT fk_funiconario_id_empresa FOREIGN KEY (id_empresa)
	REFERENCES tb_empresa (id_empresa),
CONSTRAINT fk_funiconario_id_cargo FOREIGN KEY (id_cargo)
	REFERENCES tb_cargo (id_cargo)
);

