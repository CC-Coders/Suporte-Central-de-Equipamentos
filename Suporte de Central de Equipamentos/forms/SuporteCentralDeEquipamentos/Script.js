var dataPrazoRetorno = null;
var calendarioRoot = null;
var modalRoot = null;
var calendarioRoot2 = null

$(document).ready(function () {
        var atividade = $("#atividade").val();
        var formMode = $("#formMode").val();
        BuscaFornecedores();
        $('#valorLocacao').mask('R$ 000.000.000,00', { reverse: true });
        $('#prefixoTrans, #prefixoAlt').mask('AA00.000', {
                translation: {
                        'A': {
                                pattern: /[A-Za-z]/,
                                optional: false
                        },
                        '0': {
                                pattern: /[0-9]/,
                                optional: false
                        }
                },
                placeholder: 'Exemplo: AA11.111',
                onKeyPress: function (value, e, field, options) {
                        field.val(field.val().toUpperCase());
                }
        });

        $(".radioDecisao").on("change", function () {
                if ($(".radioDecisao:checked").val() == "Enviar") {
                        $("#divInfoResolucaoChamado").show();
                        $("#divInfoObservacao").hide();
                }
                else if ($(".radioDecisao:checked").val() == "Retornar") {
                        $("#divInfoResolucaoChamado").hide();
                        $("#divInfoObservacao").show();
                        setDataPrazoRetorno();
                }
        });
        $(".radioDecisaoConclusao").on("change", function () {
                if ($(".radioDecisaoConclusao:checked").val() == "Enviar") {
                        $("#divInfoObservacao").hide();
                } else {
                        $("#divInfoObservacao").show();
                }
        });
        $(".inputObservacao, #email, .inputResolucaoChamado, .inputInfoChamado, .inputCurso").on("click", function () {
                $(this).removeClass("has-error");
        });
        $("#email").on("blur", function () {
                //Verifica se o usuario colocou o proprio email em copia e remove caso verdadeiro
                if ($(this).val() != null && $(this).val() != "") {
                        DatasetFactory.getDataset("colleague", ["mail"], [
                                DatasetFactory.createConstraint("colleagueId", $("#solicitante").val(), $("#solicitante").val(), ConstraintType.MUST)
                        ], null, {
                                success: (mail) => {
                                        var retorno = "";
                                        var emails = $(this).val().trim().split(";");
                                        for (let i = 0; i < emails.length; i++) {
                                                const email = emails[i];
                                                console.log(email.trim() + " - " + mail.values[0]["mail"]);
                                                if (email.trim() == mail.values[0]["mail"]) {
                                                        FLUIGC.toast({
                                                                message: "O solicitante é automaticamente notificado por e-mail, não sendo necessário estar incluido em cópia.",
                                                                type: "warning"
                                                        });
                                                } else {
                                                        retorno += email + "; ";
                                                }
                                        }
                                        $(this).val(retorno.substring(0, retorno.length - 2));
                                },
                                error: (error) => {
                                        FLUIGC.toast({
                                                title: "Erro ao verificar e-mail do usuário: ",
                                                message: error,
                                                type: "warning"
                                        });
                                }
                        });
                }
        });
        calendarioRoot = ReactDOM.createRoot(document.querySelector('#calendar'));
        calendarioRoot2 = ReactDOM.createRoot(document.querySelector('#divCancelamentoCurso'));
        $("#categoria").on("change", function () {
                if ($(this).val() == "Agendamento de Curso / Orientação") {
                        $("#divCamposCursos").slideDown("400", (() => {
                                calendarioRoot.render(React.createElement(Calendario, { curso: $("#curso").val(), obra: $("#obra").val() }));
                        }));
                } else {
                        $("#divCamposCursos").slideUp();
                }
                if ($(this).val() == "Cancelamento de Curso / Orientação") {
                        $("#divCancelamentoCurso").slideDown("400", (() => {
                                calendarioRoot2.render(React.createElement(Calendario));
                        }));
                }
                else {
                        $("#divCancelamentoCurso").slideUp();
                }

                if ($(this).val() == "Relatório de Solicitações") {
                        $("#divRelatorioDeSolicitacoes").slideDown("400", (() => {
                                ReactDOM.render(<RelatorioDeSolicitacoes />, document.getElementById("divRelatorioDeSolicitacoes"));
                        }));
                } else {
                        $("#divRelatorioDeSolicitacoes").slideUp();
                }
                if ($(this).val() == "Transferência Máquina Locada MA") {
                        $("#divTransferenciaMaquina").slideDown();
                        $("#obs").show();
                } else {
                        $("#divTransferenciaMaquina").slideUp();
                }
                if ($(this).val() == "Alteração Motivo da Falha") {
                        $("#divAlteracaoFalha").slideDown();
                        $("#obs").hide();
                } else {
                        $("#divAlteracaoFalha").slideUp();
                }
        });
        $("#btnAdicionarLinhaUsuariosCurso").on("click", function () {
                InsereLinhaUsuario();
        });
        $("#btnAdicionarLinhaAlteracao").on("click", function () {
                InsereLinhaAlteracaoMotivo()
        });
        $("#curso, #obra").on("change", function () {
                calendarioRoot.render(React.createElement(Calendario, { curso: $("#curso").val(), obra: $("#obra").val() }));
        });
        $("#obra").on("change", function () {
                $("#obraHidden").val($(this).val());
        });
        BuscaResponsaveisCurso();

        if (formMode == "ADD") {
                $("#divResolucaoChamado, #divCamposCursos, #divTransferenciaMaquina, #divAlteracaoFalha").hide();
                $("#btnAdicionarLinhaUsuariosCurso").click();
                //BuscaListDeUsuariosAD($("#solicitante").val());
                $("#atabHistorico").closest("li").hide();
                BuscaObras($("#userCode").val());
                InsereLinhaAlteracaoMotivo()
                inicializarCalendario();
                preencherObrasDoUsuario()

                if (VerificaSeUsuarioCentral($("#userCode").val()) == "true") {
                        $("#categoria").append("<option value='Cancelamento de Curso / Orientação'>Cancelamento de Curso / Orientação</option>")
                        $("#categoria").append("<option value='Relatório de Solicitações'>Relatório de Solicitações</option>")
                }
        }
        else if (formMode == "MOD") {
                $("#divTransferenciaMaquina, #divAlteracaoFalha").hide()
                $(".radioDecisao:checked").attr("checked", false);
                $(".radioDecisaoConclusao:checked").attr("checked", false);
                $("#observacao, #solucao, #divDecisaoConclusao").val("");
                BuscaComplementos();
                inicializarCalendario();

                if ($("#categoria").val() == "Agendamento de Curso / Orientação") {
                        $("#divCamposCursos").show();
                        CriaListaUsuarios();
                        setTimeout(() => {
                                calendarioRoot.render(React.createElement(Calendario, { curso: $("#curso").val(), obra: $("#obra").val() }));
                        }, 500);
                } else {
                        $("#divCamposCursos").hide();
                }

                if (atividade == 4) {//Inicio
                        $("#divDecisao, #divDecisaoConclusao, #divInfoResolucaoChamado").hide();
                        $("#data_prazo_retorno").closest(".form-input").hide();
                        BuscaObras($("#userCode").val());
                        InsereLinhaAlteracaoMotivo()
                        preencherObrasDoUsuario()

                        if ($("#categoria").val() == "Transferência Máquina Locada MA") {
                                $("#divTransferenciaMaquina, #obs").show()
                                $("#btnAdicionarLinhaUsuariosCurso").hide();
                        }
                        if ($("#categoria").val() == "Alteração Motivo da Falha") {
                                $("#divAlteracaoFalha").show()
                                $("#btnAdicionarLinhaUsuariosCurso, #obs").hide();
                        }
                }
                else if (atividade == 5) {//Solucao
                        if ($("#categoria").val() == "Transferência Máquina Locada MA") {
                                $("#divTransferenciaMaquina, #obs").show()
                                $("#btnAdicionarLinhaUsuariosCurso").hide();
                                $("#divInfoResolucaoChamado, #divInfoObservacao, #divDecisaoConclusao").closest("div").hide();
                                $("#categoria, #prefixoTrans, #selectFornecedor, #dataTrans, #valorLocacao, #obraOrigem, #obraDestino, #observacaoAgendamentoCurso").prop("disabled", true)
                        } else if ($("#categoria").val() == "Alteração Motivo da Falha") {
                                CriaListaAlteracoes()
                                $("#divAlteracaoFalha").show()
                                $("#btnAdicionarLinhaUsuariosCurso, #obs").hide();
                                $("#divInfoResolucaoChamado, #divInfoObservacao, #divDecisaoConclusao").closest("div").hide();
                                $("#categoria, #prefixoAlt, #osSisma, #justificativaAlteracao, #observacaoAgendamentoCurso").prop("disabled", true)
                        }
                        else {
                                $("#btnAdicionarLinhaUsuariosCurso").hide();
                                $("#divInfoResolucaoChamado, #divInfoObservacao, #divDecisaoConclusao").closest("div").hide();
                                dataPrazoRetorno = FL747IGC.calendar("#data_prazo_retorno");
                                BuscaObras($("#userCode").val());
                                BloqueiaCamposInfoChamado();
                        }
                }
        }
        else if (formMode == "VIEW") {
                BuscaComplementos();
                $("#divResolucaoChamado, #divCamposCursos, #divAlteracaoFalha, #divTransferenciaMaquina").hide();

                if ($("#categoria").text() == "Agendamento de Curso / Orientação") {
                        $("#divCamposCursos").show();
                        $("#obra").text($("#obraHidden").val());
                        CriaListaUsuarios();
                        setTimeout(() => {
                                calendarioRoot.render(React.createElement(Calendario, { curso: $("#curso").text(), obra: $("#obra").text() }));
                        }, 500);
                }
                else if ($("#categoria").text() == "Alteração Motivo da Falha") {
                        $("#divAlteracaoFalha").show()
                }
                else if ($("#categoria").text() == "Transferência Máquina Locada MA") {
                        $("#divTransferenciaMaquina").show()
                }
        }
        else {
        }
});
