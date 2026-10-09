/* ============================================================
 * CMS MARKETING IEAD - Lógica do Painel
 * ============================================================ */

const API_URL = "COLE_AQUI_A_URL_DO_SEU_GOOGLE_APPS_SCRIPT";
const SENHA_ADMIN = "IEAD2026";

let estado = {
    config: {},
    arquivos: [],
    categorias: [],
    carrossel: [],
    menus: []
};

// ============================================================
// LOGIN
// ============================================================
function fazerLogin() {
    const senha = document.getElementById('adminPassword').value;
    if (senha === SENHA_ADMIN) {
        sessionStorage.setItem('adminLogged', 'true');
        mostrarCMS();
    } else {
        document.getElementById('loginError').textContent = 'Senha incorreta';
    }
}

function fazerLogout() {
    sessionStorage.removeItem('adminLogged');
    location.reload();
}

function mostrarCMS() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('cmsWrapper').style.display = 'grid';
    carregarTudo();
}

// Auto-login se já logado
if (sessionStorage.getItem('adminLogged') === 'true') {
    mostrarCMS();
}

document.getElementById('adminPassword')?.addEventListener('keypress', e => {
    if (e.key === 'Enter') fazerLogin();
});

// ============================================================
// NAVEGAÇÃO
// ============================================================
document.querySelectorAll('.cms-nav a').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const tab = link.dataset.tab;
        document.querySelectorAll('.cms-nav a').forEach(a => a.classList.remove('active'));
        document.querySelectorAll('.cms-section').forEach(s => s.classList.remove('active'));
        link.classList.add('active');
        document.getElementById('tab-' + tab).classList.add('active');
        document.getElementById('pageTitle').textContent = link.textContent.trim();
    });
});

// ============================================================
// API HELPER
// ============================================================
async function apiGet(acao, params = {}) {
    const url = new URL(API_URL);
    url.searchParams.set('acao', acao);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const r = await fetch(url);
    return r.json();
}

async function apiPost(dados) {
    const r = await fetch(API_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(dados)
    });
    return r.json();
}

// ============================================================
// CARREGAR TUDO
// ============================================================
async function carregarTudo() {
    try {
        const dados = await apiGet('tudo');
        estado = dados;
        renderizarDashboard();
        renderizarArquivos();
        renderizarCategorias();
        renderizarCarrossel();
        renderizarMenus();
        preencherFormularios();
    } catch (err) {
        console.error(err);
    }
}

// ============================================================
// DASHBOARD
// ============================================================
function renderizarDashboard() {
    const stats = {
        arquivos: estado.arquivos.length,
        categorias: estado.categorias.length,
        mb: estado.arquivos.reduce((s, a) => s + (parseFloat(a.tamanho) || 0), 0).toFixed(1)
    };
    
    document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card"><i class="fas fa-file"></i><h2>${stats.arquivos}</h2><p>Arquivos</p></div>
        <div class="stat-card"><i class="fas fa-database"></i><h2>${stats.mb} MB</h2><p>Total</p></div>
        <div class="stat-card"><i class="fas fa-folder"></i><h2>${stats.categorias}</h2><p>Categorias</p></div>
    `;

    if (estado.config.Pasta_Drive_URL) {
        document.getElementById('linkPastaDrive').href = estado.config.Pasta_Drive_URL;
    }
}

// ============================================================
// ARQUIVOS (com PREVIEW)
// ============================================================
function renderizarArquivos() {
    const container = document.getElementById('arquivosList');
    if (!estado.arquivos.length) {
        container.innerHTML = '<p class="empty">Nenhum arquivo ainda.</p>';
        return;
    }

    container.innerHTML = estado.arquivos.map(a => {
        const isImg = ['PNG','JPG','JPEG','GIF','WEBP','SVG'].includes(a.tipo.toUpperCase());
        const isVid = ['MP4','MOV','AVI','WEBM'].includes(a.tipo.toUpperCase());
        const isPdf = a.tipo.toUpperCase() === 'PDF';
        
        let previewHTML = '';
        if (isImg && a.preview) {
            previewHTML = `<img src="${a.preview}" class="preview-thumb">`;
        } else if (isVid && a.preview) {
            previewHTML = `<div class="preview-icon video"><i class="fas fa-play-circle"></i></div>`;
        } else if (isPdf) {
            previewHTML = `<div class="preview-icon pdf"><i class="fas fa-file-pdf"></i></div>`;
        } else {
            previewHTML = `<div class="preview-icon"><i class="fas fa-file"></i></div>`;
        }

        return `
            <div class="arquivo-item">
                <div class="arquivo-preview">${previewHTML}</div>
                <div class="arquivo-info">
                    <h4>${a.nome}</h4>
                    <p>${a.descricao}</p>
                    <div class="arquivo-meta">
                        <span class="tag">${a.tipo}</span>
                        <span class="tag">${a.categoria}</span>
                        ${a.tamanho ? `<span class="tag">${a.tamanho}</span>` : ''}
                    </div>
                </div>
                <div class="arquivo-actions">
                    <a href="${a.link}" target="_blank" class="btn-icon" title="Baixar"><i class="fas fa-download"></i></a>
                    <button onclick="removerArquivo(${a.id})" class="btn-icon danger" title="Excluir"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

async function removerArquivo(id) {
    if (!confirm('Tem certeza que deseja remover este arquivo?')) return;
    await apiPost({ acao: 'remover', id });
    carregarTudo();
}

// Filtro de arquivos
document.getElementById('filtroArquivos')?.addEventListener('input', function() {
    const termo = this.value.toLowerCase();
    document.querySelectorAll('.arquivo-item').forEach(item => {
        const texto = item.textContent.toLowerCase();
        item.style.display = texto.includes(termo) ? 'flex' : 'none';
    });
});

// ============================================================
// CATEGORIAS (para o upload)
// ============================================================
function renderizarCategorias() {
    const sel = document.getElementById('categoriaUpload');
    if (!sel) return;
    sel.innerHTML = estado.categorias.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('');
}

// ============================================================
// UPLOAD
// ============================================================
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
let arquivoAtual = null;

uploadArea?.addEventListener('click', () => fileInput.click());
uploadArea?.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('dragover'); });
uploadArea?.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
uploadArea?.addEventListener('drop', e => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    if (e.dataTransfer.files.length) { fileInput.files = e.dataTransfer.files; selecionarArquivo(e.dataTransfer.files[0]); }
});
fileInput?.addEventListener('change', () => { if (fileInput.files.length) selecionarArquivo(fileInput.files[0]); });

function selecionarArquivo(file) {
    arquivoAtual = file;
    const previewDiv = document.getElementById('uploadPreview');
    const previewContent = document.getElementById('previewContent');
    previewDiv.style.display = 'block';

    const isImg = file.type.startsWith('image/');
    const isVid = file.type.startsWith('video/');
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);

    if (isImg) {
        const reader = new FileReader();
        reader.onload = e => {
            previewContent.innerHTML = `
                <img src="${e.target.result}" class="upload-thumb">
                <p><strong>${file.name}</strong> • ${sizeMB} MB</p>
            `;
        };
        reader.readAsDataURL(file);
    } else if (isVid) {
        previewContent.innerHTML = `
            <div class="preview-icon video big"><i class="fas fa-play-circle"></i></div>
            <p><strong>${file.name}</strong> • ${sizeMB} MB • Vídeo</p>
        `;
    } else {
        previewContent.innerHTML = `
            <div class="preview-icon big"><i class="fas fa-file"></i></div>
            <p><strong>${file.name}</strong> • ${sizeMB} MB</p>
        `;
    }

    document.getElementById('nomeAmigavel').value = file.name.replace(/\.[^/.]+$/, '');
}

document.getElementById('uploadBtn')?.addEventListener('click', async () => {
    if (!arquivoAtual) return alert('Selecione um arquivo!');
    
    const status = document.getElementById('uploadStatus');
    const btn = document.getElementById('uploadBtn');
    
    if (arquivoAtual.size > 25 * 1024 * 1024) {
        status.innerHTML = '<p class="error-msg">Arquivo muito grande (máx: 25 MB)</p>';
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    status.innerHTML = '<p>⏳ Lendo arquivo...</p>';

    try {
        const base64 = await fileToBase64(arquivoAtual);
        status.innerHTML = '<p>⏳ Enviando para o Drive...</p>';

        const payload = {
            acao: 'upload',
            nomeArquivo: arquivoAtual.name,
            tipoMime: arquivoAtual.type || 'application/octet-stream',
            dadosBase64: base64.split(',')[1],
            descricao: document.getElementById('descricaoUpload').value,
            categoria: document.getElementById('categoriaUpload').value,
            nomeAmigavel: document.getElementById('nomeAmigavel').value
        };

        const result = await apiPost(payload);
        
        if (result.status === 'ok') {
            status.innerHTML = `<p style="color:#28A745;">✅ ${result.mensagem}</p>`;
            arquivoAtual = null;
            fileInput.value = '';
            document.getElementById('uploadPreview').style.display = 'none';
            document.getElementById('nomeAmigavel').value = '';
            document.getElementById('descricaoUpload').value = '';
            carregarTudo();
        } else {
            status.innerHTML = `<p class="error-msg">❌ ${result.mensagem}</p>`;
        }
    } catch (err) {
        status.innerHTML = `<p class="error-msg">❌ ${err.message}</p>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-upload"></i> Enviar para o Google Drive';
    }
});

function fileToBase64(file) {
    return new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsDataURL(file);
    });
}

// ============================================================
// CARROSSEL
// ============================================================
function renderizarCarrossel() {
    const container = document.getElementById('carrosselList');
    if (!estado.carrossel.length) {
        container.innerHTML = '<p class="empty">Nenhum slide ainda.</p>';
        return;
    }
    container.innerHTML = estado.carrossel.map(s => `
        <div class="slide-item">
            <div class="slide-info">
                <span class="badge">${s.badge || 'Slide'}</span>
                <h4>${s.titulo}</h4>
                <p>${s.descricao}</p>
            </div>
            <div class="slide-actions">
                <button onclick='editarSlide(${JSON.stringify(s).replace(/'/g, "&#39;")})' class="btn-icon"><i class="fas fa-edit"></i></button>
                <button onclick="removerSlide(${s.id})" class="btn-icon danger"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function abrirModalSlide(slide = null) {
    const modal = document.getElementById('modalOverlay');
    const box = document.getElementById('modalBox');
    box.innerHTML = `
        <h2>${slide ? 'Editar' : 'Novo'} Slide</h2>
        <div class="form-grid">
            <div class="form-group full">
                <label>Título</label>
                <input type="text" id="slTitulo" value="${slide?.titulo || ''}">
            </div>
            <div class="form-group full">
                <label>Descrição</label>
                <textarea id="slDescricao">${slide?.descricao || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Badge</label>
                <input type="text" id="slBadge" value="${slide?.badge || ''}" placeholder="Ex: Novo">
            </div>
            <div class="form-group">
                <label>Texto do Botão</label>
                <input type="text" id="slBotao" value="${slide?.textoBotao || ''}" placeholder="Ver mais">
            </div>
            <div class="form-group full">
                <label>Link do Botão</label>
                <input type="text" id="slLink" value="${slide?.link || '#downloads'}">
            </div>
            <div class="form-group">
                <label>Ordem</label>
                <input type="number" id="slOrdem" value="${slide?.ordem || 1}">
            </div>
        </div>
        <div class="modal-actions">
            <button onclick="fecharModal()" class="btn-secondary">Cancelar</button>
            <button onclick="salvarSlide(${slide?.id || 'null'})" class="btn-primary">Salvar</button>
        </div>
    `;
    modal.style.display = 'flex';
}

async function salvarSlide(id) {
    const dados = {
        titulo: document.getElementById('slTitulo').value,
        descricao: document.getElementById('slDescricao').value,
        badge: document.getElementById('slBadge').value,
        textoBotao: document.getElementById('slBotao').value,
        link: document.getElementById('slLink').value,
        ordem: parseInt(document.getElementById('slOrdem').value) || 1
    };
    await apiPost({ acao: 'carrossel_salvar', dados, id });
    fecharModal();
    carregarTudo();
}

async function removerSlide(id) {
    if (!confirm('Remover este slide?')) return;
    await apiPost({ acao: 'carrossel_remover', id });
    carregarTudo();
}

function editarSlide(slide) { abrirModalSlide(slide); }

// ============================================================
// MENUS
// ============================================================
function renderizarMenus() {
    const container = document.getElementById('menusList');
    if (!estado.menus.length) {
        container.innerHTML = '<p class="empty">Nenhum menu ainda.</p>';
        return;
    }
    container.innerHTML = estado.menus.map(m => `
        <div class="menu-item">
            <div class="menu-info">
                <h4>${m.nome}</h4>
                <p>${m.link} ${m.novaAba ? '• abre em nova aba' : ''}</p>
            </div>
            <div class="menu-actions">
                <button onclick='editarMenu(${JSON.stringify(m).replace(/'/g, "&#39;")})' class="btn-icon"><i class="fas fa-edit"></i></button>
                <button onclick="removerMenu(${m.id})" class="btn-icon danger"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function abrirModalMenu(menu = null) {
    const modal = document.getElementById('modalOverlay');
    const box = document.getElementById('modalBox');
    box.innerHTML = `
        <h2>${menu ? 'Editar' : 'Novo'} Menu</h2>
        <div class="form-grid">
            <div class="form-group full">
                <label>Nome do Menu</label>
                <input type="text" id="mnNome" value="${menu?.nome || ''}" placeholder="Ex: Downloads">
            </div>
            <div class="form-group full">
                <label>Link</label>
                <input type="text" id="mnLink" value="${menu?.link || ''}" placeholder="#downloads ou https://...">
            </div>
            <div class="form-group">
                <label>Ordem</label>
                <input type="number" id="mnOrdem" value="${menu?.ordem || 1}">
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="mnNovaAba" ${menu?.novaAba ? 'checked' : ''}>
                    Abrir em nova aba
                </label>
            </div>
        </div>
        <div class="modal-actions">
            <button onclick="fecharModal()" class="btn-secondary">Cancelar</button>
            <button onclick="salvarMenu(${menu?.id || 'null'})" class="btn-primary">Salvar</button>
        </div>
    `;
    modal.style.display = 'flex';
}

async function salvarMenu(id) {
    const dados = {
        nome: document.getElementById('mnNome').value,
        link: document.getElementById('mnLink').value,
        ordem: parseInt(document.getElementById('mnOrdem').value) || 1,
        novaAba: document.getElementById('mnNovaAba').checked
    };
    await apiPost({ acao: 'menu_salvar', dados, id });
    fecharModal();
    carregarTudo();
}

async function removerMenu(id) {
    if (!confirm('Remover este menu?')) return;
    await apiPost({ acao: 'menu_remover', id });
    carregarTudo();
}

function editarMenu(menu) { abrirModalMenu(menu); }

// ============================================================
// APARÊNCIA - LOGO E CORES
// ============================================================
document.getElementById('logoInput')?.addEventListener('change', async function() {
    if (!this.files.length) return;
    const file = this.files[0];
    const base64 = await fileToBase64(file);
    
    const result = await apiPost({
        acao: 'upload_logo',
        nomeArquivo: file.name,
        tipoMime: file.type,
        dadosBase64: base64.split(',')[1]
    });
    
    if (result.status === 'ok') {
        document.getElementById('logoPreview').innerHTML = `<img src="${result.url}">`;
        alert('✅ Logo atualizada!');
    }
});

async function salvarCores() {
    const dados = {
        Cor_Primaria: document.getElementById('corPrimaria').value,
        Cor_Secundaria: document.getElementById('corSecundaria').value,
        Cor_Destaque: document.getElementById('corDestaque').value
    };
    await apiPost({ acao: 'atualizar_config', dados });
    alert('✅ Cores salvas!');
}

// ============================================================
// TEXTOS
// ============================================================
function preencherFormularios() {
    const c = estado.config;
    document.getElementById('txtTitulo').value = c.Titulo_Site || '';
    document.getElementById('txtSubtituloHero').value = c.Subtitulo_Hero || '';
    document.getElementById('txtDescricaoHero').value = c.Descricao_Hero || '';
    document.getElementById('txtBotaoHero').value = c.Texto_Botao_Hero || '';
    document.getElementById('txtInstagram').value = c.Instagram || '';
    document.getElementById('txtEmail').value = c.Email_Contato || '';
    document.getElementById('txtRodape').value = c.Texto_Rodape || '';
    
    document.getElementById('corPrimaria').value = c.Cor_Primaria || '#0A1C3A';
    document.getElementById('corSecundaria').value = c.Cor_Secundaria || '#1A3A6B';
    document.getElementById('corDestaque').value = c.Cor_Destaque || '#D4AF37';
    
    document.getElementById('optCarrossel').checked = c.Mostrar_Carrossel === 'TRUE';
    document.getElementById('optBusca').checked = c.Mostrar_Busca === 'TRUE';
    document.getElementById('optEstatisticas').checked = c.Mostrar_Estatisticas === 'TRUE';
    
    if (c.Logo_URL) {
        document.getElementById('logoPreview').innerHTML = `<img src="${c.Logo_URL}">`;
    }
}

async function salvarTextos() {
    const dados = {
        Titulo_Site: document.getElementById('txtTitulo').value,
        Subtitulo_Hero: document.getElementById('txtSubtituloHero').value,
        Descricao_Hero: document.getElementById('txtDescricaoHero').value,
        Texto_Botao_Hero: document.getElementById('txtBotaoHero').value,
        Instagram: document.getElementById('txtInstagram').value,
        Email_Contato: document.getElementById('txtEmail').value,
        Texto_Rodape: document.getElementById('txtRodape').value
    };
    await apiPost({ acao: 'atualizar_config', dados });
    alert('✅ Textos salvos!');
}

async function salvarOpcoes() {
    const dados = {
        Mostrar_Carrossel: document.getElementById('optCarrossel').checked ? 'TRUE' : 'FALSE',
        Mostrar_Busca: document.getElementById('optBusca').checked ? 'TRUE' : 'FALSE',
        Mostrar_Estatisticas: document.getElementById('optEstatisticas').checked ? 'TRUE' : 'FALSE'
    };
    await apiPost({ acao: 'atualizar_config', dados });
    alert('✅ Opções salvas!');
}

// ============================================================
// MODAL
// ============================================================
function fecharModal() {
    document.getElementById('modalOverlay').style.display = 'none';
}

document.getElementById('modalOverlay')?.addEventListener('click', e => {
    if (e.target.id === 'modalOverlay') fecharModal();
});
