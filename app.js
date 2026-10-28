/**
 * ============================================================
 *  CMS MARKETING IEAD CUIABÁ E REGIÃO
 *  Versão: 46.0 (Upload e download fatiados + autor garantido)
 * ============================================================
 *  ⚠️ IMPORTANTE: Ative o serviço "Drive API" no painel de Serviços do Apps Script.
 * ============================================================
 */

const ABA_ARQUIVOS = "Arquivos";
const ABA_CONFIG = "Configuracoes";
const ABA_LOGS = "Logs";
const ABA_CATEGORIAS = "Categorias";
const ABA_CARROSSEL = "Carrossel";
const ABA_MENUS = "Menus";
const ABA_CRIATIVOS = "Criativos";
const ABA_USUARIOS = "Usuarios";

const PASTA_DRIVE = "Marketing IEAD - Arquivos";

const CAB_ARQUIVOS = ["ID", "Nome", "Tipo", "Link", "Descricao", "Categoria", "Data_Adicao", "Ativo", "File_ID", "Tamanho", "Preview_URL"];
const CAB_CONFIG = ["Chave", "Valor", "Descricao"];
const CAB_LOGS = ["Data_Hora", "Usuario", "Acao", "Detalhes"];
const CAB_CATEGORIAS = ["ID", "Nome", "Icone", "Ordem"];
const CAB_CARROSSEL = ["ID", "Titulo", "Descricao", "Badge", "Link_Botao", "Texto_Botao", "Ordem", "Ativo"];
const CAB_MENUS = ["ID", "Nome", "Link", "Ordem", "Ativo", "Nova_Aba"];
const CAB_CRIATIVOS = ["ID", "Nome", "Tipo", "Link", "Link_Download", "Descricao", "Data_Adicao", "Ativo", "File_ID", "Tamanho", "Preview_URL", "Usuario_ID", "Usuario_Nome", "Usuario_WhatsApp", "Usuario_Congregacao", "Usuario_Idade", "Usuario_Foto", "Usuario_Cidade"];
const CAB_USUARIOS = ["ID", "Nome", "Email", "WhatsApp", "Congregacao", "Idade", "Cidade", "Foto_URL", "Foto_File_ID", "Senha_Hash", "Data_Cadastro", "Ativo"];

// ============================================================
// HELPERS
// ============================================================
function safeStr(valor) {
    if (valor === null || valor === undefined) return "";
    return String(valor);
}

// ============================================================
// FUNÇÃO PARA FORÇAR PERMISSÃO DO GOOGLE
// ============================================================
function forcarAutorizacao() {
    try {
        DriveApp.getRootFolder();
        UrlFetchApp.fetch("https://www.google.com");
        Drive.Files.list({ pageSize: 1 });
        Logger.log("✅ Permissões concedidas com sucesso!");
        SpreadsheetApp.getUi().alert("✅ Permissões concedidas com sucesso! O sistema está pronto.");
    } catch (e) {
        Logger.log("❌ Erro de permissão: " + e.toString());
        SpreadsheetApp.getUi().alert("⚠️ Ocorreu um erro, certifique-se de aceitar as permissões: " + e.toString());
    }
}

// ============================================================
// API GET
// ============================================================
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
            case "criativos": resp = listarCriativos(); break;
            case "estatisticas": resp = obterEstatisticas(); break;
            case "buscar": resp = buscarArquivos(p.termo); break;
            case "tudo": resp = obterTudo(); break;
            case "info_pasta": resp = obterInfoPasta(); break;
            case "baixar_psd": resp = baixarPSDBase64(p.fileId); break;
            case "baixar_psd_info": resp = baixarPSDInfo(p.fileId); break;
            case "baixar_psd_fatia": resp = baixarPSDFatia(p.fileId, p.offset, p.length); break;
            case "ping": resp = { status: "ok", ts: new Date().toISOString() }; break;
            default: resp = { status: "erro", mensagem: "Ação desconhecida: " + acao };
        }
        return responderJSON(resp, p.callback);
    } catch (err) {
        registrarLog("SISTEMA", "ERRO", err.toString());
        return responderJSON({ status: "erro", mensagem: err.toString() }, e.parameter.callback);
    }
}

// ============================================================
// API POST
// ============================================================
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
            case "creative_upload": resp = creativeUpload(p); break;
            
            case "iniciar_upload_fatiado": resp = iniciarUploadFatiado(p); break;
            case "enviar_fatia_upload": resp = enviarFatiaUpload(p); break;
            case "confirmar_upload_direto": resp = confirmarUploadDireto(p); break;
            
            case "creative_remover": resp = creativeRemover(p.id); break;
            case "cadastro": resp = cadastrarUsuario(p); break;
            case "login": resp = loginUsuario(p); break;
            default: resp = { status: "erro", mensagem: "Ação POST desconhecida: " + p.acao };
        }
        return responderJSON(resp);
    } catch (err) {
        registrarLog("SISTEMA", "ERRO_POST", err.toString());
        return responderJSON({ status: "erro", mensagem: err.toString() });
    }
}

// ============================================================
// SETUP
// ============================================================
function setupPlanilha() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    let a = ss.getSheetByName(ABA_ARQUIVOS);
    if (!a) {
        a = ss.insertSheet(ABA_ARQUIVOS);
        a.appendRow(CAB_ARQUIVOS);
        formatarCabecalho(a, CAB_ARQUIVOS.length);
        [60, 280, 90, 450, 350, 140, 130, 80, 250, 100, 300].forEach((w, i) => a.setColumnWidth(i + 1, w));
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
        c.setColumnWidth(1, 220);
        c.setColumnWidth(2, 500);
        c.setColumnWidth(3, 400);
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
        car.setFrozenRows(1);
    }

    let m = ss.getSheetByName(ABA_MENUS);
    if (!m) {
        m = ss.insertSheet(ABA_MENUS);
        m.appendRow(CAB_MENUS);
        formatarCabecalho(m, CAB_MENUS.length);
        m.getRange(2, 1, 5, 6).setValues([
            [1, "Início", "#inicio", 1, true, false],
            [2, "Downloads", "#downloads", 2, true, false],
            [3, "IEAD Creative", "#creative", 3, true, false],
            [4, "Sobre", "#sobre", 4, true, false],
            [5, "Contato", "#contato", 5, true, false]
        ]);
        m.setFrozenRows(1);
    }

    let cr = ss.getSheetByName(ABA_CRIATIVOS);
    if (!cr) {
        cr = ss.insertSheet(ABA_CRIATIVOS);
        cr.appendRow(CAB_CRIATIVOS);
        formatarCabecalho(cr, CAB_CRIATIVOS.length);
        [60, 280, 90, 450, 450, 350, 130, 80, 250, 100, 300, 100, 200, 150, 200, 80, 300, 200].forEach((w, i) => cr.setColumnWidth(i + 1, w));
        cr.setFrozenRows(1);
    }

    let u = ss.getSheetByName(ABA_USUARIOS);
    if (!u) {
        u = ss.insertSheet(ABA_USUARIOS);
        u.appendRow(CAB_USUARIOS);
        formatarCabecalho(u, CAB_USUARIOS.length);
        [60, 250, 300, 150, 250, 80, 180, 400, 300, 300, 150, 80].forEach((w, i) => u.setColumnWidth(i + 1, w));
        u.setFrozenRows(1);
    }

    ["Sheet1", "Página1", "Page1", "Planilha1"].forEach(nome => {
        const s = ss.getSheetByName(nome);
        if (s && s.getLastRow() === 0 && ss.getSheets().length > 8) {
            try { ss.deleteSheet(s); } catch (e) {}
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

// ============================================================
// UPLOAD FATIADO VIA DRIVE API V3 (sessão resumable correta)
// ============================================================
function lerHeader_(resp, nome) {
    const h = resp.getAllHeaders() || {};
    const alvo = nome.toLowerCase();
    for (const k in h) {
        if (k.toLowerCase() === alvo) {
            return Array.isArray(h[k]) ? h[k][0] : h[k];
        }
    }
    return null;
}

function iniciarUploadFatiado(p) {
    try {
        const nomeArquivo = safeStr(p.nomeArquivo);
        const tipoMime = safeStr(p.tipoMime) || "application/octet-stream";
        const tamanhoTotal = parseInt(p.tamanhoTotal);

        if (!nomeArquivo) return { status: "erro", mensagem: "Nome do arquivo ausente." };
        if (tamanhoTotal > 5 * 1024 * 1024 * 1024) {
            return { status: "erro", mensagem: "Arquivo excede o limite de 5GB." };
        }

        const pasta = obterPastaPrincipal();
        const nomeSub = safeStr(p.pastaDestino) || determinarSubpasta(nomeArquivo);
        const subpasta = obterSubpasta(pasta, nomeSub);

        // 1. Cria o arquivo vazio na pasta de destino
        const arquivo = subpasta.createFile(Utilities.newBlob("", tipoMime, nomeArquivo));
        const fileId = arquivo.getId();

        // 2. Abre uma sessão de upload resumable (PATCH no arquivo existente)
        const resp = UrlFetchApp.fetch(
            "https://www.googleapis.com/upload/drive/v3/files/" + fileId + "?uploadType=resumable&supportsAllDrives=true",
            {
                method: "patch",
                contentType: "application/json; charset=UTF-8",
                headers: {
                    "Authorization": "Bearer " + ScriptApp.getOAuthToken(),
                    "X-Upload-Content-Type": tipoMime,
                    "X-Upload-Content-Length": String(tamanhoTotal)
                },
                payload: JSON.stringify({ name: nomeArquivo, mimeType: tipoMime }),
                muteHttpExceptions: true,
                followRedirects: false
            }
        );

        const code = resp.getResponseCode();
        const sessionUri = lerHeader_(resp, "Location");

        if (code !== 200 || !sessionUri) {
            try { arquivo.setTrashed(true); } catch (e) {}
            return { status: "erro", mensagem: "Drive não abriu a sessão de upload (" + code + "): " + resp.getContentText() };
        }

        // uploadUrl agora é a URL de SESSÃO (com upload_id), a única aceita para enviar fatias
        return { status: "ok", fileId: fileId, uploadUrl: sessionUri };
    } catch (err) {
        return { status: "erro", mensagem: err.toString() };
    }
}

function enviarFatiaUpload(p) {
    try {
        const uploadUrl = safeStr(p.uploadUrl);
        if (!uploadUrl || uploadUrl.indexOf("upload_id=") === -1) {
            return { status: "erro", mensagem: "URL de sessão inválida." };
        }

        const chunkBytes = Utilities.base64Decode(p.chunkBase64);
        const offset = parseInt(p.offset);
        const chunkLength = chunkBytes.length; // usa o tamanho real recebido
        const totalSize = parseInt(p.totalSize);

        const response = UrlFetchApp.fetch(uploadUrl, {
            method: "put",
            contentType: "application/octet-stream",
            headers: {
                "Authorization": "Bearer " + ScriptApp.getOAuthToken(),
                "Content-Range": "bytes " + offset + "-" + (offset + chunkLength - 1) + "/" + totalSize
            },
            payload: chunkBytes,
            muteHttpExceptions: true,
            followRedirects: false
        });

        const code = response.getResponseCode();
        // 308 = fatia aceita, faltam mais | 200/201 = upload completo
        if (code === 200 || code === 201 || code === 308) {
            return { status: "ok", code: code, completo: code !== 308 };
        }
        return { status: "erro", mensagem: "Erro no Drive (" + code + "): " + response.getContentText() };
    } catch (err) {
        return { status: "erro", mensagem: err.toString() };
    }
}

function confirmarUploadDireto(p) {
    try {
        const fileId = p.fileId;
        if (!fileId) return { status: "erro", mensagem: "fileId ausente." };

        const arquivo = DriveApp.getFileById(fileId);
        arquivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        if (p.descricao) arquivo.setDescription(safeStr(p.descricao));

        const linkVisualizar = arquivo.getUrl();
        const linkDownload = "https://drive.google.com/uc?export=download&id=" + fileId;
        const tamanhoMB = safeStr(p.tamanho) || (arquivo.getSize() / (1024 * 1024)).toFixed(2);
        const ss = SpreadsheetApp.getActiveSpreadsheet();

        // ---------- Fluxo IEAD Creative (tem capa e usuário) ----------
        if (p.capaBase64) {
            if (!p.usuarioId) return { status: "erro", mensagem: "É necessário estar logado" };

            const cad = buscarUsuarioPorId_(p.usuarioId) || {};
            const autor = {
                nome: safeStr(p.usuarioNome) || cad.nome || "",
                whatsapp: safeStr(p.usuarioWhatsApp) || cad.whatsapp || "",
                congregacao: safeStr(p.usuarioCongregacao) || cad.congregacao || "",
                idade: safeStr(p.usuarioIdade) || cad.idade || "",
                foto: safeStr(p.usuarioFoto) || cad.foto || "",
                cidade: safeStr(p.usuarioCidade) || cad.cidade || ""
            };

            const subpasta = obterSubpasta(obterPastaPrincipal(), "IEAD Creative");

            const capaBlob = Utilities.newBlob(
                Utilities.base64Decode(p.capaBase64),
                p.capaTipoMime || "image/png",
                "capa_" + fileId + ".png"
            );
            const capaFile = subpasta.createFile(capaBlob);
            capaFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            const capaURL = "https://drive.google.com/thumbnail?id=" + capaFile.getId() + "&sz=w800";

            const aba = ss.getSheetByName(ABA_CRIATIVOS);
            const id = Math.max(aba.getLastRow(), 1);

            aba.appendRow([
                id,
                safeStr(p.nome) || safeStr(p.nomeArquivo).replace(/\.[^/.]+$/, ""),
                "PSD",
                linkVisualizar,
                linkDownload,
                safeStr(p.descricao),
                new Date(),
                true,
                fileId,
                tamanhoMB + " MB",
                capaURL,
                safeStr(p.usuarioId),
                autor.nome,
                "'" + autor.whatsapp,
                autor.congregacao,
                "'" + autor.idade,
                autor.foto,
                autor.cidade
            ]);

            const ultimaLinha = aba.getLastRow();
            aba.getRange(ultimaLinha, 14).setNumberFormat("@");
            aba.getRange(ultimaLinha, 16).setNumberFormat("@");

            registrarLog("SITE", "CREATIVE_UPLOAD", safeStr(p.nomeArquivo) + " por " + autor.nome);
            return { status: "ok", mensagem: "PSD enviado!", id: id, fileId: fileId, preview: capaURL, link: linkDownload };
        }

        // ---------- Fluxo antigo (aba Arquivos) ----------
        const preview = "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w800";
        const aba2 = ss.getSheetByName(ABA_ARQUIVOS);
        const id2 = Math.max(aba2.getLastRow(), 1);
        const ext = safeStr(p.nomeArquivo).split(".").pop().toUpperCase();

        aba2.appendRow([
            id2, safeStr(p.nomeAmigavel) || safeStr(p.nomeArquivo).replace(/\.[^/.]+$/, ""), ext, linkDownload,
            safeStr(p.descricao) || "Clique para baixar", safeStr(p.categoria) || "Geral",
            new Date(), true, fileId, tamanhoMB + " MB", preview
        ]);

        return { status: "ok", mensagem: "Upload registrado!", arquivo: { id: id2, link: linkDownload, preview: preview, fileId: fileId } };
    } catch (err) {
        return { status: "erro", mensagem: err.toString() };
    }
}

// ============================================================
// OUTRAS FUNÇÕES (Mantidas)
// ============================================================
function obterPastaPrincipal() {
    const pastas = DriveApp.getFoldersByName(PASTA_DRIVE);
    if (pastas.hasNext()) return pastas.next();
    return DriveApp.createFolder(PASTA_DRIVE);
}

function obterSubpasta(pastaPai, nome) {
    const subs = pastaPai.getFoldersByName(nome);
    if (subs.hasNext()) return subs.next();
    return pastaPai.createFolder(nome);
}

function determinarSubpasta(nomeArq) {
    const ext = (safeStr(nomeArq).split(".").pop() || "").toUpperCase();
    const mapa = {
        PDF: "Documentos PDF", DOC: "Word", DOCX: "Word",
        XLS: "Planilhas", XLSX: "Planilhas",
        PPT: "Apresentações", PPTX: "Apresentações",
        PNG: "Imagens", JPG: "Imagens", JPEG: "Imagens", GIF: "Imagens", SVG: "Imagens", WEBP: "Imagens",
        MP4: "Vídeos", MOV: "Vídeos", AVI: "Vídeos", MKV: "Vídeos",
        MP3: "Áudios", WAV: "Áudios",
        ZIP: "Compactados", RAR: "Compactados",
        PSD: "Editáveis", AI: "Editáveis"
    };
    return mapa[ext] || "Outros";
}

function obterInfoPasta() {
    const pasta = obterPastaPrincipal();
    const subpastas = pasta.getFolders();
    const listaSubpastas = [];
    while (subpastas.hasNext()) {
        const sub = subpastas.next();
        const arquivos = sub.getFiles();
        let contador = 0;
        while (arquivos.hasNext()) { arquivos.next(); contador++; }
        listaSubpastas.push({ nome: sub.getName(), id: sub.getId(), url: sub.getUrl(), total_arquivos: contador });
    }
    return {
        nome: pasta.getName(),
        id: pasta.getId(),
        url: pasta.getUrl(),
        total_subpastas: listaSubpastas.length,
        subpastas: listaSubpastas
    };
}

// ============================================================
// DOWNLOAD FATIADO (para abrir PSDs grandes no Photopea)
// ============================================================
function baixarPSDInfo(fileId) {
    try {
        if (!fileId) return { status: "erro", mensagem: "fileId é obrigatório" };
        const f = DriveApp.getFileById(fileId);
        return { status: "ok", nome: f.getName(), mimeType: f.getMimeType(), tamanho: f.getSize() };
    } catch (err) {
        return { status: "erro", mensagem: err.toString() };
    }
}

function baixarPSDFatia(fileId, offset, length) {
    if (!fileId) return { status: "erro", mensagem: "fileId é obrigatório" };
    const ini = parseInt(offset) || 0;
    const tam = Math.min(parseInt(length) || (3 * 1024 * 1024), 8 * 1024 * 1024);

    // Tenta variações da URL e repete em caso de "Erro inesperado" (falha transitória do UrlFetchApp)
    const urls = [
        "https://www.googleapis.com/drive/v3/files/" + fileId + "?alt=media&supportsAllDrives=true",
        "https://www.googleapis.com/drive/v3/files/" + fileId + "?alt=media",
        "https://www.googleapis.com/drive/v3/files/" + fileId + "?alt=media&acknowledgeAbuse=true"
    ];
    let ultimoErro = "";

    for (let tentativa = 0; tentativa < 6; tentativa++) {
        const url = urls[tentativa % urls.length];
        try {
            const resp = UrlFetchApp.fetch(url, {
                headers: {
                    "Authorization": "Bearer " + ScriptApp.getOAuthToken(),
                    "Range": "bytes=" + ini + "-" + (ini + tam - 1)
                },
                muteHttpExceptions: true,
                followRedirects: true
            });

            const code = resp.getResponseCode();
            if (code === 200 || code === 206) {
                const bytes = resp.getContent();
                // Se o Drive ignorou o Range e mandou o arquivo inteiro, recorta o pedaço certo
                const pedaco = (code === 200 && bytes.length > tam) ? bytes.slice(ini, ini + tam) : bytes;
                return { status: "ok", offset: ini, bytes: pedaco.length, base64: Utilities.base64Encode(pedaco) };
            }
            ultimoErro = "HTTP " + code + ": " + resp.getContentText().substring(0, 200);
            if (code === 401 || code === 403 || code === 404) break; // não adianta repetir
        } catch (err) {
            ultimoErro = err.toString();
        }
        Utilities.sleep(700 * (tentativa + 1));
    }
    return { status: "erro", mensagem: "Falha ao ler o arquivo no Drive: " + ultimoErro };
}

// Rode no editor do Apps Script (informe um fileId) para ver o erro real do Drive
function diagnosticoDownload() {
    const fileId = "COLE_AQUI_O_FILE_ID"; // ex.: 1_lAnjvIUwrfvkka4nfOOcZG0qGsy2YA9
    const f = DriveApp.getFileById(fileId);
    Logger.log("Nome: " + f.getName() + " | Tamanho: " + f.getSize() + " | Tipo: " + f.getMimeType());
    try {
        const r = UrlFetchApp.fetch("https://www.googleapis.com/drive/v3/files/" + fileId + "?alt=media&supportsAllDrives=true", {
            headers: { "Authorization": "Bearer " + ScriptApp.getOAuthToken(), "Range": "bytes=0-1023" },
            muteHttpExceptions: true
        });
        Logger.log("HTTP " + r.getResponseCode() + " | bytes: " + r.getContent().length + " | headers: " + JSON.stringify(r.getAllHeaders()));
        Logger.log(r.getResponseCode() >= 400 ? r.getContentText() : "OK");
    } catch (e) {
        Logger.log("EXCEÇÃO: " + e.toString());
    }
}

// ============================================================
// DADOS DO AUTOR (busca na aba Usuarios quando faltar algo)
// ============================================================
function buscarUsuarioPorId_(usuarioId) {
    try {
        if (!usuarioId) return null;
        const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_USUARIOS);
        if (!aba) return null;
        const dados = aba.getDataRange().getValues();
        for (let i = 1; i < dados.length; i++) {
            if (safeStr(dados[i][0]) === safeStr(usuarioId)) {
                return {
                    nome: safeStr(dados[i][1]),
                    whatsapp: safeStr(dados[i][3]),
                    congregacao: safeStr(dados[i][4]),
                    idade: safeStr(dados[i][5]),
                    cidade: safeStr(dados[i][6]),
                    foto: safeStr(dados[i][7])
                };
            }
        }
    } catch (e) {}
    return null;
}

// Rode UMA vez no editor do Apps Script para preencher autores vazios em PSDs já enviados
function corrigirAutoresCriativos() {
    const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_CRIATIVOS);
    if (!aba) return;
    const dados = aba.getDataRange().getValues();
    let corrigidos = 0;
    for (let i = 1; i < dados.length; i++) {
        const uid = safeStr(dados[i][11]);
        if (!uid || safeStr(dados[i][12])) continue; // sem ID ou já tem nome
        const u = buscarUsuarioPorId_(uid);
        if (!u) continue;
        const r = i + 1;
        aba.getRange(r, 13).setValue(u.nome);
        aba.getRange(r, 14).setNumberFormat("@").setValue(u.whatsapp);
        aba.getRange(r, 15).setValue(u.congregacao);
        aba.getRange(r, 16).setNumberFormat("@").setValue(u.idade);
        aba.getRange(r, 17).setValue(u.foto);
        aba.getRange(r, 18).setValue(u.cidade);
        corrigidos++;
    }
    Logger.log("Autores corrigidos: " + corrigidos);
}

function baixarPSDBase64(fileId) {
    try {
        if (!fileId) return { status: "erro", mensagem: "fileId é obrigatório" };
        const file = DriveApp.getFileById(fileId);
        const blob = file.getBlob();
        const bytes = blob.getBytes();
        const tamanhoMB = (bytes.length / (1024 * 1024)).toFixed(2);
        
        if (bytes.length > 45 * 1024 * 1024) {
            return { status: "erro", mensagem: "Arquivo muito grande para edição (máx 45 MB)." };
        }
        return {
            status: "ok",
            fileName: file.getName(),
            mimeType: file.getMimeType(),
            tamanhoMB: tamanhoMB,
            base64: Utilities.base64Encode(bytes)
        };
    } catch (err) {
        return { status: "erro", mensagem: err.toString() };
    }
}

function uploadArquivo(p) {
    try {
        if (!p.nomeArquivo || !p.dadosBase64) return { status: "erro", mensagem: "Dados incompletos" };
        const tamanho = Math.ceil(p.dadosBase64.length * 3 / 4);
        const tamanhoMB = (tamanho / (1024 * 1024)).toFixed(2);
        if (tamanho > 50 * 1024 * 1024) return { status: "erro", mensagem: "Arquivo muito grande para este método (máx 50MB)." };

        const pasta = obterPastaPrincipal();
        const subpasta = obterSubpasta(pasta, determinarSubpasta(p.nomeArquivo));
        const blob = Utilities.newBlob(Utilities.base64Decode(p.dadosBase64), p.tipoMime || "application/octet-stream", p.nomeArquivo);
        const arquivo = subpasta.createFile(blob);
        arquivo.setDescription(p.descricao || "Arquivo Marketing IEAD");
        arquivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

        const fileId = arquivo.getId();
        const link = "https://drive.google.com/uc?export=download&id=" + fileId;
        const preview = "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w800";

        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const aba = ss.getSheetByName(ABA_ARQUIVOS);
        const id = Math.max(aba.getLastRow(), 1);
        const ext = safeStr(p.nomeArquivo).split(".").pop().toUpperCase();

        aba.appendRow([
            id, safeStr(p.nomeAmigavel) || safeStr(p.nomeArquivo).replace(/\.[^/.]+$/, ""), ext, link,
            safeStr(p.descricao) || "Clique para baixar", safeStr(p.categoria) || "Geral",
            new Date(), true, fileId, tamanhoMB + " MB", preview
        ]);

        return { status: "ok", mensagem: "Upload concluído!", arquivo: { id, link, preview, fileId } };
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
        const blob = Utilities.newBlob(Utilities.base64Decode(p.dadosBase64), p.tipoMime || "image/png", p.nomeArquivo);
        const arquivo = subLogo.createFile(blob);
        arquivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        const fileId = arquivo.getId();
        const url = "https://drive.google.com/uc?export=view&id=" + fileId;
        for (let i = 1; i < dados.length; i++) {
            if (dados[i][0] === "Logo_URL") abaConf.getRange(i+1, 2).setValue(url);
            if (dados[i][0] === "Logo_File_ID") abaConf.getRange(i+1, 2).setValue(fileId);
        }
        return { status: "ok", mensagem: "Logo atualizada!", url, fileId };
    } catch (err) {
        return { status: "erro", mensagem: err.toString() };
    }
}

function creativeUpload(p) {
    try {
        if (!p.nomeArquivo || !p.dadosBase64) return { status: "erro", mensagem: "Dados incompletos" };
        if (!p.capaBase64) return { status: "erro", mensagem: "A capa do PSD é obrigatória" };
        if (!p.usuarioId || !p.usuarioNome) return { status: "erro", mensagem: "É necessário estar logado" };

        const tamanho = Math.ceil(p.dadosBase64.length * 3 / 4);
        const tamanhoMB = (tamanho / (1024 * 1024)).toFixed(2);
        
        if (tamanho > 50 * 1024 * 1024) return { status: "erro", mensagem: "PSD muito grande (máx 50MB)." };

        const pasta = obterPastaPrincipal();
        const subpasta = obterSubpasta(pasta, "IEAD Creative");

        const blob = Utilities.newBlob(
            Utilities.base64Decode(p.dadosBase64),
            p.tipoMime || "image/vnd.adobe.photoshop",
            p.nomeArquivo
        );
        const arquivo = subpasta.createFile(blob);
        arquivo.setDescription(safeStr(p.descricao) || "Template PSD IEAD Creative");
        arquivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

        const fileId = arquivo.getId();
        const linkVisualizar = arquivo.getUrl();
        const linkDownload = "https://drive.google.com/uc?export=download&id=" + fileId;

        const capaBlob = Utilities.newBlob(
            Utilities.base64Decode(p.capaBase64),
            p.capaTipoMime || "image/png",
            "capa_" + fileId + ".png"
        );
        const capaFile = subpasta.createFile(capaBlob);
        capaFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        const capaURL = "https://drive.google.com/thumbnail?id=" + capaFile.getId() + "&sz=w800";

        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const aba = ss.getSheetByName(ABA_CRIATIVOS);
        const id = Math.max(aba.getLastRow(), 1);

        aba.appendRow([
            id,
            safeStr(p.nome) || safeStr(p.nomeArquivo).replace(/\.[^/.]+$/, ""),
            "PSD",
            linkVisualizar,
            linkDownload,
            safeStr(p.descricao),
            new Date(),
            true,
            fileId,
            tamanhoMB + " MB",
            capaURL,
            safeStr(p.usuarioId),
            safeStr(p.usuarioNome),
            "'" + safeStr(p.usuarioWhatsApp),
            safeStr(p.usuarioCongregacao),
            "'" + safeStr(p.usuarioIdade),
            safeStr(p.usuarioFoto),
            safeStr(p.usuarioCidade)
        ]);

        const ultimaLinha = aba.getLastRow();
        aba.getRange(ultimaLinha, 14).setNumberFormat('@'); 
        aba.getRange(ultimaLinha, 16).setNumberFormat('@'); 

        registrarLog("SITE", "CREATIVE_UPLOAD", safeStr(p.nomeArquivo) + " por " + safeStr(p.usuarioNome));
        return { status: "ok", mensagem: "PSD enviado!", id, fileId, preview: capaURL, link: linkDownload };
    } catch (err) {
        return { status: "erro", mensagem: err.toString() };
    }
}

function creativeRemover(id) {
    const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_CRIATIVOS);
    if (!aba) return { status: "erro", mensagem: "Aba não encontrada" };
    const dados = aba.getDataRange().getValues();
    for (let i = 1; i < dados.length; i++) {
        if (safeStr(dados[i][0]) === safeStr(id)) {
            if (dados[i][8]) {
                try { DriveApp.getFileById(dados[i][8]).setTrashed(true); } catch (e) {}
            }
            aba.deleteRow(i + 1);
            return { status: "ok", mensagem: "Template removido" };
        }
    }
    return { status: "erro", mensagem: "Não encontrado" };
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
        const nome = safeStr(l[1]);
        const cat = safeStr(l[5]) || "Geral";
        if (filtro && !nome.toLowerCase().includes(safeStr(filtro).toLowerCase())) continue;
        if (categoria && cat.toLowerCase() !== safeStr(categoria).toLowerCase()) continue;
        out.push({
            id: l[0],
            nome: nome,
            tipo: safeStr(l[2]),
            link: safeStr(l[3]),
            descricao: safeStr(l[4]),
            categoria: cat,
            data: l[6] ? Utilities.formatDate(new Date(l[6]), Session.getScriptTimeZone(), "dd/MM/yyyy") : "",
            fileId: safeStr(l[8]),
            tamanho: safeStr(l[9]),
            preview: safeStr(l[10])
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
    for (let i = 1; i < dados.length; i++) {
        if (dados[i][0]) cfg[safeStr(dados[i][0])] = safeStr(dados[i][1]);
    }
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
        out.push({ id: l[0], nome: safeStr(l[1]), icone: safeStr(l[2]) || 'fa-folder', ordem: l[3] || i });
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
        out.push({ id: l[0], titulo: safeStr(l[1]), descricao: safeStr(l[2]), badge: safeStr(l[3]), link: safeStr(l[4]), textoBotao: safeStr(l[5]), ordem: l[6] });
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
        out.push({ id: l[0], nome: safeStr(l[1]), link: safeStr(l[2]), ordem: l[3], novaAba: l[5] === true || l[5] === "TRUE" });
    }
    return out.sort((a, b) => a.ordem - b.ordem);
}

function listarCriativos() {
    const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_CRIATIVOS);
    if (!aba) return [];
    const dados = aba.getDataRange().getValues();
    const out = [];
    for (let i = 1; i < dados.length; i++) {
        const l = dados[i];
        if (!l[1] || !l[3]) continue;
        if (l[7] !== true && l[7] !== "TRUE" && l[7] !== "") continue;
        out.push({
            id: safeStr(l[0]),
            nome: safeStr(l[1]),
            tipo: safeStr(l[2]) || "PSD",
            link: safeStr(l[3]),
            link_download: safeStr(l[4]) || safeStr(l[3]),
            descricao: safeStr(l[5]),
            data: l[6] ? Utilities.formatDate(new Date(l[6]), Session.getScriptTimeZone(), "dd/MM/yyyy") : "",
            fileId: safeStr(l[8]),
            tamanho: safeStr(l[9]),
            preview: safeStr(l[10]),
            usuarioId: safeStr(l[11]),
            usuarioNome: safeStr(l[12]),
            usuarioWhatsApp: safeStr(l[13]),
            usuarioCongregacao: safeStr(l[14]),
            usuarioIdade: safeStr(l[15]),
            usuarioFoto: safeStr(l[16]),
            usuarioCidade: safeStr(l[17])
        });
    }
    return out.reverse();
}

function obterEstatisticas() {
    const arqs = listarArquivos();
    const cats = listarCategorias();
    let totalMB = 0;
    const porTipo = {};
    arqs.forEach(a => {
        porTipo[a.tipo] = (porTipo[a.tipo] || 0) + 1;
        if (a.tamanho) { const m = safeStr(a.tamanho).match(/([\d.]+)/); if (m) totalMB += parseFloat(m[1]); }
    });
    return { total_arquivos: arqs.length, total_categorias: cats.length, total_mb: totalMB.toFixed(2), por_tipo: porTipo };
}

function obterTudo() {
    return {
        config: obterConfiguracoes(),
        arquivos: listarArquivos(),
        categorias: listarCategorias(),
        carrossel: listarCarrossel(),
        menus: listarMenus(),
        criativos: listarCriativos()
    };
}

function removerArquivo(id) {
    const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_ARQUIVOS);
    const dados = aba.getDataRange().getValues();
    for (let i = 1; i < dados.length; i++) {
        if (safeStr(dados[i][0]) === safeStr(id)) {
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
            if (safeStr(valores[i][0]) === safeStr(chave)) {
                aba.getRange(i + 1, 2).setValue(safeStr(dados[chave]));
                achou = true;
                break;
            }
        }
        if (!achou) aba.appendRow([chave, safeStr(dados[chave]), ""]);
    });
    return { status: "ok", mensagem: "Configurações salvas" };
}

function salvarSlide(dados, id) {
    const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_CARROSSEL);
    const valores = aba.getDataRange().getValues();
    if (id) {
        for (let i = 1; i < valores.length; i++) {
            if (safeStr(valores[i][0]) === safeStr(id)) {
                aba.getRange(i + 1, 1, 1, 8).setValues([[id, safeStr(dados.titulo), safeStr(dados.descricao), safeStr(dados.badge), safeStr(dados.link), safeStr(dados.textoBotao), dados.ordem || i, true]]);
                return { status: "ok", mensagem: "Slide atualizado", id };
            }
        }
        return { status: "erro", mensagem: "Slide não encontrado" };
    }
    const novoId = Math.max(aba.getLastRow(), 1);
    aba.appendRow([novoId, safeStr(dados.titulo), safeStr(dados.descricao), safeStr(dados.badge), safeStr(dados.link) || "#", safeStr(dados.textoBotao) || "Ver mais", dados.ordem || novoId, true]);
    return { status: "ok", mensagem: "Slide criado", id: novoId };
}

function removerSlide(id) {
    const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_CARROSSEL);
    const dados = aba.getDataRange().getValues();
    for (let i = 1; i < dados.length; i++) {
        if (safeStr(dados[i][0]) === safeStr(id)) { aba.deleteRow(i + 1); return { status: "ok", mensagem: "Slide removido" }; }
    }
    return { status: "erro", mensagem: "Não encontrado" };
}

function salvarMenu(dados, id) {
    const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_MENUS);
    const valores = aba.getDataRange().getValues();
    if (id) {
        for (let i = 1; i < valores.length; i++) {
            if (safeStr(valores[i][0]) === safeStr(id)) {
                aba.getRange(i + 1, 1, 1, 6).setValues([[id, safeStr(dados.nome), safeStr(dados.link), dados.ordem || i, true, dados.novaAba || false]]);
                return { status: "ok", mensagem: "Menu atualizado", id };
            }
        }
        return { status: "erro", mensagem: "Menu não encontrado" };
    }
    const novoId = Math.max(aba.getLastRow(), 1);
    aba.appendRow([novoId, safeStr(dados.nome), safeStr(dados.link), dados.ordem || novoId, true, dados.novaAba || false]);
    return { status: "ok", mensagem: "Menu criado", id: novoId };
}

function removerMenu(id) {
    const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_MENUS);
    const dados = aba.getDataRange().getValues();
    for (let i = 1; i < dados.length; i++) {
        if (safeStr(dados[i][0]) === safeStr(id)) { aba.deleteRow(i + 1); return { status: "ok", mensagem: "Menu removido" }; }
    }
    return { status: "erro", mensagem: "Não encontrado" };
}

function salvarCategoria(dados, id) {
    const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_CATEGORIAS);
    const valores = aba.getDataRange().getValues();
    if (id) {
        for (let i = 1; i < valores.length; i++) {
            if (safeStr(valores[i][0]) === safeStr(id)) {
                aba.getRange(i + 1, 1, 1, 4).setValues([[id, safeStr(dados.nome), safeStr(dados.icone) || 'fa-folder', dados.ordem || i]]);
                return { status: "ok", mensagem: "Categoria atualizada", id };
            }
        }
        return { status: "erro", mensagem: "Categoria não encontrada" };
    }
    const novoId = Math.max(aba.getLastRow(), 1);
    aba.appendRow([novoId, safeStr(dados.nome), safeStr(dados.icone) || 'fa-folder', dados.ordem || novoId]);
    return { status: "ok", mensagem: "Categoria criada", id: novoId };
}

function removerCategoria(id) {
    const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_CATEGORIAS);
    const dados = aba.getDataRange().getValues();
    for (let i = 1; i < dados.length; i++) {
        if (safeStr(dados[i][0]) === safeStr(id)) { aba.deleteRow(i + 1); return { status: "ok", mensagem: "Categoria removida" }; }
    }
    return { status: "erro", mensagem: "Categoria não encontrada" };
}

function registrarLog(usuario, acao, detalhes) {
    try {
        const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_LOGS);
        if (aba) {
            aba.appendRow([new Date(), safeStr(usuario), safeStr(acao), safeStr(detalhes)]);
            if (aba.getLastRow() > 1000) aba.deleteRows(2, 100);
        }
    } catch (e) {}
}

function responderJSON(dados, callback) {
    const json = JSON.stringify(dados);
    if (callback) {
        return ContentService.createTextOutput(callback + "(" + json + ");").setMimeType(ContentService.MimeType.JAVASCRIPT);
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
            if (safeStr(dados[i][0]) === "Pasta_Drive_ID") abaConf.getRange(i+1, 2).setValue(pasta.getId());
            if (safeStr(dados[i][0]) === "Pasta_Drive_URL") abaConf.getRange(i+1, 2).setValue(pasta.getUrl());
        }
        SpreadsheetApp.getUi().alert("✅ CMS Configurado!");
    } catch (err) {
        SpreadsheetApp.getUi().alert("❌ Erro: " + err.toString());
    }
}

function onOpen() {
    SpreadsheetApp.getUi().createMenu("⚙️ Marketing IEAD")
        .addItem("🚀 Setup Inicial", "setupInicial")
        .addItem("🔐 Forçar Permissões", "forcarAutorizacao")
        .addToUi();
}
