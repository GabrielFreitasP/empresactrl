// Importação do pacote express
var express = require('express');

// Importação do pacote express-session (Sessão)
var session = require('express-session');

// Cria um objeto express
var app = express();

// Importação o pacote body-parse
var bodyParser = require('body-parser');

// Importação o pacote cors
var core_use = require('cors');

// Importação o pacote do postgresql
var pg = require('pg');

// Correção para análise de campos numéricos
var types = require('pg').types
types.setTypeParser(1700, 'text', parseFloat);


// ----------- Sessão ----------- //

app.engine('html', require('ejs').renderFile);
app.set('views', __dirname + '/front/view');
app.set('view engine', 'html');

// Reconhecer rotas
app.use('/front',express.static(__dirname + '/front'));
app.use('/vendor',express.static(__dirname + '/vendor'));

// Controle de sessão
app.use(session({secret: 'ssshhhhh', resave: true, saveUninitialized: true}));

// Variável de sessão
var sess;

// ----------- Sessão ----------- //


// Fazendo app para usar CORS
app.use(core_use());

// Configurando app para usar body-parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// JSON de configuração de conexão com banco de dados
var config = {
	host: "localhost",
	user: "postgres",
	database: "gabrielfp",
	password: "1234",
	port: 5432,
	max: 10,
	idleTimeoutMills: 30000
}

// Canal de comunicação com o banco de dados
var canal = new pg.Pool(config);

// Chamar telas
app.get('/',function(req,res) {   		
	res.render('empresa-login.html');    
});
app.get('/empresa-login',function(req,res) {   		
	res.render('empresa-login.html');    
});
app.get('/empresa-cadastro',function(req,res) {
	res.render('empresa-cadastro.html');
});

// Telas permitidas apenas para usuários logados
app.get('/empresa-consulta',function(req,res) {    
	// Recebe o objeto de sessão
	sess = req.session;

	// Verifica se existe sessão
	if (sess.email)  {
		if (sess.permissao_admin) {
			res.render('empresa-consulta.html');	
		} else {
			res.render('empresa-detalhes.html');
		}
	} else {
		res.render('empresa-login.html');
	}
});
app.get('/empresa-detalhes',function(req,res) {    
	sess = req.session;
	if (sess.email) {
		res.render('empresa-detalhes.html');
	} else {
		res.render('empresa-login.html');
	}
});

// Encerra sessao
app.get('/logout',function(req,res) {		
	req.session.destroy(function(err) {		
		if (err) {			
			console.log(err);		
		}	
	});
	res.redirect('/empresa-login');	
});


// ----------- Functions Utils ----------- //

function text(value) {
	return value == undefined || value == "" ? null : "\'" + value + "\'";
}

function number(value) {
	return value == undefined || value == "" ? null : value;
}

function removeMask(value) {
	return value.replace(/[^a-z0-9]/gi,'');
}

function isDefined(value) {
	return value != null && value != undefined;
}

// ----------- Functions Utils ----------- //



// ----------- Login ----------- //

// Retorna o email e senha do login para a verificação de entrada
app.post('/logar', function (req, res) {
	// Recebe o objeto de sessão
	sess = req.session;

	// Realiza conexão com o banco
	canal.connect(function(erro, conexao, feito) {
		if (erro) {
			// Retorna o erro no console			
			return console.error('Erro ao conectar no banco: \n', erro);
		}
		
		// Monta a string sql
		var sql = '\nSELECT id_login, email, permissao_admin'
				+ '\nFROM tb_login '
				+ '\nWHERE email = \'' + req.body.email + '\' '
				+ '\nAND senha = (SELECT md5(\'' + req.body.senha + '\')) ';
		console.log(sql);
		
		// Executa a string sql
		conexao.query(sql, function(erro, resultado) {
			
			// Libera a conexão
			feito(); 
 

			if (erro) {
				return console.error('Erro ao seleçao de login: \n', erro);
			}

			// Se não tiver resultado retorna null
			var login = resultado.rows[0];

			if (login != null) {
				sess.email = login.email;
				sess.permissao_admin = login.permissao_admin;
			} 

			// Retorna ao cliente o resultado do select
			res.json(login);
		});
	});
});

// Retorna a quantidade de email para verificar se é unico
app.post('/verificaEmail', function (req, res) {
	// Realiza conexão com o banco
	canal.connect(function(erro, conexao, feito) {
		if (erro) {
			// Retorna o erro no console			
			return console.error('Erro ao conectar no banco: \n', erro);
		}
		
		var sql = '\nSELECT count(*) AS conta '
				+ '\nFROM tb_login '
				+ '\nWHERE email = \'' + req.body.email + '\' ';
		console.log(sql);
		
		// Executa a string sql
		conexao.query(sql, function(erro, resultado) {
			
			// Libera a conexão
			feito(); 

			if (erro) {
				return console.error('Erro verificação de e-mail: \n', erro);
			}

			// Retorna ao cliente o resultado do select
			res.json(resultado.rows[0].conta); 
		});
	});
});

// Realiza a inserção do login
app.post('/insereLogin', function (req, res) {
	// Realiza conexão com o banco
	canal.connect(function(erro, conexao, feito) {
		if (erro) {
			// Retorna o erro no console			
			return console.error('Erro ao conectar no banco: \n', erro);
		}

		var sql = '\nINSERT INTO tb_login (id_login, email, senha, permissao_admin) '
				+ '\nVALUES \n('
				+ 'default, '
				+ '\'' + req.body.email + '\', ' 
				+ '\nmd5(\'' + req.body.senha + '\'), ' 
				+ '\nFALSE'
				+ ');'
				
		console.log(sql);

		// Executa a string sql
		conexao.query(sql, function(erro, resultado) {
			
			// Libera a conexão
			feito(); 

			if (erro) {
				return console.error('Erro na inserção de login: \n', erro);
			}
			res.json(resultado.rows); 
		});
	});
});

// Remove o registro da tabela de login, empresa e funcionário
app.delete('/removeLoginEmpresa/:id_login', function (req, res) {
	// Realiza conexão com o banco
	canal.connect(function(erro, conexao, feito) {
		if (erro) {
			// Retorna o erro no console			
			return console.error('Erro ao conectar no banco: \n', erro);
		}

		// Recebe o id do login passado no parâmetro
		var id_login = req.params.id_login;

		var sql = '\nDELETE FROM tb_funcionario '
				+ '\nWHERE 	id_empresa = (	SELECT 	id_empresa ' 
				+ '\n						FROM 	tb_empresa '
				+ '\n						WHERE 	id_login = ' + id_login + ' '
				+ '\n					 );'
				+ '\n'
				+ '\nDELETE FROM tb_empresa '
				+ '\nWHERE 	id_login = ' + id_login + ';'
				+ '\n'
				+ '\nDELETE FROM tb_login '
				+ '\nWHERE 	id_login = ' + id_login + ';';

		console.log(sql);

		// Executa a string sql
		conexao.query(sql, function(erro, resultado) {
			
			// Libera a conexão
			feito(); 

			if (erro) {
				return console.error('Erro na remoção do login, empresa e funcionarios: \n', erro);
			}
			res.json(resultado.rows); // retorna ao cliente o resultado da exclusão
		});
	});
});

// ----------- Login ----------- //



// ----------- Cargo ----------- //

// Retorna todo os cargos cadastrados
app.get('/consultaCargo', function (req, res) {
	// Realiza conexão com o banco
	canal.connect(function(erro, conexao, feito) {
		if (erro) {
			// Retorna o erro no console			
			return console.error('Erro ao conectar no banco: \n', erro);
		}
		
		var sql = '\nSELECT * '
				+ '\nFROM 	tb_cargo '
				+ '\nORDER 	BY descricao ';
		console.log(sql);
		
		// Executa a string sql
		conexao.query(sql, function(erro, resultado) {
			
			// Libera a conexão
			feito(); 

			if (erro) {
				return console.error('Erro na seleção de cargos: \n', erro);
			}
			
			// Retorna ao cliente o resultado do select
			res.json(resultado.rows); 
		});
	});
});

// ----------- Cargo ----------- //



// ----------- Empresa ----------- //

// Retorna as empresas cadastradas e seus respectivos logins
app.get('/consultaEmpresa/:id_login', function (req, res) {
	// Realiza conexão com o banco
	canal.connect(function(erro, conexao, feito) {
		if (erro) {
			// Retorna o erro no console			
			return console.error('Erro ao conectar no banco: \n', erro);
		}
		
		var sql = '\nSELECT 	L.id_login, L.email, E.id_empresa, E.nome, E.telefone, E.cep, '
				+ '\n 			E.logradouro, E.nro, E.complemento, E.bairro, E.cidade, E.uf '
				+ '\nFROM 		tb_login L '
				+ '\nLEFT JOIN	tb_empresa E ON (L.id_login = E.id_login) '
				+ '\nWHERE 		L.id_login != ' + req.params.id_login + ' ' // Não tráz no resultado o registro do 
																			// login cujo esta realizando a consulta
				+ '\nORDER BY 	E.nome ';
		console.log(sql);
		
		// Executa a string sql
		conexao.query(sql, function(erro, resultado) {
			
			// Libera a conexão
			feito(); 

			if (erro) {
				return console.error('Erro na seleção de empresas: \n', erro);
			}

			// Retorna ao cliente o resultado do select
			res.json(resultado.rows); 
		});
	});
});

// Retorna a empresa pelo id do login
app.get('/getEmpresa/:id_login', function (req, res) {
	// Realiza conexão com o banco
	canal.connect(function(erro, conexao, feito) {
		if (erro) {
			// Retorna o erro no console			
			return console.error('Erro ao conectar no banco: \n', erro);
		}
		
		var sql = '\nSELECT * '
				+ '\nFROM 	tb_empresa '
				+ '\nWHERE 	id_login = ' + req.params.id_login + ' ';
		console.log(sql);
		
		// Executa a string sql
		conexao.query(sql, function(erro, resultado) {
			
			// Libera a conexão
			feito(); 

			if (erro) {
				return console.error('Erro na seleção de empresas: \n', erro);
			}

			// Retorna ao cliente o primeiro registro do select
			res.json(resultado.rows[0]); 
		});
	});
});

// Realiza a inserção da empresa
app.post('/insereEmpresa', function (req, res) {
	// Realiza conexão com o banco
	canal.connect(function(erro, conexao, feito) {
		if (erro) {
			// Retorna o erro no console			
			return console.error('Erro ao conectar no banco: \n', erro);
		}

		var sql = '\nINSERT INTO tb_empresa (id_empresa, id_login, nome, telefone, cep, logradouro, nro, complemento, bairro, cidade, uf)'
				+ '\nVALUES (' 
				+ 'default, '
				+ number(req.body.id_login)				+ ', ' 
				+ text(req.body.nome) 					+ ', ' 
				+ text(removeMask(req.body.telefone))	+ ', ' 
				+ text(removeMask(req.body.cep))		+ ', ' 
				+ text(req.body.logradouro) 			+ ', ' 
				+ number(req.body.nro)					+ ', ' 
				+ text(req.body.complemetno) 			+ ', ' 
				+ text(req.body.bairro) 				+ ', ' 
				+ text(req.body.cidade) 				+ ', ' 
				+ text(req.body.uf)						+ ' ' 
				+ ');';
		console.log(sql);

		// Executa a string sql
		conexao.query(sql, function(erro, resultado) {
			
			// Libera a conexão
			feito(); 

			if (erro) {
				return console.error('Erro na inserção da empresa: \n', erro);
			}

			res.json(resultado.rows); 
		});
	});
});

// Remove a empresa e seus funcionários
app.delete('/removeEmpresa/:id_empresa', function (req, res) {
	// Realiza conexão com o banco
	canal.connect(function(erro, conexao, feito) {
		if (erro) {
			// Retorna o erro no console			
			return console.error('Erro ao conectar no banco: \n', erro);
		}

		var sql = '\nDELETE FROM tb_funcionario '
				+ '\nWHERE 	id_empresa = ' + req.params.id_empresa + ";"
				+ '\nDELETE FROM tb_empresa '
				+ '\nWHERE 	id_empresa = ' + req.params.id_empresa + ";"
		console.log(sql);

		// Executa a string sql
		conexao.query(sql, function(erro, resultado) {
			
			// Libera a conexão
			feito(); 

			if (erro) {
				return console.error('Erro na remoção da empresa: \n', erro);
			}
			
			// Retorna ao cliente o resultado da exclusão
			res.json(resultado.rows);
		});
	});
});

// Realiza a edição na empresa
app.put('/atualizaEmpresa', function (req, res) {
	// Realiza conexão com o banco
	canal.connect(function(erro, conexao, feito) {
		if (erro) {
			// Retorna o erro no console			
			return console.error('Erro ao conectar no banco: \n', erro);
		}

		var sql = '\nUPDATE tb_empresa '
				+ '\nSET nome = '			+ text(req.body.nome) 					+ ', '
				+ '\n    telefone = ' 		+ text(removeMask(req.body.telefone)) 	+ ', '
				+ '\n    cep = ' 			+ text(removeMask(req.body.cep)) 		+ ', '
				+ '\n    logradouro = ' 	+ text(req.body.logradouro) 			+ ', '
				+ '\n    nro = ' 			+ number(req.body.nro) 					+ ', '
				+ '\n    complemento = ' 	+ text(req.body.complemento)			+ ', '
				+ '\n    bairro = ' 		+ text(req.body.bairro) 				+ ', '
				+ '\n    cidade = ' 		+ text(req.body.cidade) 				+ ', '
				+ '\n    uf = ' 			+ text(req.body.uf) 					+ ' '
				+ '\nWHERE id_empresa = ' 	+ text(req.body.id_empresa);
		console.log(sql);		

		// Executa a string sql
		conexao.query(sql, function(erro, resultado) {
			
			// Libera a conexão
			feito(); 

			if (erro) {
				return console.error('Erro na atualização da empresa: \n', erro);
			}
			
			// Retorna ao cliente o resultado da atualização
			res.json(resultado.rows); 
		});
	});
});

// Consulta o último id da empresa.
app.get('/lastIdEmpresa', function (req, res) {
	// Realiza conexão com o banco
	canal.connect(function(erro, conexao, feito) {
		if (erro) {
			// Retorna o erro no console			
			return console.error('Erro ao conectar no banco: \n', erro);
		}

		var sql = '\nSELECT last_value as id_empresa '
				+ '\nFROM 	tb_empresa_id_empresa_seq;';
		console.log(sql);

		// Executa a string sql
		conexao.query(sql, function(erro, resultado) {
			
			// Libera a conexão
			feito(); 

			if (erro) {
				return console.error('Erro ao selecionar ultimo id da empresa: \n', erro);
			}
			
			// Retorna o último id da empresa
			res.json(resultado.rows[0].id_empresa); 
		});
	});
});

// ----------- Empresa ----------- //



// ----------- Funcionário ----------- //

// Consulta todos os funcionarios de uma determinada empresa
app.get('/consultaFuncionario/:id_empresa', function (req, res) {
	// Realiza conexão com o banco
	canal.connect(function(erro, conexao, feito) {
		if (erro) {
			// Retorna o erro no console			
			return console.error('Erro ao conectar no banco: \n', erro);
		}
		
		var sql = '\nSELECT F.*, C.descricao AS cargo_descricao '
				+ '\nFROM 			tb_funcionario AS F '
				+ '\nNATURAL JOIN 	tb_cargo AS C '
				+ '\nWHERE 			F.id_empresa = ' + req.params.id_empresa + ' '
				+ '\nORDER 			BY F.nome ';
		console.log(sql);
		
		// Executa a string sql
		conexao.query(sql, function(erro, resultado) {
			
			// Libera a conexão
			feito(); 

			if (erro) {
				return console.error('Erro na seleção de funcionário: \n', erro);
			}
			
			// Retorna ao cliente o resultado do select
			res.json(resultado.rows);
		});
	});
});

// Realiza a inserção do funcionário
app.post('/insereFuncionario', function (req, res) {
	// Realiza conexão com o banco
	canal.connect(function(erro, conexao, feito) {
		if (erro) {
			// Retorna o erro no console			
			return console.error('Erro ao conectar no banco: \n', erro);
		}

		var sql = '\nINSERT INTO tb_funcionario (id_funcionario, id_empresa, nome, id_cargo, salario)'
				+ '\nVALUES \n (' 
				+ 'default, '
				+ ''   	+ number(req.body.id_empresa)	+ ', ' 
				+ '' 	+ text(req.body.nome) 			+ ', ' 
				+ '' 	+ number(req.body.id_cargo) 	+ ', ' 
				+ ''	+ number(req.body.salario)		+ ' ' 
				+ ');';
		console.log(sql);

		// Executa a string sql
		conexao.query(sql, function(erro, resultado) {
			
			// Libera a conexão
			feito(); 

			if (erro) {
				return console.error('Erro na inserção de funcionário: \n', erro);
			}

			res.json(resultado.rows); 
		});
	});
});

// Remove um determinado funcionário
app.delete('/removeFuncionario/:id_funcionario', function (req, res) {
	// Realiza conexão com o banco
	canal.connect(function(erro, conexao, feito) {
		if (erro) {
			// Retorna o erro no console			
			return console.error('Erro ao conectar no banco: \n', erro);
		}

		var sql = '\nDELETE FROM tb_funcionario '
				+ '\nWHERE id_funcionario = ' + req.params.id_funcionario;
		console.log(sql);

		// Executa a string sql
		conexao.query(sql, function(erro, resultado) {
			
			// Libera a conexão
			feito(); 

			if (erro) {
				return console.error('Erro na remoção de funcionário: \n', erro);
			}
			
			// Retorna ao cliente o resultado da exclusão
			res.json(resultado.rows);
		});
	});
});

// Atualiza um funcionário
app.put('/atualizaFuncionario', function (req, res) {
	// Realiza conexão com o banco
	canal.connect(function(erro, conexao, feito) {
		if (erro) {
			// Retorna o erro no console			
			return console.error('Erro ao conectar no banco: \n', erro);
		}

		var sql = '\nUPDATE tb_funcionario '
				+ '\nSET id_empresa = '	 		+ number(req.body.id_empresa) 		+ ', '
				+ '\n    nome = '	 			+ text(req.body.nome) 				+ ', '
				+ '\n    id_cargo = ' 			+ number(req.body.id_cargo) 		+ ', '
				+ '\n    salario = ' 			+ number(req.body.salario) 			+ ' '
				+ '\nWHERE id_funcionario = ' 	+ number(req.body.id_funcionario);
		console.log(sql);		

		// Executa a string sql
		conexao.query(sql, function(erro, resultado) {
			
			// Libera a conexão
			feito(); 

			if (erro) {
				return console.error('Erro na atualização de funcionário: \n', erro);
			}
			
			// Retorna ao cliente o resultado da atualização
			res.json(resultado.rows); 
		});
	});
});

// Consulta o último id do funcionário
app.get('/lastIdFuncionario', function (req, res) {
	// Realiza conexão com o banco
	canal.connect(function(erro, conexao, feito) {
		if (erro) {
			// Retorna o erro no console			
			return console.error('Erro ao conectar no banco: \n', erro);
		}

		var sql = '\nSELECT last_value as id_funcionario '
				+ '\nFROM tb_funcionario_id_funcinario_seq;';
		console.log(sql);

		// Executa a string sql
		conexao.query(sql, function(erro, resultado) {
			
			// Libera a conexão
			feito(); 

			if (erro) {
				return console.error('Erro ao selecionar último id do funcionário: \n', erro);
			}
			
			// Retorna o último id do funcionário
			res.json(resultado.rows[0].id_funcionario); 
		});
	});
});

// ----------- Funcionário ----------- //



var port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log('Servidor online na porta %s', port);
});