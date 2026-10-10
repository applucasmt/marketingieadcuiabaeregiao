/**
 * ============================================================
 *  CMS MARKETING IEAD CUIABÁ E REGIÃO
 *  Backend: Google Sheets + Drive + API REST
 *  Versão: 20.0 (Sistema de Categorias)
 * ============================================================
 */

const ABA_ARQUIVOS = "Arquivos";
const ABA_CONFIG = "Configuracoes";
const ABA_LOGS = "Logs";
const ABA_CATEGORIAS = "Categorias";
const ABA_CARROSSEL = "Carrossel";
const ABA_MENUS = "Menus";

const PASTA_DRIVE = "Marketing IEAD - Arquivos";

const CAB_ARQUIVOS = ["ID", "Nome", "Tipo", "Link", "Descricao", "Categoria", "Data_Adicao", "Ativo", "File_ID", "Tamanho", "Preview_URL"];
const CAB_CONFIG = ["Chave", "Valor", "Descricao"];
const CAB_LOGS = ["Data_Hora", "Usuario", "Acao", "Detalhes"];
const CAB_CATEGORIAS = ["ID", "Nome", "Icone", "Ordem"];
const CAB_CARROSSEL = ["ID", "Titulo", "Descricao", "Badge", "Link_Botao", "Texto_Botao", "Ordem", "Ativo"];
const CAB_MENUS = ["ID", "Nome", "Link", "Ordem", "Ativo", "Nova_Aba"];

function doGet(e) {
    try {
        setupPlanilha();
        const p = e.parameter || {};
        const acao = p.acao || "listar";
        let resp;

        switch (acao) {
            case "listar": resp = listarArquivos(p.filtro, p.categoria); break;
            case "configuracoes": resp = obterConfiguracoes(); break;
            case "categorias": resp = listarCategorias(); break;
            case "carrossel": resp = listarCarrossel(); break;
            case "menus": resp = listarMenus(); break;
            case "estatisticas": resp = obterEstatisticas(); break;
            case "buscar": resp = buscarArquivos(p.termo); break;
            case "tudo": resp = obterTudo(); break;
            case "ping": resp = { status: "ok", ts: new Date().toISOString() }; break;
            default: resp = { status: "erro", mensagem: "Ação desconhecida: " + acao };
        }
        return responderJSON(resp, p.callback);
    } catch (err) {
        registrarLog("SISTEMA", "ERRO", err.toString());
        return responderJSON({ status: "erro", mensagem: err.toString() }, e.parameter.callback);
    }
}

function doPost(e) {
    try {
        setupPlanilha();
        const p = JSON.parse(e.postData.contents);
        let resp;

        switch (p.acao) {
            case "upload": resp = uploadArquivo(p); break;
            case "upload_logo": resp = uploadLogo(p); break;
            case "remover": resp = removerArquivo(p.id); break;
            case "atualizar_config": resp = atualizarConfiguracoes(p.dados); break;
            case "carrossel_salvar": resp = salvarSlide(p.dados, p.id); break;
            case "carrossel_remover": resp = removerSlide(p.id); break;
            case "menu_salvar": resp = salvarMenu(p.dados, p.id); break;
            case "menu_remover": resp = removerMenu(p.id); break;
            case "categoria_salvar": resp = salvarCategoria(p.dados, p.id); break;
            case "categoria_remover": resp = removerCategoria(p.id); break;
            default: resp = { status: "erro", mensagem: "Ação POST desconhecida: " + p.acao };
        }
        return responderJSON(resp);
    } catch (err) {
        registrarLog("SISTEMA", "ERRO_POST", err.toString());
        return responderJSON({ status: "erro", mensagem: err.toString() });
    }
}

function setupPlanilha() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    let a = ss.getSheetByName(ABA_ARQUIVOS);
    if (!a) {
        a = ss.insertSheet(ABA_ARQUIVOS);
        a.appendRow(CAB_ARQUIVOS);
        formatarCabecalho(a, CAB_ARQUIVOS.length);
        [60,280,90,450,350,140,130,80,250,100,300].forEach((w, i) => a.setColumnWidth(i+1, w));
        a.setFrozenRows(1);
    }

    let c = ss.getSheetByName(ABA_CONFIG);
    if (!c) {
        c = ss.insertSheet(ABA_CONFIG);
        c.appendRow(CAB_CONFIG);
        formatarCabecalho(c, CAB_CONFIG.length);
        const config = [
            ["Titulo_Site", "Marketing IEAD Cuiabá e Região", "Título principal"],
            ["Subtitulo_Hero", "Recursos Oficiais. Excelência em Comunicação.", "Subtítulo do hero"],
            ["Descricao_Hero", "Acesse materiais institucionais, manuais de marca e conteúdos exclusivos.", "Descrição do hero"],
            ["Texto_Botao_Hero", "Explorar Materiais", "Texto do botão do hero"],
            ["Logo_URL", "", "URL da logo"],
            ["Logo_File_ID", "", "ID do arquivo da logo no Drive"],
            ["Cor_Primaria", "#0A1C3A", "Cor azul escuro"],
            ["Cor_Secundaria", "#1A3A6B", "Cor azul médio"],
            ["Cor_Destaque", "#D4AF37", "Cor dourada"],
            ["Texto_Rodape", "© 2026 IEAD Cuiabá e Região. Todos os direitos reservados.", "Texto do rodapé"],
            ["Email_Contato", "marketing@ieadcuiaba.com.br", "Email"],
            ["Instagram", "@ieadcuiaba", "Instagram"],
            ["Pasta_Drive_ID", "", "ID pasta principal"],
            ["Pasta_Drive_URL", "", "URL pasta principal"],
            ["Mostrar_Carrossel", "TRUE", "Exibir carrossel"],
            ["Mostrar_Busca", "TRUE", "Exibir barra de busca"]
        ];
        c.getRange(2, 1, config.length, 3).setValues(config);
        c.setColumnWidth(1, 220); c.setColumnWidth(2, 500); c.setColumnWidth(3, 400);
        c.setFrozenRows(1);
    }

    let cat = ss.getSheetByName(ABA_CATEGORIAS);
    if (!cat) {
        cat = ss.insertSheet(ABA_CATEGORIAS);
        cat.appendRow(CAB_CATEGORIAS);
        formatarCabecalho(cat, CAB_CATEGORIAS.length);
        cat.getRange(2, 1, 4, 4).setValues([
            [1, "Logo IEAD", "fa-image", 1],
            [2, "Manuais", "fa-book", 2],
            [3, "Apresentações", "fa-file-powerpoint", 3],
            [4, "Campanhas", "fa-bullhorn", 4]
        ]);
        cat.setColumnWidth(1, 60);
        cat.setColumnWidth(2, 250);
        cat.setColumnWidth(3, 200);
        cat.setColumnWidth(4, 80);
        cat.setFrozenRows(1);
    }

    let l = ss.getSheetByName(ABA_LOGS);
    if (!l) {
        l = ss.insertSheet(ABA_LOGS);
        l.appendRow(CAB_LOGS);
        formatarCabecalho(l, CAB_LOGS.length);
        l.setFrozenRows(1);
    }

    let car = ss.getSheetByName(ABA_CARROSSEL);
    if (!car) {
        car = ss.insertSheet(ABA_CARROSSEL);
        car.appendRow(CAB_CARROSSEL);
        formatarCabecalho(car, CAB_CARROSSEL.length);
        car.getRange(2, 1, 3, 8).setValues([
            [1, "Bem-vindo ao Portal", "Acesse materiais exclusivos, manuais e apresentações.", "Novo", "#downloads", "Explorar", 1, true],
            [2, "Manual de Identidade Visual 2026", "Garanta a padronização de todas as peças.", "Atualizado", "#downloads", "Baixar agora", 2, true],
            [3, "Campanha de Missões", "Confira os materiais para download.", "Campanha", "#downloads", "Acessar", 3, true]
        ]);
        car.setColumnWidth(1, 60); car.setColumnWidth(2, 300); car.setColumnWidth(3, 400);
        car.setFrozenRows(1);
    }

    let m = ss.getSheetByName(ABA_MENUS);
    if (!m) {
        m = ss.insertSheet(ABA_MENUS);
        m.appendRow(CAB_MENUS);
        formatarCabecalho(m, CAB_MENUS.length);
        m.getRange(2, 1, 4, 6).setValues([
            [1, "Início", "#inicio", 1, true, false],
            [2, "Downloads", "#downloads", 2, true, false],
            [3, "Sobre", "#sobre", 3, true, false],
            [4, "Contato", "#contato", 4, true, false]
        ]);
        m.setFrozenRows(1);
    }

    ["Sheet1", "Página1", "Page1", "Planilha1"].forEach(nome => {
        const s = ss.getSheetByName(nome);
        if (s && s.getLastRow() === 0 && ss.getSheets().length > 6) {
            try { ss.deleteSheet(s); } catch(e) {}
        }
    });
}

function formatarCabecalho(aba, numCols) {
    const r = aba.getRange(1, 1, 1, numCols);
    r.setBackground("#0A1C3A");
    r.setFontColor("#D4AF37");
    r.setFontWeight("bold");
    r.setFontSize(11);
    r.setHorizontalAlignment("center");
    r.setVerticalAlignment("middle");
    r.setBorder(true, true, true, true, true, true, "#D4AF37", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
}

function obterPastaPrincipal() {
    const pastas = DriveApp.getFoldersByName(PASTA_DRIVE);
    if (pastas.hasNext()) return pastas.next();
    const nova = DriveApp.createFolder(PASTA_DRIVE);
    nova.setDescription("Pasta oficial do site Marketing IEAD");
    return nova;
}

function obterSubpasta(pastaPai, nome) {
    const subs = pastaPai.getFoldersByName(nome);
    if (subs.hasNext()) return subs.next();
    return pastaPai.createFolder(nome);
}

function determinarSubpasta(nomeArq) {
    const ext = (nomeArq.split(".").pop() || "").toUpperCase();
    const mapa = {
        PDF: "Documentos PDF", DOC: "Word", DOCX: "Word",
        XLS: "Planilhas", XLSX: "Planilhas",
        PPT: "Apresentações", PPTX: "Apresentações",
        PNG: "Imagens", JPG: "Imagens", JPEG: "Imagens", GIF: "Imagens", SVG: "Imagens", WEBP: "Imagens",
        MP4: "Vídeos", MOV: "Vídeos", AVI: "Vídeos",
        MP3: "Áudios", WAV: "Áudios",
        ZIP: "Compactados", RAR: "Compactados",
        PSD: "Editáveis", AI: "Editáveis",
        ICO: "Logos"
    };
    return mapa[ext] || "Outros";
}

function uploadArquivo(p) {
    try {
        if (!p.nomeArquivo || !p.dadosBase64) return { status: "erro", mensagem: "Dados incompletos" };

        const tamanho = Math.ceil(p.dadosBase64.length * 3 / 4);
        const tamanhoMB = (tamanho / (1024 * 1024)).toFixed(2);
        if (tamanho > 25 * 1024 * 1024) return { status: "erro", mensagem: "Arquivo muito grande (máx 25MB)" };

        const pasta = obterPastaPrincipal();
        const subpasta = obterSubpasta(pasta, determinarSubpasta(p.nomeArquivo));

        const blob = Utilities.newBlob(
            Utilities.base64Decode(p.dadosBase64),
            p.tipoMime || "application/octet-stream",
            p.nomeArquivo
        );

        const arquivo = subpasta.createFile(blob);
        arquivo.setDescription(p.descricao || "Arquivo Marketing IEAD");
        arquivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

        const fileId = arquivo.getId();
        const link = "https://drive.google.com/uc?export=download&id=" + fileId;
        const preview = "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w800";

        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const aba = ss.getSheetByName(ABA_ARQUIVOS);
        const id = Math.max(aba.getLastRow(), 1);
        const ext = p.nomeArquivo.split(".").pop().toUpperCase();

        aba.appendRow([
            id,
            p.nomeAmigavel || p.nomeArquivo.replace(/\.[^/.]+$/, ""),
            ext,
            link,
            p.descricao || "Clique para baixar",
            p.categoria || "Geral",
            new Date(),
            true,
            fileId,
            tamanhoMB + " MB",
            preview
        ]);

        registrarLog("SITE", "UPLOAD", p.nomeArquivo + " (" + tamanhoMB + "MB) | Cat: " + (p.categoria || "Geral"));
        return { status: "ok", mensagem: "Upload concluído!", arquivo: { id, link, preview, fileId, subpasta: subpasta.getName() } };

    } catch (err) {
        return { status: "erro", mensagem: err.toString() };
    }
}

function uploadLogo(p) {
    try {
        if (!p.nomeArquivo || !p.dadosBase64) return { status: "erro", mensagem: "Dados incompletos" };

        const pasta = obterPastaPrincipal();
        const subLogo = obterSubpasta(pasta, "Logos Site");

        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const abaConf = ss.getSheetByName(ABA_CONFIG);
        const dados = abaConf.getDataRange().getValues();
        for (let i = 1; i < dados.length; i++) {
            if (dados[i][0] === "Logo_File_ID" && dados[i][1]) {
                try { DriveApp.getFileById(dados[i][1]).setTrashed(true); } catch(e){}
            }
        }

        const blob = Utilities.newBlob(
            Utilities.base64Decode(p.dadosBase64),
            p.tipoMime || "image/png",
            p.nomeArquivo
        );

        const arquivo = subLogo.createFile(blob);
        arquivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

        const fileId = arquivo.getId();
        const url = "https://drive.google.com/uc?export=view&id=" + fileId;

        for (let i = 1; i < dados.length; i++) {
            if (dados[i][0] === "Logo_URL") abaConf.getRange(i+1, 2).setValue(url);
            if (dados[i][0] === "Logo_File_ID") abaConf.getRange(i+1, 2).setValue(fileId);
        }

        registrarLog("SITE", "LOGO", "Nova logo enviada");
        return { status: "ok", mensagem: "Logo atualizada!", url, fileId };
    } catch (err) {
        return { status: "erro", mensagem: err.toString() };
    }
}

function listarArquivos(filtro, categoria) {
    const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_ARQUIVOS);
    if (!aba) return [];
    const dados = aba.getDataRange().getValues();
    const out = [];
    for (let i = 1; i < dados.length; i++) {
        const l = dados[i];
        if (!l[1] || !l[3]) continue;
        if (l[7] !== true && l[7] !== "TRUE" && l[7] !== "") continue;
        if (filtro && !l[1].toLowerCase().includes(filtro.toLowerCase())) continue;
        if (categoria && l[5] && l[5].toLowerCase() !== categoria.toLowerCase()) continue;
        out.push({
            id: l[0], nome: l[1], tipo: l[2], link: l[3], descricao: l[4],
            categoria: l[5] || "Geral",
            data: l[6] ? Utilities.formatDate(new Date(l[6]), Session.getScriptTimeZone(), "dd/MM/yyyy") : "",
            fileId: l[8] || "", tamanho: l[9] || "", preview: l[10] || ""
        });
    }
    return out.reverse();
}

function buscarArquivos(t) { return t ? listarArquivos(t) : listarArquivos(); }

function obterConfiguracoes() {
    const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_CONFIG);
    if (!aba) return {};
    const dados = aba.getDataRange().getValues();
    const cfg = {};
    for (let i = 1; i < dados.length; i++) if (dados[i][0]) cfg[dados[i][0]] = dados[i][1];
    return cfg;
}

function listarCategorias() {
    const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_CATEGORIAS);
    if (!aba) return [];
    const dados = aba.getDataRange().getValues();
    const out = [];
    for (let i = 1; i < dados.length; i++) {
        const l = dados[i];
        if (!l[1]) continue;
        out.push({
            id: l[0],
            nome: l[1],
            icone: l[2] || 'fa-folder',
            ordem: l[3] || i
        });
    }
    return out.sort((a, b) => a.ordem - b.ordem);
}

function listarCarrossel() {
    const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_CARROSSEL);
    if (!aba) return [];
    const dados = aba.getDataRange().getValues();
    const out = [];
    for (let i = 1; i < dados.length; i++) {
        const l = dados[i];
        if (!l[1] || (l[7] !== true && l[7] !== "TRUE")) continue;
        out.push({ id: l[0], titulo: l[1], descricao: l[2], badge: l[3], link: l[4], textoBotao: l[5], ordem: l[6] });
    }
    return out.sort((a, b) => a.ordem - b.ordem);
}

function listarMenus() {
    const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_MENUS);
    if (!aba) return [];
    const dados = aba.getDataRange().getValues();
    const out = [];
    for (let i = 1; i < dados.length; i++) {
        const l = dados[i];
        if (!l[1] || (l[4] !== true && l[4] !== "TRUE")) continue;
        out.push({ id: l[0], nome: l[1], link: l[2], ordem: l[3], novaAba: l[5] === true || l[5] === "TRUE" });
    }
    return out.sort((a, b) => a.ordem - b.ordem);
}

function obterEstatisticas() {
    const arqs = listarArquivos();
    const cats = listarCategorias();
    let totalMB = 0;
    const porTipo = {};
    arqs.forEach(a => {
        porTipo[a.tipo] = (porTipo[a.tipo] || 0) + 1;
        if (a.tamanho) { const m = a.tamanho.match(/([\d.]+)/); if (m) totalMB += parseFloat(m[1]); }
    });
    return {
        total_arquivos: arqs.length,
        total_categorias: cats.length,
        total_mb: totalMB.toFixed(2),
        por_tipo: porTipo,
        atualizado: new Date().toISOString()
    };
}

function obterTudo() {
    return {
        config: obterConfiguracoes(),
        arquivos: listarArquivos(),
        categorias: listarCategorias(),
        carrossel: listarCarrossel(),
        menus: listarMenus()
    };
}

function removerArquivo(id) {
    const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_ARQUIVOS);
    const dados = aba.getDataRange().getValues();
    for (let i = 1; i < dados.length; i++) {
        if (dados[i][0] == id) {
            if (dados[i][8]) { try { DriveApp.getFileById(dados[i][8]).setTrashed(true); } catch(e){} }
            aba.deleteRow(i + 1);
            return { status: "ok", mensagem: "Removido" };
        }
    }
    return { status: "erro", mensagem: "Não encontrado" };
}

function atualizarConfiguracoes(dados) {
    const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_CONFIG);
    const range = aba.getDataRange();
    const valores = range.getValues();
    Object.keys(dados).forEach(chave => {
        let achou = false;
        for (let i = 1; i < valores.length; i++) {
            if (valores[i][0] === chave) {
                aba.getRange(i + 1, 2).setValue(dados[chave]);
                achou = true;
                break;
            }
        }
        if (!achou) aba.appendRow([chave, dados[chave], ""]);
    });
    registrarLog("ADMIN", "CONFIG", "Configurações atualizadas");
    return { status: "ok", mensagem: "Configurações salvas" };
}

function salvarSlide(dados, id) {
    const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_CARROSSEL);
    const valores = aba.getDataRange().getValues();

    if (id) {
        for (let i = 1; i < valores.length; i++) {
            if (valores[i][0] == id) {
                aba.getRange(i + 1, 1, 1, 8).setValues([[
                    id, dados.titulo, dados.descricao, dados.badge,
                    dados.link, dados.textoBotao, dados.ordem || i, true
                ]]);
                return { status: "ok", mensagem: "Slide atualizado", id };
            }
        }
        return { status: "erro", mensagem: "Slide não encontrado" };
    }

    const novoId = Math.max(aba.getLastRow(), 1);
    aba.appendRow([novoId, dados.titulo, dados.descricao, dados.badge || "", dados.link || "#", dados.textoBotao || "Ver mais", dados.ordem || novoId, true]);
    return { status: "ok", mensagem: "Slide criado", id: novoId };
}

function removerSlide(id) {
    const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_CARROSSEL);
    const dados = aba.getDataRange().getValues();
    for (let i = 1; i < dados.length; i++) {
        if (dados[i][0] == id) { aba.deleteRow(i + 1); return { status: "ok", mensagem: "Slide removido" }; }
    }
    return { status: "erro", mensagem: "Não encontrado" };
}

function salvarMenu(dados, id) {
    const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_MENUS);
    const valores = aba.getDataRange().getValues();

    if (id) {
        for (let i = 1; i < valores.length; i++) {
            if (valores[i][0] == id) {
                aba.getRange(i + 1, 1, 1, 6).setValues([[
                    id, dados.nome, dados.link, dados.ordem || i, true, dados.novaAba || false
                ]]);
                return { status: "ok", mensagem: "Menu atualizado", id };
            }
        }
        return { status: "erro", mensagem: "Menu não encontrado" };
    }

    const novoId = Math.max(aba.getLastRow(), 1);
    aba.appendRow([novoId, dados.nome, dados.link, dados.ordem || novoId, true, dados.novaAba || false]);
    return { status: "ok", mensagem: "Menu criado", id: novoId };
}

function removerMenu(id) {
    const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_MENUS);
    const dados = aba.getDataRange().getValues();
    for (let i = 1; i < dados.length; i++) {
        if (dados[i][0] == id) { aba.deleteRow(i + 1); return { status: "ok", mensagem: "Menu removido" }; }
    }
    return { status: "erro", mensagem: "Não encontrado" };
}

function salvarCategoria(dados, id) {
    const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_CATEGORIAS);
    const valores = aba.getDataRange().getValues();

    if (id) {
        for (let i = 1; i < valores.length; i++) {
            if (valores[i][0] == id) {
                aba.getRange(i + 1, 1, 1, 4).setValues([[
                    id,
                    dados.nome,
                    dados.icone || 'fa-folder',
                    dados.ordem || i
                ]]);
                registrarLog("ADMIN", "CATEGORIA", "Editada: " + dados.nome);
                return { status: "ok", mensagem: "Categoria atualizada", id };
            }
        }
        return { status: "erro", mensagem: "Categoria não encontrada" };
    }

    const novoId = Math.max(aba.getLastRow(), 1);
    aba.appendRow([novoId, dados.nome, dados.icone || 'fa-folder', dados.ordem || novoId]);
    registrarLog("ADMIN", "CATEGORIA", "Criada: " + dados.nome);
    return { status: "ok", mensagem: "Categoria criada", id: novoId };
}

function removerCategoria(id) {
    const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_CATEGORIAS);
    const dados = aba.getDataRange().getValues();
    for (let i = 1; i < dados.length; i++) {
        if (dados[i][0] == id) {
            const nome = dados[i][1];
            aba.deleteRow(i + 1);
            registrarLog("ADMIN", "CATEGORIA", "Removida: " + nome);
            return { status: "ok", mensagem: "Categoria removida" };
        }
    }
    return { status: "erro", mensagem: "Categoria não encontrada" };
}

function registrarLog(usuario, acao, detalhes) {
    try {
        const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_LOGS);
        if (aba) {
            aba.appendRow([new Date(), usuario, acao, detalhes]);
            if (aba.getLastRow() > 1000) aba.deleteRows(2, 100);
        }
    } catch (e) {}
}

function responderJSON(dados, callback) {
    const json = JSON.stringify(dados);
    if (callback) {
        return ContentService.createTextOutput(callback + "(" + json + ");")
            .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function setupInicial() {
    try {
        setupPlanilha();
        const pasta = obterPastaPrincipal();
        const abaConf = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_CONFIG);
        const dados = abaConf.getDataRange().getValues();
        for (let i = 1; i < dados.length; i++) {
            if (dados[i][0] === "Pasta_Drive_ID") abaConf.getRange(i+1, 2).setValue(pasta.getId());
            if (dados[i][0] === "Pasta_Drive_URL") abaConf.getRange(i+1, 2).setValue(pasta.getUrl());
        }
        registrarLog("SISTEMA", "SETUP", "CMS configurado");
        SpreadsheetApp.getUi().alert("✅ CMS Configurado!\n\nAbas criadas:\n• Arquivos\n• Configuracoes\n• Categorias\n• Logs\n• Carrossel\n• Menus");
    } catch (err) {
        SpreadsheetApp.getUi().alert("❌ Erro: " + err.toString());
    }
}

function onOpen() {
    SpreadsheetApp.getUi().createMenu("⚙️ Marketing IEAD")
        .addItem("🚀 Setup Inicial", "setupInicial")
        .addSeparator()
        .addItem("📊 Testar Listagem", "testarListagem")
        .addToUi();
}

function testarListagem() {
    Logger.log(JSON.stringify(listarArquivos(), null, 2));
}
