/* ============================================================
 * SITE PÚBLICO - Marketing IEAD Cuiabá e Região
 * Depende de: config.js
 * ============================================================ */

let estadoSite = {
    config: {},
    arquivos: [],
    carrossel: [],
    menus: [],
    slideAtual: 0,
    carrosselInterval: null
};

// ============================================================
// INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    await carregarDadosSite();
    aplicarConfiguracoes();
    renderizarMenus();
    renderizarCarrossel();
    renderizarArquivos();
    inicializarBusca();
    inicializarCarrossel();
    inicializarPreview();
});

// ============================================================
// CARREGAR DADOS DO BACKEND
// ============================================================
async function carregarDadosSite() {
    const dados = await apiGet('tudo');

    if (dados) {
        estadoSite.config = dados.config || {};
        estadoSite.arquivos = dados.arquivos || [];
        estadoSite.carrossel = dados.carrossel || [];
        estadoSite.menus = dados.menus || [];
    } else {
        estadoSite.config = {
            Titulo_Site: CONFIG.TEXTOS_PADRAO.titulo,
            Subtitulo_Hero: CONFIG.TEXTOS_PADRAO.subtituloHero,
            Descricao_Hero: CONFIG.TEXTOS_PADRAO.descricaoHero,
            Texto_Botao_Hero: CONFIG.TEXTOS_PADRAO.textoBotaoHero,
            Texto_Rodape: CONFIG.TEXTOS_PADRAO.rodape
        };
    }
}

// ============================================================
// APLICAR CONFIGURAÇÕES
// ============================================================
function aplicarConfiguracoes() {
    const c = estadoSite.config;

    aplicarCores(c);

    if (c.Titulo_Site) document.title = c.Titulo_Site;

    if (c.Logo_URL) {
        const logoImg = document.getElementById('siteLogo');
        logoImg.src = c.Logo_URL;
        logoImg.onerror = () => {
            logoImg.src = "https://via.placeholder.com/120x40/0a1c3a/d4af37?text=IEAD";
        };
    }

    if (c.Subtitulo_Hero) {
        document.getElementById('siteSubtitulo').textContent = c.Subtitulo_Hero.split('.')[0] || 'Cuiabá e Região';
    }

    document.getElementById('heroTitulo').textContent = c.Titulo_Site || CONFIG.TEXTOS_PADRAO.titulo;
    document.getElementById('heroDescricao').textContent = c.Descricao_Hero || CONFIG.TEXTOS_PADRAO.descricaoHero;
    document.getElementById('heroBotao').textContent = c.Texto_Botao_Hero || CONFIG.TEXTOS_PADRAO.textoBotaoHero;

    document.getElementById('siteRodape').textContent = c.Texto_Rodape || CONFIG.TEXTOS_PADRAO.rodape;

    const socialDiv = document.getElementById('siteSocial');
    let socialHTML = '';
    if (c.Instagram) {
        const insta = c.Instagram.replace('@', '');
        socialHTML += `<a href="https://instagram.com/${insta}" target="_blank"><i class="fab fa-instagram"></i></a>`;
    }
    if (c.Email_Contato) {
        socialHTML += `<a href="mailto:${c.Email_Contato}"><i class="fas fa-envelope"></i></a>`;
    }
    socialDiv.innerHTML = socialHTML;

    if (c.Mostrar_Carrossel === 'FALSE') {
        document.getElementById('carouselSection').style.display = 'none';
    }

    if (c.Mostrar_Busca === 'FALSE') {
        document.querySelector('.search-wrapper').style.display = 'none';
    }
}

// ============================================================
// MENUS
// ============================================================
function renderizarMenus() {
    const nav = document.getElementById('siteMenus');
    
    if (!estadoSite.menus.length) {
        nav.innerHTML = `
            <a href="#downloads">Downloads</a>
            <a href="#sobre">Sobre</a>
        `;
        return;
    }

    nav.innerHTML = estadoSite.menus.map(m => {
        const target = m.novaAba ? 'target="_blank"' : '';
        return `<a href="${m.link}" ${target}>${escapeHTML(m.nome)}</a>`;
    }).join('');
}

// ============================================================
// CARROSSEL
// ============================================================
function renderizarCarrossel() {
    const track = document.getElementById('carouselTrack');
    const dotsContainer = document.getElementById('dotsContainer');

    const slides = estadoSite.carrossel.length > 0 ? estadoSite.carrossel : [
        { titulo: "Bem-vindo", descricao: "Acesse materiais exclusivos.", badge: "Novo", link: "#downloads", textoBotao: "Explorar" },
        { titulo: "Materiais Oficiais", descricao: "Manuais e apresentações disponíveis.", badge: "Atualizado", link: "#downloads", textoBotao: "Acessar" }
    ];

    track.innerHTML = slides.map((s, i) => `
        <div class="slide ${i === 0 ? 'active' : ''}">
            ${s.badge ? `<span class="badge">${escapeHTML(s.badge)}</span>` : ''}
            <h3>${escapeHTML(s.titulo)}</h3>
            <p>${escapeHTML(s.descricao)}</p>
            ${s.textoBotao ? `<a href="${s.link || '#downloads'}" class="link-arrow">${escapeHTML(s.textoBotao)} <i class="fas fa-chevron-right"></i></a>` : ''}
        </div>
    `).join('');

    dotsContainer.innerHTML = slides.map((_, i) => 
        `<span class="dot ${i === 0 ? 'active' : ''}" onclick="irParaSlide(${i})"></span>`
    ).join('');
}

function inicializarCarrossel() {
    const prev = document.getElementById('prevBtn');
    const next = document.getElementById('nextBtn');

    if (prev) prev.addEventListener('click', () => { irParaSlide(estadoSite.slideAtual - 1); reiniciarAutoPlay(); });
    if (next) next.addEventListener('click', () => { irParaSlide(estadoSite.slideAtual + 1); reiniciarAutoPlay(); });

    iniciarAutoPlay();
}

function irParaSlide(n) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    if (!slides.length) return;

    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));

    estadoSite.slideAtual = (n + slides.length) % slides.length;
    slides[estadoSite.slideAtual].classList.add('active');
    dots[estadoSite.slideAtual].classList.add('active');
}

function iniciarAutoPlay() {
    estadoSite.carrosselInterval = setInterval(() => {
        irParaSlide(estadoSite.slideAtual + 1);
    }, 6000);
}

function reiniciarAutoPlay() {
    clearInterval(estadoSite.carrosselInterval);
    iniciarAutoPlay();
}

// ============================================================
// ARQUIVOS (GRID DE DOWNLOADS COM PREVIEW)
// ============================================================
function renderizarArquivos() {
    const grid = document.getElementById('downloadsGrid');
    const arquivos = estadoSite.arquivos;

    if (!arquivos.length) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-folder-open" style="font-size: 3rem; color: #D4AF37; margin-bottom: 20px;"></i>
                <h3>Nenhum arquivo disponível</h3>
                <p style="color: #86868B;">Os materiais serão adicionados em breve.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = arquivos.map((a, i) => {
        const icone = obterIcone(a.tipo);
        return `
            <div class="card" onclick="abrirPreview(${i})">
                <div class="card-thumb">
                    ${gerarThumb(a)}
                </div>
                <div class="card-body">
                    <i class="fas ${icone} card-icon"></i>
                    <h3>${escapeHTML(a.nome)}</h3>
                    <p>${escapeHTML(a.descricao || 'Clique para acessar')}</p>
                    ${a.tamanho ? `<span class="badge-size">${a.tamanho}</span>` : ''}
                </div>
                <button class="btn-download" onclick="event.stopPropagation(); abrirPreview(${i})">
                    <i class="fas fa-eye"></i> Visualizar
                </button>
            </div>
        `;
    }).join('');
}

/**
 * Gera um thumbnail de preview no card (imagem, PDF, vídeo ou ícone)
 */
function gerarThumb(arquivo) {
    const ext = (arquivo.tipo || '').toUpperCase();
    const isImg = ['PNG','JPG','JPEG','GIF','WEBP','SVG','BMP'].includes(ext);
    const isVid = ['MP4','MOV','AVI','WEBM','MKV'].includes(ext);
    const isPdf = ext === 'PDF';

    // Se for imagem e tiver preview, mostra a miniatura real
    if (isImg && arquivo.preview) {
        return `<img src="${arquivo.preview}" alt="${escapeHTML(arquivo.nome)}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'thumb-fallback\\'><i class=\\'fas fa-image\\'></i></div>'">`;
    }
    
    // Se for vídeo, tenta usar thumbnail
    if (isVid && arquivo.preview) {
        return `
            <div class="thumb-video">
                <img src="${arquivo.preview}" onerror="this.style.display='none'">
                <div class="play-overlay"><i class="fas fa-play"></i></div>
            </div>
        `;
    }

    // PDF - mostra ícone grande
    if (isPdf) {
        return `<div class="thumb-fallback pdf"><i class="fas fa-file-pdf"></i><span>PDF</span></div>`;
    }

    // Fallback genérico
    return `<div class="thumb-fallback"><i class="fas fa-file"></i></div>`;
}

function obterIcone(tipo) {
    const t = (tipo || '').toLowerCase();
    if (t.includes('pdf')) return 'fa-file-pdf';
    if (t.includes('png') || t.includes('jpg') || t.includes('jpeg') || t.includes('gif') || t.includes('webp')) return 'fa-file-image';
    if (t.includes('ppt')) return 'fa-file-powerpoint';
    if (t.includes('doc')) return 'fa-file-word';
    if (t.includes('xls') || t.includes('csv')) return 'fa-file-excel';
    if (t.includes('psd') || t.includes('ai')) return 'fa-file-alt';
    if (t.includes('zip') || t.includes('rar')) return 'fa-file-archive';
    if (t.includes('mp4') || t.includes('mov')) return 'fa-file-video';
    if (t.includes('mp3') || t.includes('wav')) return 'fa-file-audio';
    return 'fa-file';
}

// ============================================================
// BUSCA
// ============================================================
function inicializarBusca() {
    const input = document.getElementById('searchInput');
    if (!input) return;

    input.addEventListener('input', function() {
        const termo = this.value.toLowerCase().trim();
        document.querySelectorAll('.card').forEach(card => {
            const texto = card.textContent.toLowerCase();
            card.style.display = texto.includes(termo) ? 'flex' : 'none';
        });
    });
}

// ============================================================
// ⭐ MODAL DE PREVIEW (Visualização antes do download)
// ============================================================
function inicializarPreview() {
    // Cria o modal se não existir
    if (!document.getElementById('previewModal')) {
        const modal = document.createElement('div');
        modal.id = 'previewModal';
        modal.className = 'preview-modal';
        modal.innerHTML = `
            <div class="preview-modal-overlay" onclick="fecharPreview()"></div>
            <div class="preview-modal-content">
                <button class="preview-close" onclick="fecharPreview()" title="Fechar (ESC)">
                    <i class="fas fa-times"></i>
                </button>
                <div class="preview-modal-header">
                    <div class="preview-title-area">
                        <i class="fas fa-file preview-title-icon" id="previewTitleIcon"></i>
                        <div>
                            <h3 id="previewTitulo">Nome do arquivo</h3>
                            <p id="previewMeta">Tipo • Tamanho</p>
                        </div>
                    </div>
                </div>
                <div class="preview-modal-body" id="previewBody">
                    <!-- Conteúdo dinâmico -->
                </div>
                <div class="preview-modal-footer">
                    <button onclick="fecharPreview()" class="btn-secondary-preview">
                        <i class="fas fa-arrow-left"></i> Voltar
                    </button>
                    <a id="previewDownloadBtn" href="#" download target="_blank" rel="noopener noreferrer" class="btn-download-preview">
                        <i class="fas fa-download"></i> Baixar Arquivo
                    </a>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Fecha com ESC
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') fecharPreview();
    });
}

function abrirPreview(index) {
    const arquivo = estadoSite.arquivos[index];
    if (!arquivo) return;

    const modal = document.getElementById('previewModal');
    const body = document.getElementById('previewBody');
    const titulo = document.getElementById('previewTitulo');
    const meta = document.getElementById('previewMeta');
    const iconTitle = document.getElementById('previewTitleIcon');
    const downloadBtn = document.getElementById('previewDownloadBtn');

    // Configura cabeçalho
    titulo.textContent = arquivo.nome;
    meta.textContent = `${arquivo.tipo} ${arquivo.tamanho ? '• ' + arquivo.tamanho : ''} ${arquivo.categoria ? '• ' + arquivo.categoria : ''}`;
    iconTitle.className = `fas ${obterIcone(arquivo.tipo)} preview-title-icon`;
    downloadBtn.href = arquivo.link;

    // Gera o preview baseado no tipo
    const ext = (arquivo.tipo || '').toUpperCase();
    const isImg = ['PNG','JPG','JPEG','GIF','WEBP','SVG','BMP'].includes(ext);
    const isVid = ['MP4','MOV','AVI','WEBM','MKV'].includes(ext);
    const isPdf = ext === 'PDF';
    const fileId = extrairFileId(arquivo.link);

    if (isImg) {
        // Preview de imagem em alta resolução
        const urlHD = fileId 
            ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`
            : arquivo.link;
        
        body.innerHTML = `
            <div class="preview-image-wrapper">
                <img src="${urlHD}" alt="${escapeHTML(arquivo.nome)}" onerror="this.parentElement.innerHTML='<div class=\\'preview-error\\'><i class=\\'fas fa-exclamation-triangle\\'></i><p>Não foi possível carregar a imagem.</p></div>'">
            </div>
        `;
    } else if (isVid) {
        // Preview de vídeo
        const videoUrl = fileId 
            ? `https://drive.google.com/file/d/${fileId}/preview`
            : arquivo.link;
        
        body.innerHTML = `
            <div class="preview-video-wrapper">
                <iframe src="${videoUrl}" allow="autoplay" allowfullscreen frameborder="0"></iframe>
            </div>
        `;
    } else if (isPdf) {
        // Preview de PDF via Google Drive Viewer
        const pdfUrl = fileId 
            ? `https://drive.google.com/file/d/${fileId}/preview`
            : arquivo.link;
        
        body.innerHTML = `
            <div class="preview-pdf-wrapper">
                <iframe src="${pdfUrl}" allowfullscreen frameborder="0"></iframe>
            </div>
        `;
    } else {
        // Outros tipos - mostra ícone grande + botão
        body.innerHTML = `
            <div class="preview-generic">
                <div class="preview-generic-icon">
                    <i class="fas ${obterIcone(arquivo.tipo)}"></i>
                </div>
                <h4>${escapeHTML(arquivo.nome)}</h4>
                <p>${escapeHTML(arquivo.descricao || 'Este tipo de arquivo não possui pré-visualização.')}</p>
                <p class="preview-hint">Clique em <strong>Baixar Arquivo</strong> para fazer o download.</p>
            </div>
        `;
    }

    // Abre o modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function fecharPreview() {
    const modal = document.getElementById('previewModal');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Limpa o iframe/vídeo após fechar
    setTimeout(() => {
        const body = document.getElementById('previewBody');
        if (body) body.innerHTML = '';
    }, 300);
}

/**
 * Extrai o File ID do Google Drive a partir de uma URL
 */
function extrairFileId(url) {
    if (!url) return null;
    
    // Formatos suportados:
    // https://drive.google.com/file/d/FILE_ID/view
    // https://drive.google.com/uc?id=FILE_ID
    // https://drive.google.com/open?id=FILE_ID
    // https://drive.google.com/uc?export=download&id=FILE_ID
    
    const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match1) return match1[1];
    
    const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match2) return match2[1];
    
    return null;
}
