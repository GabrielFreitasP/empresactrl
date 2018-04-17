var app = angular.module('CrudApp', ['ngCookies', 'rw.moneymask']);

app.service('Utils', function($cookies, $rootScope) {
	// Limpa todos os cookies usados
	this.limpaCookies = function() {
		$cookies.remove('login', {'domain': 'empresactrl-net.umbler.net'});
		$cookies.remove('empresa', {'domain': 'empresactrl-net.umbler.net'});
	}

	// Preenche o login no rootScope
	this.setLogin = function() {
		var login = $cookies.getObject('login');
		$rootScope.login = angular.copy(login);
	}

	// Verifica se o valor passado como parametro é vazio
	this.isEmpyt = function(valor) {
		return valor.length == 0;
	}

    // Valida uma variável de texto e retorna uma mensagem
    this.validaStrEmpyt = function(strVar, strExpec, strValor, intMaxlength, canIsEmpyt) {
    	// Monta o começo da string a ser mostrada
    	var strMostra = "Campo " + strVar + " "
    			+ (angular.isDefined(strExpec) && !this.isEmpyt(strExpec) ? strExpec + " " : "");
    	
    	if (strValor == null) {
    		strValor = undefined;
    	}

    	if (!canIsEmpyt) {
	    	if (angular.isUndefined(strValor)) {
	    		// Variável com valor não definido
	    		return strMostra + "inválido!";
	    	} else if (this.isEmpyt(strValor)) {
	    		// Variável vazia
	    		return strMostra + "não pode ser vazio!";
			}    		
    	}
    	
    	if (angular.isDefined(strValor) && strValor.length > intMaxlength) {
    		// Variável com tamanha excedido
    		return strMostra + "muito grande! (Máx: " + intMaxlength + " caracteres)";
    	}

    	// Retornar vazio para string válida
    	return "";
    }

    // Chama o método de validacao de string para variáveis que não pode ser vazias
    this.validaStrExpec = function(strVar, strExpec, strValor, intMaxlength) {
    	return this.validaStrEmpyt(strVar, strExpec, strValor, intMaxlength, false);
    }

    // Chama o método de validacao de string sem a especificação
    this.validaStr = function(strVar, strValor, intMaxlength) {
    	return this.validaStrEmpyt(strVar, undefined, strValor, intMaxlength, false);
    }

    // Validação de telefone fixo e celular
    this.validaTelefone = function(telefone) {
    	//Retira a mascara;
    	telefone = telefone.replace("(","");
	    telefone = telefone.replace(")", "");
	    telefone = telefone.replace("-", "");
	    telefone = telefone.replace(" ", "").trim();

	    if (telefone == null || angular.isUndefined(telefone) || this.isEmpyt(telefone)) {
	    	return false;
	    }

	    // DDDs de todo o Brasil
	    var ddd = [	"11", "12", "13", "14", "15", "16", "17", "18", "19",
		            "21", "22", "24", "27", "28",
		            "91", "92", "93", "94", "95",
		            "81", "82", "83", "84", "85", "86", "87",
		            "31", "32", "33", "34", "35", "37", "38",
		            "71", "73", "74", "75", "77", "79",
		            "61", "62", "63", "64", "65", "66", "67", "68", "69",
		            "49", "51", "53", "54", "55"];

	    if (telefone.length == 10) {
	    	// -- Telefone fixo -- //
	        
	        // Verifica se existe o DDD
	        if (ddd.indexOf(telefone.substring(0, 2)) == -1) {
	            return false;
	        }
	        
	        // Primeiro número para telefone fixo
	        if (["1", "2", "3", "4","5"].indexOf(telefone.substring(2, 3)) == -1) {
	            return false;
	        }

	    } else if (telefone.length == 11) {
	    	// -- Telefone celular -- //
	        
	        if (ddd.indexOf(telefone.substring(0, 2)) == -1) {
	            return false;
	        }

	        // Primeiro número para telefone celular
			if (telefone.substring(2, 3) != "9") {
		        return false;
		    }

	        // Segundo número para telefone celular
			if (["6", "7", "8", "9"].indexOf(telefone.substring(3, 4)) == -1) {
		        return false;
		    }
	    } else {
	    	return false;
	    }
	    
	    // Telefone válido
	    return true;
    }
});

// Controle para mostrar email na barra de navegação
app.controller('emailEmpresa', function($scope, $cookies, $rootScope, Utils) {
	$scope.setEmailEmpresa = function() {
		Utils.setLogin();
	}
});

// Controle para fazer o logout da aplicação
app.controller('controlLogout', function($scope, $cookies, $rootScope, Utils) {
	$scope.logout = function(){
		// Limpa os cookies utilizados na aplicação
		Utils.limpaCookies();

		$rootScope.login = undefined;
		window.location.href = "/logout";
	}
});

app.controller('CrudControllerLogin', function($scope, $http, $cookies, $rootScope, Utils) {

	$scope.cadastraLogin = function() {

		// ----------- Início das validações ----------- //
		
		if (angular.isUndefined($scope.login)) {
			alert("Preencha os campos!");
			return;
		}

		var strValida;

		// Valida email
		strValida = Utils.validaStr("Email" , $scope.login.email, 60);
		if (!Utils.isEmpyt(strValida)) {
			alert(strValida);
			return;
		}

		// Valida senha
		strValida = Utils.validaStr("Senha" , $scope.login.senha, 20);
		if (!Utils.isEmpyt(strValida)) {
			alert(strValida);
			return;
		}

		// Valida confirmar senha
		strValida = Utils.validaStr("Confirmar Senha" , $scope.login.confirma_senha, 20);
		if (!Utils.isEmpyt(strValida)) {
			alert(strValida);
			return;
		}

		if ($scope.login.senha != $scope.login.confirma_senha) {
			alert("As senhas não são iguais!");
			return;
		}
		
		// ----------- Fim das validações ----------- //

		$http.post('/verificaEmail', $scope.login).then(function (response) {
			// response.data contém resultado do select			
			if (response.data > 0) {
				alert("Email já cadastrado!");
			} else {
				insereLogin();
			}
		});

	}

	function insereLogin() {
		//Insere
		$http.post('/insereLogin', $scope.login).then(function (response) {
			window.location.href = '/empresa-login';
		});
	}

	$scope.entrar = function(){
		
		// ----------- Início das validações ----------- //

		if (angular.isUndefined($scope.login)) {
			alert("Preencha os campos!");
			return;
		}

		// Valida email
		strValida = Utils.validaStr("Email" , $scope.login.email, 60);
		if (!Utils.isEmpyt(strValida)) {
			alert(strValida);
			return;
		}

		// Valida senha
		strValida = Utils.validaStr("Senha" , $scope.login.senha, 20);
		if (!Utils.isEmpyt(strValida)) {
			alert(strValida);
			return;
		}

		// ----------- Fim das validações ----------- //

		$http.post('/logar', $scope.login).then(function (response) {
			// response.data contém resultado do select				
			// Quando não é retornado nada, o valor de data é nulo
			if (response.data != null && response.data.length != 0) { 
				
				var login = response.data;
				
				//Adiciona o login no cookies
				$cookies.putObject('login', angular.copy(login), {'domain': 'empresactrl-net.umbler.net'});
				
				if (angular.isDefined(response.data)) {
					// Verifica permissão de administrador
					if (response.data.permissao_admin) {
						// Redireciona para a tela de consulta
						window.location.href = '/empresa-consulta';	
					} else {
						redirecionaEmpresaDetalhes(login);
					}						
				} else {
					alert("Algo de errado aconteceu. Tente novamente!");
				}					
			} else {
				alert("E-mail ou senha incorreto!");
			}
		});
	}

	function redirecionaEmpresaDetalhes(login) {
		// Busca as informações da empresa logada
		$http.get('/getEmpresa/' + login.id_login).then(function (response) {
			
			//Preenche a empresa no cookies.		
			$cookies.putObject('empresa', angular.copy(response.data), {'domain': 'empresactrl-net.umbler.net'});

			// Redireciona para a tela de detalhes
			window.location.href = '/empresa-detalhes';	
		});
	};

	$scope.voltaCadastroLogin = function() {
		window.location.href = "/empresa-login";
	}
});

app.controller('CrudController', function($scope, $http, $cookies, $rootScope, Utils) {
	
	// ----------- Ordenação ----------- //

	//Seta a oredenação por nome padrão
	$scope.sortField = "nome";
	$scope.ordem = "+";
	$scope.reverse = true;
	
	// Verifica ordenação cresnte
	$scope.isSortUp = function(fieldName) {
		return $scope.sortField === fieldName && !$scope.reverse;
	}
	
	// Verifica ordenação decrescente
	$scope.isSortDown = function(fieldName) {
		return $scope.sortField === fieldName && $scope.reverse;
	}
	
	// Ordecação dos dados da table
	$scope.sort = function(fieldName, isText) {
		if ($scope.sortField === fieldName) {
			// Inverte a ordem
		    $scope.reverse = !$scope.reverse;
		}else {
		    // Troca o campo de ordenação
		    $scope.sortField = fieldName;
		    $scope.reverse = true;
		};
		
		// Atribui à variável a ordem da ordenação
		if (isText) {
			$scope.ordem = ($scope.reverse ? "+" : "-");
		} else {
			$scope.ordem = ($scope.reverse ? "-" : "+");
		}
	}

	// ----------- Ordenação ----------- //



	// ----------- Busca CEP ----------- //

	function limpaCamposCEP() {
        //Limpa os campos do formulário de cep.
        document.getElementById('logradouro').value = "";
        document.getElementById('bairro').value = "";
        document.getElementById('cidade').value = "";
        document.getElementById('uf').value = "";
       	
       	//Limpa os valores do objeto empresa referente ao endereço.
        $scope.empresa.logradouro = undefined;
        $scope.empresa.bairro = undefined;
        $scope.empresa.cidade = undefined;
        $scope.empresa.uf = undefined;
    }

	function setCamposCEP(conteudo) {
        if (!("erro" in conteudo)) {
            
            //Atualiza os campos com os valores.
            document.getElementById('logradouro').value = conteudo.logradouro;
            document.getElementById('bairro').value = conteudo.bairro;
            document.getElementById('cidade').value = conteudo.localidade;
            document.getElementById('uf').value = conteudo.uf;
			
			//Atribuí ao objeto empresa o conteúdo do endereço.
            $scope.empresa.logradouro = conteudo.logradouro;
            $scope.empresa.bairro = conteudo.bairro;
            $scope.empresa.cidade = conteudo.localidade;
            $scope.empresa.uf = conteudo.uf;
        } else {
            
            //CEP não Encontrado.
            limpaCamposCEP();
            alert("CEP não encontrado.");
        }
    }

	// Pesquisa o CEP através de um WebServices
	$scope.perquisaCEP = function() {
        //Nova variável "cep" somente com dígitos.
        var cep = $scope.empresa.cep.replace(/\D/g, '');

        //Verifica se campo cep possui valor informado.
        if (cep != "") {

            //Expressão regular para validar o CEP.
            var validacep = /^[0-9]{8}$/;

            //Valida o formato do CEP.
            if(validacep.test(cep)) {
                //Preenche os campos com "..." enquanto consulta webservice.
                document.getElementById('logradouro').value="...";
                document.getElementById('bairro').value="...";
                document.getElementById('cidade').value="...";
                document.getElementById('uf').value="...";

                //URL para trazer o JSON com as informações do endereço.
                var url = 'https://viacep.com.br/ws/'+ cep + '/json';
                //Traz o JOSON e passa como parametro para preencher os campos.
                $http.get(url).then(function (response) {
                	setCamposCEP(response.data);
                });

            } //end if.
            else {
                //cep é inválido.
                limpaCamposCEP();
                alert("Formato de CEP inválido.");
            }
        } //end if.
        else {
            //CEP sem valor, limpa formulário.
            limpaCamposCEP();
        }
    }

	// ----------- Busca CEP ----------- //



	// ----------- Cargo ----------- //

	function atualizaTabelaCargo() {
		$http.get('/consultaCargo').then(function (response) {
			// Atribui à lista o resultado da consulta.
			$scope.listaCargo = response.data;
		});		
	}

	$scope.consultaCargo = function() {
		atualizaTabelaCargo();
	}	

	// ----------- Cargo ----------- //



	// ----------- Empresa ----------- //

	function atualizaTabelaEmpresa() {
		$http.get('/consultaEmpresa/' + $rootScope.login.id_login).then(function (response) {
			// response.data contém resultado do select
			$scope.empresas = response.data;
		});	
	}
	
	$scope.consultaEmpresa = function() {
		atualizaTabelaEmpresa();
	}

	$scope.salvaEmpresa = function() {

		// ----------- Início das validações ----------- //

		if (angular.isUndefined($scope.empresa)) {
			alert("Preencha os campos!");
			return;
		}

		if (angular.isDefined($rootScope.login) && $rootScope.login.permissao_admin) {
			$scope.empresa.id_login = $scope.empresa.id_login;
		} else {
			$scope.empresa.id_login = $rootScope.login.id_login;
		}
		

		var strValida;

		// Valida nome
		strValida = Utils.validaStrExpec("Nome", "da empresa" , $scope.empresa.nome, 200);
		if (!Utils.isEmpyt(strValida)) {
			alert(strValida);
			return;
		}

		//Valida telefone
		if (!Utils.validaTelefone($scope.empresa.telefone)) {
			alert("Telefone da empresa inválido!");
			return;
		}

		// Valida logradouro
		strValida = Utils.validaStrExpec("Logradouro", "da empresa" , $scope.empresa.logradouro, 200);
		if (!Utils.isEmpyt(strValida)) {
			alert(strValida);
			return;
		}

		// Valida complemento
		strValida = Utils.validaStrEmpyt("Complemento", "da empresa" , $scope.empresa.complemento, 200, true);
		if (!Utils.isEmpyt(strValida)) {
			alert(strValida);
			return;
		}

		// Valida bairro 
		strValida = Utils.validaStrExpec("Bairro", "da empresa" , $scope.empresa.bairro, 200);
		if (!Utils.isEmpyt(strValida)) {
			alert(strValida);
			return;
		}

		// Valida cidade 
		strValida = Utils.validaStrExpec("Cidade", "da empresa" , $scope.empresa.cidade, 200);
		if (!Utils.isEmpyt(strValida)) {
			alert(strValida);
			return;
		}

		// ----------- Fim das validações ----------- //

		if ($scope.empresa.id_empresa > 0) {
			//Editar
			$http.put('/atualizaEmpresa', $scope.empresa).then(function (response){
				alert("Empresa editada!");
			});
		} else {
			//Insere
			$http.post('/insereEmpresa', $scope.empresa).then(function (response){
				// Busca o ultimo id inserido
				$http.get('/lastIdEmpresa').then(function (response){
					$scope.empresa.id_empresa = response.data;
				});
			
				alert("Empresa salva!");
			});
		}

		// Adiciona a empresa no cookies para ser carregada se a pagina for atualizada
		$cookies.putObject('empresa', angular.copy($scope.empresa), {'domain': 'empresactrl-net.umbler.net'});
	}

	$scope.removeLoginEmpresa = function(){
		var excluir = confirm("O login " + $scope.empresa.email + " será excluido.");
		if (excluir) {
			$http.delete('/removeLoginEmpresa/' + $scope.empresa.id_login).then(function (response){
					//Redireciona para tela de colsulta de empresa.
					window.location.href = "/empresa-consulta";
			});
		}
	}

	$scope.removeEmpresa = function(){
		var excluir = confirm("A empresa " + $scope.empresa.nome + " será excluida.");
		if (excluir) {
			$http.delete('/removeEmpresa/' + $scope.empresa.id_empresa).then(function (response){
					//Redireciona para tela de colsulta de empresa.
					window.location.href = "/empresa-consulta";
			});
		}
	}

	// Preenche o objeto de empresa
	function setEmpresa(empresa) {
		if (angular.isUndefined(empresa)) {
			//Preenche um novo objeto.
			$scope.empresa = {
				"id_empresa": undefined,
				"nome": undefined,
				"telefone": undefined,
				"cep": undefined,
				"logradouro": undefined,
				"nro": undefined,
				"complemento": undefined,
				"bairro": undefined,
				"cidade": undefined,
				"uf": undefined
			};
		} else {
			//Recebe o objeto.
			$scope.empresa = empresa;
		}
		limpaFuncionario();
		atualizaTabelaFuncionario();
	}


	$scope.detalhaEmpresa = function(index){
		$cookies.putObject('empresa', angular.copy($scope.listaEmpresa[index]), {'domain': 'empresactrl-net.umbler.net'});
		window.location.href = "/empresa-detalhes";
	}

	// coloca o projeto para edição
	$scope.preencheCamposEmpresa = function(){	
		//Preenche o rootscope com o login do cookies
		Utils.setLogin();

		var empresa;

		// recebe o objeto do cookies
		var cookies = $cookies.getObject('empresa');

		//Verifica se o objeto no cookies é definido.
		if (angular.isDefined(cookies) && angular.isDefined(cookies.id_empresa)){
			//Recebe o objeto de empresa do cookies.
			empresa = cookies;
			//Remove o objeto empresa do cookies.
			//$cookies.remove('empresa', {'domain': 'empresactrl-net.umbler.net'});
		} else {
			empresa = undefined;
		}

		//Preenche o objeto de empresa.		
		setEmpresa(empresa);		
	}

	$scope.novaEmpresa = function() {
		//Remove o objeto empresa do cookies.
		//$cookies.remove('empresa', {'domain': 'empresactrl-net.umbler.net'});
		//Redireciona para o tela de cadastro de empresa.
		window.location.href = "/empresa-detalhes";
	}

	$scope.voltaConsultaEmpresa = function() {
		window.location.href = "/empresa-consulta";
	}

	// ----------- Empresa ----------- //



	// ----------- Funcionário ----------- //

	function atualizaTabelaFuncionario(){
		if (angular.isDefined($scope.empresa.id_empresa)) {
			$http.get('/consultaFuncionario/' + $scope.empresa.id_empresa).then(function (response){
				// Atribui à lista o resultado da consulta.
				$scope.funcionarios = response.data;
			});	
		}
	}

	$scope.consultaFuncionario = function(){
		atualizaTabelaFuncionario();
	}

	$scope.salvaFuncionario = function(){

		// ----------- Início das validações ----------- //

		if (angular.isUndefined($scope.funcionario)) {
			alert("Preencha os campos!");
			return;
		}

		var strValida;

		// Valida nome
		strValida = Utils.validaStrExpec("Nome", "do funcionário", $scope.funcionario.nome, 200);
		if (!Utils.isEmpyt(strValida)) {
			alert(strValida);
			return;
		}

		// ----------- Fim das validações ----------- //

		if ($scope.funcionario.id_funcionario > 0) {
			//Editar
			$http.put('/atualizaFuncionario', $scope.funcionario).then(function (response){
					limpaFuncionario();
					atualizaTabelaFuncionario();
					alert("Funcionário editada!");
			});
		} else {
			//Insere
			$scope.funcionario.id_empresa = $scope.empresa.id_empresa;
			$http.post('/insereFuncionario', $scope.funcionario).then(function (response){
					limpaFuncionario();
					atualizaTabelaFuncionario();
					alert("Funcionário salvo!");
			});
		}
	}

	$scope.removeFuncionario = function(index){
		//Recebe o objeto atravéz do index da tabela.
		var funcionario = $scope.listaFuncionario[index];
		//Verifica se o usuário quer deletar.
		var excluir = confirm("O funcionário " + funcionario.nome + " será excluido.");
		if (excluir) {
			$http.delete('/removeFuncionario/' + funcionario.id_funcionario).then(function (response){
					//Se o formulário de funcionario estiver preenchido com o objeto cujo está sendo deletado
					//Limpa os campos do formulário de funcionário.
					if (funcionario.id_funcionario == $scope.funcionario.id_funcionario) {
						limpaFuncionario();
					}
					atualizaTabelaFuncionario();					
			});
		}
	}

	// Preenche o objeto de funcionario
	function setFuncionario(funcionario) {
		if (angular.isUndefined(funcionario)) {
			//Preenche um novo objeto.
			$scope.funcionario = {
				"id_funcionario": undefined,
				"id_empresa": $scope.empresa.id_empresa,
				"nome": undefined,
				"id_cargo": undefined,
				"salario": undefined
			};
		} else {
			//Preenche o objeto com os dados obtidos por parâmetro.
			$scope.funcionario = {
				"id_funcionario": funcionario.id_funcionario,
				"id_empresa": funcionario.id_empresa,
				"nome": funcionario.nome,
				"id_cargo": funcionario.id_cargo,
				"salario": funcionario.salario
			};
		}
	}

	//Recebe como parâmetro o index da tabela de funcionario e passa o objeto da tabela.
	$scope.preencheCamposFuncionario = function(index){	
		setFuncionario($scope.listaFuncionario[index]);
	}

	//Seta todas as os vapos de funcionarios como não definidos.
	function limpaFuncionario(){	
		setFuncionario(undefined);
	}

	//Chama a função limpaFuncionario.
	$scope.limpaCamposFuncionario = function(){	
		limpaFuncionario();
	}

	// ----------- Funcionário ----------- //

});

// Máscara da tabela para telefone fixo e celular
app.filter('maskTelefone', function () {
    return function(text) {
    	if (text == null || angular.isUndefined(text)) {
    		return "";
    	} else if (text.length == 11) {
    		return "(" + text.substring(0,2) + ") " + text.substring(2,7) + "-" + text.substring(7,11);
    	} else if (text.length == 10) {
			return "(" + text.substring(0,2) + ") " + text.substring(2,6) + "-" + text.substring(6,10);
    	}
    	return text;
    }
});

// Máscara da tabela para CEP
app.filter('maskCEP', function () {
    return function(text) {
    	if (text == null || angular.isUndefined(text)) {
    		return "";
    	} else if (text.length == 8) {
    		return text.substring(0,5) + "-" + text.substring(5,8);
    	}
    	return text;
    }
});

// Precionar enter em um input
app.directive('ngEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
                scope.$apply(function (){
                    scope.$eval(attrs.ngEnter);
                });
                event.preventDefault();
            }
        });
    };
});