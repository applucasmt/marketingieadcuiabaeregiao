/* ============================================================
 * PAINEL ADMINISTRATIVO - Marketing IEAD
 * Versão 3.0 - Isolado com prefixo cms
 * ============================================================ */

let cmsEstado = {
    config: {},
    arquivos: [],
    categorias: [],
    carrossel: [],
    menus: [],
    arquivoAtual: null
};

// ============================================================
// LOGIN
// ============================================================
function cmsFazerLogin() {
    const senha = document.getElementById('cmsPassword').value;
    if (senha === CONFIG.SENHA_ADMIN) {
        sessionStorage.setItem('adminLogged', 'true');
        cmsMostrarPainel();
    } else {
        document.getElementById('cmsLoginError').textContent = 'Senha incorreta. Tente novamente.';
        const box = document.querySelector('.cms-login-box');
        box.style.animation = 'none';
        setTimeout(() => box.style.animation = 'cmsFadeIn 0.4s ease', 10);
    }
}

function cmsFazerLogout() {
    sessionStorage.removeItem('adminLogged');
    location.reload();
}

function cmsMostrarPainel() {
    document.getElementById('cmsLoginScreen').style.display = 'none';
    document.getElementById('cmsWrapper').style.display = 'grid';
    cmsCarregarTudo();
}

// Auto-login
if (sessionStorage.getItem('adminLogged') === 'true') {
    cmsMostrarPainel();
}

// Enter no input de senha
document.getElementById('cmsPassword')?.addEventListener('keypress', e => {
    if (e.key === 'Enter') cmsFazerLogin();
});

// ============================================================
// NAVEGAÇÃO
// ============================================================
document.querySelectorAll('.cms-nav a').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const tab = link.dataset.tab;
        if (!tab) return;

        document.querySelectorAll('.cms-nav a').forEach(a => a.classList.remove('active'));
        document.querySelectorAll('.cms-section').forEach(s => s.classList.remove('active'));
        link.classList.add('active');
        document.getElementById('cmsTab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
        document.getElementById('cmsPageTitle').textContent = link.textContent.trim();
    });
});

// ============================================================
// CARREGAR TUDO
// ============================================================
async function cmsCarregarTudo() {
    try {
        const dados = await apiGet('tudo');
        if (!dados) {
            document.getElementById('cmsStatusText').textContent = '⚠️ Erro de conexão';
            return;
        }
        cmsEstado.config = dados.config || {};
        cmsEstado.arquivos = dados.arquivos || [];
        cmsEstado.categorias = dados.categorias || [];
        cmsEstado.carrossel = dados.carrossel || [];
        cmsEstado.menus = dados.menus || [];

        cmsRenderizarDashboard();
        cmsRenderizarArquivos();
        cmsRenderizarCategorias();
        cmsRenderizarCarrossel();
        cmsRenderizarMenus();
        cmsPreencherFormularios();
    } catch (err) {
        console.error('Erro:', err);
        document.getElementById('cmsStatusText').textContent = '⚠️ Erro';
    }
}

// ============================================================
// DASHBOARD
// ============================================================
function cmsRenderizarDashboard() {
    const totalMB = cmsEstado.arquivos.reduce((s, a) => s + (parseFloat(a.tamanho) || 0), 0).toFixed(1);
    document.getElementById('cmsStats').innerHTML = `
        <div class="cms-stat-card">
            <i class="fas fa-file"></i>
            <h2>${cmsEstado.arquivos.length}</h2>
            <p>Arquivos</p>
        </div>
        <div class="cms-stat-card">
            <i class="fas fa-database"></i>
            <h2>${totalMB} MB</h2>
            <p>Tamanho Total</p>
        </div>
        <div class="cms-stat-card">
            <i class="fas fa-folder"></i>
            <h2>${cmsEstado.categorias.length}</h2>
            <p>Categorias</p>
        </div>
    `;
    if (cmsEstado.config.Pasta_Drive_URL) {
        document.getElementById('cmsLinkPastaDrive').href = cmsEstado.config.Pasta_Drive_URL;
    }
}

// ============================================================
// ARQUIVOS
// ============================================================
function cmsRenderizarArquivos() {
    const container = document.getElementById('cmsArquivosList');
    if (!container) return;

    if (!cmsEstado.arquivos.length) {
        container.innerHTML = '<p class="cms-empty">Nenhum arquivo ainda.</p>';
        return;
    }

    container.innerHTML = cmsEstado.arquivos.map(a => {
        const ext = (a.tipo || '').toUpperCase();
        const isImg = ['PNG','JPG','JPEG','GIF','WEBP','SVG','BMP'].includes(ext);
        const isVid = ['MP4','MOV','AVI','WEBM','MKV'].includes(ext);
        const isPdf = ext === 'PDF';

        let preview = '';
        if (isImg && a.preview) {
            preview = `<img src="${a.preview}" class="cms-preview-thumb" alt="">`;
        } else if (isVid) {
            preview = `<i class="fas fa-play-circle cms-preview-icon cms-video"></i>`;
        } else if (isPdf) {
            preview = `<i class="fas fa-file-pdf cms-preview-icon cms-pdf"></i>`;
        } else {
            preview = `<i class="fas fa-file cms-preview-icon"></i>`;
        }

        return `
            <div class="cms-arquivo-item">
                <div class="cms-arquivo-preview">${preview}</div>
                <div class="cms-arquivo-info">
                    <h4>${escapeHTML(a.nome)}</h4>
                    <p>${escapeHTML(a.descricao || '')}</p>
                    <div class="cms-arquivo-meta">
                        <span class="cms-tag">${escapeHTML(a.tipo || '')}</span>
                        <span class="cms-tag">${escapeHTML(a.categoria || '')}</span>
                        ${a.tamanho ? `<span class="cms-tag">${escapeHTML(a.tamanho)}</span>` : ''}
                    </div>
                </div>
                <div class="cms-arquivo-actions">
                    <a href="${a.link}" target="_blank" rel="noopener" class="cms-btn-icon" title="Abrir">
                        <i class="fas fa-external-link-alt"></i>
                    </a>
                    <button onclick="cmsRemoverArquivo(${a.id})" class="cms-btn-icon cms-danger" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function cmsRemoverArquivo(id) {
    if (!confirm('Remover este arquivo? Ele será movido para a lixeira do Drive.')) return;
    const r = await apiPost({ acao: 'remover', id });
    if (r && r.status === 'ok') cmsCarregarTudo();
}

document.getElementById('cmsFiltroArquivos')?.addEventListener('input', function () {
    const t = this.value.toLowerCase();
    document.querySelectorAll('.cms-arquivo-item').forEach(item => {
        item.style.display = item.textContent.toLowerCase().includes(t) ? 'flex' : 'none';
    });
});

// ============================================================
// CATEGORIAS (select)
// ============================================================
function cmsRenderizarCategorias() {
    const sel = document.getElementById('cmsCategoriaUpload');
    if (!sel) return;
    sel.innerHTML = cmsEstado.categorias.map(c =>
        `<option value="${c.nome}">${c.nome}</option>`
    ).join('');
}

// ============================================================
// UPLOAD
// ============================================================
const cmsUploadArea = document.getElementById('cmsUploadArea');
const cmsFileInput = document.getElementById('cmsFileInput');

cmsUploadArea?.addEventListener('click', () => cmsFileInput.click());
cmsUploadArea?.addEventListener('dragover', e => { e.preventDefault(); cmsUploadArea.classList.add('cms-dragover'); });
cmsUploadArea?.addEventListener('dragleave', () => cmsUploadArea.classList.remove('cms-dragover'));
cmsUploadArea?.addEventListener('drop', e => {
    e.preventDefault();
    cmsUploadArea.classList.remove('cms-dragover');
    if (e.dataTransfer.files.length) {
        cmsFileInput.files = e.dataTransfer.files;
        cmsSelecionarArquivo(e.dataTransfer.files[0]);
    }
});
cmsFileInput?.addEventListener('change', () => {
    if (cmsFileInput.files.length) cmsSelecionarArquivo(cmsFileInput.files[0]);
});

function cmsSelecionarArquivo(file) {
    cmsEstado.arquivoAtual = file;
    document.getElementById('cmsUploadPreview').style.display = 'block';
    const previewContent = document.getElementById('cmsPreviewContent');
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);

    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = e => {
            previewContent.innerHTML = `
                <img src="${e.target.result}" class="cms-upload-thumb" alt="">
                <p style="color:#0A1C3A;font-weight:600;">${file.name}</p>
                <p style="color:#86868B;font-size:0.85rem;">${sizeMB} MB</p>
            `;
        };
        reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
        previewContent.innerHTML = `
            <i class="fas fa-play-circle cms-preview-icon cms-video cms-big"></i>
            <p style="color:#0A1C3A;font-weight:600;">${file.name}</p>
            <p style="color:#86868B;font-size:0.85rem;">${sizeMB} MB • Vídeo</p>
        `;
    } else if (file.type === 'application/pdf') {
        previewContent.innerHTML = `
            <i class="fas fa-file-pdf cms-preview-icon cms-pdf cms-big"></i>
            <p style="color:#0A1C3A;font-weight:600;">${file.name}</p>
            <p style="color:#86868B;font-size:0.85rem;">${sizeMB} MB</p>
        `;
    } else {
        previewContent.innerHTML = `
            <i class="fas fa-file cms-preview-icon cms-big"></i>
            <p style="color:#0A1C3A;font-weight:600;">${file.name}</p>
            <p style="color:#86868B;font-size:0.85rem;">${sizeMB} MB</p>
        `;
    }

    document.getElementById('cmsNomeAmigavel').value = file.name.replace(/\.[^/.]+$/, '');
}

document.getElementById('cmsUploadBtn')?.addEventListener('click', async () => {
    if (!cmsEstado.arquivoAtual) {
        alert('Selecione um arquivo primeiro!');
        return;
    }

    const status = document.getElementById('cmsUploadStatus');
    const btn = document.getElementById('cmsUploadBtn');
    const limiteMB = CONFIG.LIMITE_UPLOAD_MB || 25;

    if (cmsEstado.arquivoAtual.size > limiteMB * 1024 * 1024) {
        status.innerHTML = `<div class="cms-status-msg cms-error">❌ Arquivo muito grande (máx: ${limiteMB} MB)</div>`;
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Enviando...</span>';
    status.innerHTML = '<div class="cms-status-msg">⏳ Lendo arquivo...</div>';

    try {
        const base64 = await fileToBase64(cmsEstado.arquivoAtual);
        status.innerHTML = '<div class="cms-status-msg">⏳ Enviando para o Google Drive...</div>';

        const result = await apiPost({
            acao: 'upload',
            nomeArquivo: cmsEstado.arquivoAtual.name,
            tipoMime: cmsEstado.arquivoAtual.type || 'application/octet-stream',
            dadosBase64: base64.split(',')[1],
            descricao: document.getElementById('cmsDescricaoUpload').value,
            categoria: document.getElementById('cmsCategoriaUpload').value,
            nomeAmigavel: document.getElementById('cmsNomeAmigavel').value
        });

        if (result && result.status === 'ok') {
            status.innerHTML = `<div class="cms-status-msg cms-success">✅ Upload concluído com sucesso!</div>`;
            cmsEstado.arquivoAtual = null;
            cmsFileInput.value = '';
            document.getElementById('cmsUploadPreview').style.display = 'none';
            document.getElementById('cmsNomeAmigavel').value = '';
            document.getElementById('cmsDescricaoUpload').value = '';
            cmsCarregarTudo();
        } else {
            status.innerHTML = `<div class="cms-status-msg cms-error">❌ ${result?.mensagem || 'Erro desconhecido'}</div>`;
        }
    } catch (err) {
        status.innerHTML = `<div class="cms-status-msg cms-error">❌ ${err.message}</div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-upload"></i><span>Enviar para o Google Drive</span>';
    }
});

// ============================================================
// CARROSSEL
// ============================================================
function cmsRenderizarCarrossel() {
    const c = document.getElementById('cmsCarrosselList');
    if (!c) return;

    if (!cmsEstado.carrossel.length) {
        c.innerHTML = '<p class="cms-empty">Nenhum slide ainda. Clique em "Novo Slide" para começar.</p>';
        return;
    }

    c.innerHTML = cmsEstado.carrossel.map(s => `
        <div class="cms-item">
            <div class="cms-item-info">
                ${s.badge ? `<span class="cms-badge">${escapeHTML(s.badge)}</span>` : ''}
                <h4>${escapeHTML(s.titulo)}</h4>
                <p>${escapeHTML(s.descricao || '')}</p>
            </div>
            <div class="cms-item-actions">
                <button onclick='cmsEditarSlide(${JSON.stringify(s).replace(/'/g, "&#39;")})' class="cms-btn-icon" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="cmsRemoverSlide(${s.id})" class="cms-btn-icon cms-danger" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function cmsAbrirModalSlide(slide = null) {
    const modal = document.getElementById('cmsModal');
    const box = document.getElementById('cmsModalBox');
    box.innerHTML = `
        <h2>${slide ? 'Editar' : 'Novo'} Slide</h2>
        <div class="cms-form-grid">
            <div class="cms-form-group cms-full">
                <label>Título</label>
                <input id="cmsSlTitulo" value="${slide?.titulo || ''}" placeholder="Título do slide">
            </div>
            <div class="cms-form-group cms-full">
                <label>Descrição</label>
                <textarea id="cmsSlDescricao" placeholder="Descrição breve">${slide?.descricao || ''}</textarea>
            </div>
            <div class="cms-form-group">
                <label>Badge</label>
                <input id="cmsSlBadge" value="${slide?.badge || ''}" placeholder="Ex: Novo">
            </div>
            <div class="cms-form-group">
                <label>Texto do Botão</label>
                <input id="cmsSlBotao" value="${slide?.textoBotao || ''}" placeholder="Ver mais">
            </div>
            <div class="cms-form-group cms-full">
                <label>Link do Botão</label>
                <input id="cmsSlLink" value="${slide?.link || '#downloads'}" placeholder="#downloads">
            </div>
            <div class="cms-form-group">
                <label>Ordem</label>
                <input type="number" id="cmsSlOrdem" value="${slide?.ordem || 1}">
            </div>
        </div>
        <div class="cms-modal-actions">
            <button onclick="cmsFecharModal()" class="cms-btn-secondary">Cancelar</button>
            <button onclick="cmsSalvarSlide(${slide?.id || 'null'})" class="cms-btn-primary">
                <i class="fas fa-save"></i><span>Salvar</span>
            </button>
        </div>
    `;
    modal.classList.add('cms-active');
}

async function cmsSalvarSlide(id) {
    const dados = {
        titulo: document.getElementById('cmsSlTitulo').value,
        descricao: document.getElementById('cmsSlDescricao').value,
        badge: document.getElementById('cmsSlBadge').value,
        textoBotao: document.getElementById('cmsSlBotao').value,
        link: document.getElementById('cmsSlLink').value,
        ordem: parseInt(document.getElementById('cmsSlOrdem').value) || 1
    };
    await apiPost({ acao: 'carrossel_salvar', dados, id });
    cmsFecharModal();
    cmsCarregarTudo();
}

async function cmsRemoverSlide(id) {
    if (!confirm('Remover este slide?')) return;
    await apiPost({ acao: 'carrossel_remover', id });
    cmsCarregarTudo();
}

function cmsEditarSlide(s) { cmsAbrirModalSlide(s); }

// ============================================================
// MENUS
// ============================================================
function cmsRenderizarMenus() {
    const c = document.getElementById('cmsMenusList');
    if (!c) return;

    if (!cmsEstado.menus.length) {
        c.innerHTML = '<p class="cms-empty">Nenhum menu ainda. Clique em "Nova Aba" para começar.</p>';
        return;
    }

    c.innerHTML = cmsEstado.menus.map(m => `
        <div class="cms-item">
            <div class="cms-item-info">
                <h4>${escapeHTML(m.nome)}</h4>
                <p>${escapeHTML(m.link)} ${m.novaAba ? '• nova aba' : ''}</p>
            </div>
            <div class="cms-item-actions">
                <button onclick='cmsEditarMenu(${JSON.stringify(m).replace(/'/g, "&#39;")})' class="cms-btn-icon" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="cmsRemoverMenu(${m.id})" class="cms-btn-icon cms-danger" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function cmsAbrirModalMenu(menu = null) {
    const modal = document.getElementById('cmsModal');
    const box = document.getElementById('cmsModalBox');
    box.innerHTML = `
        <h2>${menu ? 'Editar' : 'Nova'} Aba / Menu</h2>
        <div class="cms-form-grid">
            <div class="cms-form-group cms-full">
                <label>Nome do Menu</label>
                <input id="cmsMnNome" value="${menu?.nome || ''}" placeholder="Ex: Downloads">
            </div>
            <div class="cms-form-group cms-full">
                <label>Link</label>
                <input id="cmsMnLink" value="${menu?.link || ''}" placeholder="#downloads ou https://...">
            </div>
            <div class="cms-form-group">
                <label>Ordem</label>
                <input type="number" id="cmsMnOrdem" value="${menu?.ordem || 1}">
            </div>
            <div class="cms-form-group">
                <label>Abrir em nova aba?</label>
                <label class="cms-toggle">
                    <input type="checkbox" id="cmsMnNovaAba" ${menu?.novaAba ? 'checked' : ''}>
                    <span>Sim, nova aba</span>
                </label>
            </div>
        </div>
        <div class="cms-modal-actions">
            <button onclick="cmsFecharModal()" class="cms-btn-secondary">Cancelar</button>
            <button onclick="cmsSalvarMenu(${menu?.id || 'null'})" class="cms-btn-primary">
                <i class="fas fa-save"></i><span>Salvar</span>
            </button>
        </div>
    `;
    modal.classList.add('cms-active');
}

async function cmsSalvarMenu(id) {
    const dados = {
        nome: document.getElementById('cmsMnNome').value,
        link: document.getElementById('cmsMnLink').value,
        ordem: parseInt(document.getElementById('cmsMnOrdem').value) || 1,
        novaAba: document.getElementById('cmsMnNovaAba').checked
    };
    await apiPost({ acao: 'menu_salvar', dados, id });
    cmsFecharModal();
    cmsCarregarTudo();
}

async function cmsRemoverMenu(id) {
    if (!confirm('Remover este menu?')) return;
    await apiPost({ acao: 'menu_remover', id });
    cmsCarregarTudo();
}

function cmsEditarMenu(m) { cmsAbrirModalMenu(m); }

// ============================================================
// APARÊNCIA
// ============================================================
document.getElementById('cmsLogoInput')?.addEventListener('change', async function () {
    if (!this.files.length) return;
    const file = this.files[0];
    const base64 = await fileToBase64(file);

    const result = await apiPost({
        acao: 'upload_logo',
        nomeArquivo: file.name,
        tipoMime: file.type,
        dadosBase64: base64.split(',')[1]
    });

    if (result && result.status === 'ok') {
        document.getElementById('cmsLogoPreview').innerHTML = `<img src="${result.url}" alt="Logo">`;
        alert('✅ Logo atualizada com sucesso!');
        cmsCarregarTudo();
    } else {
        alert('❌ Erro ao atualizar logo');
    }
});

async function cmsSalvarCores() {
    const dados = {
        Cor_Primaria: document.getElementById('cmsCorPrimaria').value,
        Cor_Secundaria: document.getElementById('cmsCorSecundaria').value,
        Cor_Destaque: document.getElementById('cmsCorDestaque').value
    };
    const r = await apiPost({ acao: 'atualizar_config', dados });
    if (r && r.status === 'ok') {
        alert('✅ Cores salvas!');
        cmsCarregarTudo();
    }
}

// ============================================================
// TEXTOS
// ============================================================
function cmsPreencherFormularios() {
    const c = cmsEstado.config;

    document.getElementById('cmsTxtTitulo').value = c.Titulo_Site || '';
    document.getElementById('cmsTxtSubtituloHero').value = c.Subtitulo_Hero || '';
    document.getElementById('cmsTxtDescricaoHero').value = c.Descricao_Hero || '';
    document.getElementById('cmsTxtBotaoHero').value = c.Texto_Botao_Hero || '';
    document.getElementById('cmsTxtInstagram').value = c.Instagram || '';
    document.getElementById('cmsTxtEmail').value = c.Email_Contato || '';
    document.getElementById('cmsTxtRodape').value = c.Texto_Rodape || '';

    document.getElementById('cmsCorPrimaria').value = c.Cor_Primaria || '#0A1C3A';
    document.getElementById('cmsCorSecundaria').value = c.Cor_Secundaria || '#1A3A6B';
    document.getElementById('cmsCorDestaque').value = c.Cor_Destaque || '#D4AF37';

    document.getElementById('cmsOptCarrossel').checked = c.Mostrar_Carrossel !== 'FALSE';
    document.getElementById('cmsOptBusca').checked = c.Mostrar_Busca !== 'FALSE';

    if (c.Logo_URL) {
        document.getElementById('cmsLogoPreview').innerHTML = `<img src="${c.Logo_URL}" alt="Logo">`;
    }
}

async function cmsSalvarTextos() {
    const dados = {
        Titulo_Site: document.getElementById('cmsTxtTitulo').value,
        Subtitulo_Hero: document.getElementById('cmsTxtSubtituloHero').value,
        Descricao_Hero: document.getElementById('cmsTxtDescricaoHero').value,
        Texto_Botao_Hero: document.getElementById('cmsTxtBotaoHero').value,
        Instagram: document.getElementById('cmsTxtInstagram').value,
        Email_Contato: document.getElementById('cmsTxtEmail').value,
        Texto_Rodape: document.getElementById('cmsTxtRodape').value
    };
    const r = await apiPost({ acao: 'atualizar_config', dados });
    if (r && r.status === 'ok') {
        alert('✅ Textos salvos!');
        cmsCarregarTudo();
    }
}

async function cmsSalvarOpcoes() {
    const dados = {
        Mostrar_Carrossel: document.getElementById('cmsOptCarrossel').checked ? 'TRUE' : 'FALSE',
        Mostrar_Busca: document.getElementById('cmsOptBusca').checked ? 'TRUE' : 'FALSE'
    };
    const r = await apiPost({ acao: 'atualizar_config', dados });
    if (r && r.status === 'ok') {
        alert('✅ Opções salvas!');
    }
}

// ============================================================
// MODAL
// ============================================================
function cmsFecharModal() {
    document.getElementById('cmsModal').classList.remove('cms-active');
}

document.getElementById('cmsModal')?.addEventListener('click', e => {
    if (e.target.id === 'cmsModal') cmsFecharModal();
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') cmsFecharModal();
});
