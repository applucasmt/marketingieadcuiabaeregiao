/* ============================================================
 * SITE PÚBLICO - Marketing IEAD Cuiabá e Região
 * ============================================================ */

let estadoSite = {
    config: {},
    arquivos: [],
    carrossel: [],
    menus: [],
    slideAtual: 0,
    carrosselInterval: null,
    rotaAtual: 'home'
};

// ============================================================
// SPLASH SCREEN CIRCULAR
// ============================================================
function atualizarProgresso(percent) {
    const circle = document.getElementById('splashCircle');
    const txt = document.getElementById('splashPercent');
    if (txt) txt.textContent = Math.round(percent) + '%';
    
    if (circle) {
        // Círculo com raio 90 → perímetro = 2 * π * 90 ≈ 565.48
        const perimetro = 565.48;
        const offset = perimetro - (perimetro * percent / 100);
        circle.style.strokeDashoffset = offset;
    }
}

function esconderSplash() {
    const splash = document.getElementById('splashScreen');
    const wrapper = document.getElementById('siteWrapper');
    if (splash) {
        splash.classList.add('fade-out');
        setTimeout(() => {
            splash.style.display = 'none';
            wrapper.classList.add('visible');
        }, 900);
    }
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    atualizarProgresso(5);
    await new Promise(r => setTimeout(r, 150));
    atualizarProgresso(20);

    await carregarDadosSite();
    atualizarProgresso(55);

    aplicarConfiguracoes();
    renderizarMenus();
    atualizarProgresso(70);

    renderizarCarrossel();
    renderizarArquivos();
    renderizarContato();
    atualizarProgresso(90);

    inicializarBusca();
    inicializarCarrossel();
    inicializarPreview();
    inicializarRotas();
    atualizarProgresso(100);

    await new Promise(r => setTimeout(r, 500));
    esconderSplash();
});

// ============================================================
// ROTAS
// ============================================================
function inicializarRotas() {
    window.addEventListener('hashchange', aplicarRota);
    aplicarRota();

    document.querySelectorAll('[data-route]').forEach(el => {
        el.addEventListener('click', e => {
            e.preventDefault();
            window.location.hash = el.getAttribute('data-route');
        });
    });
}

function aplicarRota() {
    const hash = window.location.hash.replace('#', '') || 'home';
    const rotasValidas = ['home', 'downloads', 'sobre', 'contato'];
    const rota = rotasValidas.includes(hash) ? hash : 'home';
    estadoSite.rotaAtual = rota;

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById('page-' + rota);
    if (page) page.classList.add('active');

    document.querySelectorAll('.header-nav a').forEach(a => {
        const href = a.getAttribute('href')?.replace('#', '');
        a.classList.toggle('active', href === rota);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// CARREGAR DADOS
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
            logoImg.src = "https://i.ibb.co/3Y5PMRwz/2600211b-5791-45a6-8ce0-1c8eb30344f6.jpg";
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
}

// ============================================================
// MENUS
// ============================================================
function renderizarMenus() {
    const nav = document.getElementById('siteMenus');
    if (estadoSite.menus.length > 0) {
        nav.innerHTML = estadoSite.menus.map(m => {
            const isRota = m.link.startsWith('#');
            const target = m.novaAba ? 'target="_blank"' : '';
            return `<a href="${m.link}" ${target}>${escapeHTML(m.nome)}</a>`;
        }).join('');
    } else {
        nav.innerHTML = `
            <a href="#home">Início</a>
            <a href="#downloads">Downloads</a>
            <a href="#sobre">Sobre</a>
            <a href="#contato">Contato</a>
        `;
    }

    nav.querySelectorAll('a[href^="#"]').forEach(el => {
        el.addEventListener('click', e => {
            const href = el.getAttribute('href');
            if (['#home','#downloads','#sobre','#contato'].includes(href)) {
                e.preventDefault();
                window.location.hash = href.replace('#', '');
            }
        });
    });
}

// ============================================================
// ⭐ CARROSSEL INTELIGENTE (Avisos + Arquivos Novos)
// ============================================================
function renderizarCarrossel() {
    const track = document.getElementById('carouselTrack');
    const dotsContainer = document.getElementById('dotsContainer');
    if (!track) return;

    // Monta slides: primeiro os avisos manuais, depois os arquivos novos
    const slides = [];

    // 1. Slides manuais (vindos da planilha Carrossel)
    estadoSite.carrossel.forEach(s => {
        slides.push({
            tipo: 'aviso',
            titulo: s.titulo,
            descricao: s.descricao,
            badge: s.badge || 'Aviso',
            link: s.link,
            textoBotao: s.textoBotao || 'Saber mais',
            arquivoIndex: null
        });
    });

    // 2. Arquivos novos (com tag "NOVO")
    estadoSite.arquivos.slice(0, 5).forEach((arq, index) => {
        slides.push({
            tipo: 'arquivo',
            titulo: arq.nome,
            descricao: arq.descricao || `Novo material disponível: ${arq.tipo}`,
            badge: 'Novo',
            arquivoIndex: index,
            arquivo: arq
        });
    });

    // Se não houver nada, usa fallback
    if (slides.length === 0) {
        slides.push({
            tipo: 'aviso',
            titulo: 'Bem-vindo ao Portal',
            descricao: 'Acesse materiais exclusivos, manuais e apresentações.',
            badge: 'Novo',
            link: '#downloads',
            textoBotao: 'Explorar'
        });
    }

    track.innerHTML = slides.map((s, i) => `
        <div class="carousel-slide ${i === 0 ? 'active' : ''}">
            <div class="slide-content">
                <span class="slide-badge ${s.tipo === 'arquivo' ? 'badge-novo' : ''}">
                    ${s.tipo === 'arquivo' ? '<i class="fas fa-star"></i>' : '<i class="fas fa-bullhorn"></i>'}
                    ${escapeHTML(s.badge)}
                </span>
                <h3>${escapeHTML(s.titulo)}</h3>
                <p>${escapeHTML(s.descricao)}</p>
                <div class="slide-actions">
                    ${s.tipo === 'arquivo' 
                        ? `<button class="btn-slide btn-slide-primary" onclick="abrirPreview(${s.arquivoIndex})">
                               <i class="fas fa-eye"></i> Ver Arquivo
                           </button>`
                        : `<a href="${s.link || '#downloads'}" class="btn-slide btn-slide-primary">
                               <i class="fas fa-arrow-right"></i> ${escapeHTML(s.textoBotao)}
                           </a>`
                    }
                    <a href="#downloads" class="btn-slide btn-slide-ghost">
                        <i class="fas fa-download"></i> Downloads
                    </a>
                </div>
            </div>
            ${s.tipo === 'arquivo' && s.arquivo.preview && isImagem(s.arquivo.tipo) ? `
                <div class="slide-thumb">
                    <img src="${s.arquivo.preview}" alt="${escapeHTML(s.arquivo.nome)}">
                </div>
            ` : `
                <div class="slide-thumb slide-thumb-icon">
                    <i class="fas ${obterIcone(s.arquivo?.tipo || 'file')}"></i>
                </div>
            `}
        </div>
    `).join('');

    dotsContainer.innerHTML = slides.map((_, i) => 
        `<span class="dot ${i === 0 ? 'active' : ''}" onclick="irParaSlide(${i})"></span>`
    ).join('');

    estadoSite.totalSlides = slides.length;
}

function isImagem(tipo) {
    return ['PNG','JPG','JPEG','GIF','WEBP','SVG','BMP'].includes((tipo || '').toUpperCase());
}

function inicializarCarrossel() {
    const prev = document.getElementById('prevBtn');
    const next = document.getElementById('nextBtn');
    if (prev) prev.addEventListener('click', () => { irParaSlide(estadoSite.slideAtual - 1); reiniciarAutoPlay(); });
    if (next) next.addEventListener('click', () => { irParaSlide(estadoSite.slideAtual + 1); reiniciarAutoPlay(); });
    iniciarAutoPlay();
}

function irParaSlide(n) {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.dot');
    if (!slides.length) return;
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    estadoSite.slideAtual = (n + slides.length) % slides.length;
    slides[estadoSite.slideAtual].classList.add('active');
    dots[estadoSite.slideAtual].classList.add('active');
}

function iniciarAutoPlay() {
    clearInterval(estadoSite.carrosselInterval);
    estadoSite.carrosselInterval = setInterval(() => irParaSlide(estadoSite.slideAtual + 1), 7000);
}
function reiniciarAutoPlay() { clearInterval(estadoSite.carrosselInterval); iniciarAutoPlay(); }

// ============================================================
// ARQUIVOS
// ============================================================
function renderizarArquivos() {
    const grid = document.getElementById('downloadsGrid');
    if (!grid) return;
    const arquivos = estadoSite.arquivos;

    if (!arquivos.length) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-folder-open"></i>
                <h3>Nenhum arquivo disponível</h3>
                <p>Os materiais serão adicionados em breve.</p>
            </div>`;
        return;
    }

    grid.innerHTML = arquivos.map((a, i) => {
        const icone = obterIcone(a.tipo);
        const isNovo = i < 3;
        return `
            <div class="card" onclick="abrirPreview(${i})">
                <div class="card-thumb">
                    ${gerarThumb(a)}
                    ${isNovo ? '<span class="tag-novo-card"><i class="fas fa-star"></i> Novo</span>' : ''}
                </div>
                <div class="card-body">
                    <span class="card-tag"><i class="fas ${icone}"></i> ${escapeHTML(a.tipo)}</span>
                    <h3>${escapeHTML(a.nome)}</h3>
                    <p>${escapeHTML(a.descricao || 'Clique para visualizar')}</p>
                    ${a.tamanho ? `<span class="badge-size">${a.tamanho}</span>` : ''}
                </div>
                <button class="btn-download" onclick="event.stopPropagation(); abrirPreview(${i})">
                    <i class="fas fa-eye"></i> <span>Visualizar</span>
                </button>
            </div>
        `;
    }).join('');
}

function gerarThumb(arquivo) {
    const ext = (arquivo.tipo || '').toUpperCase();
    const isImg = ['PNG','JPG','JPEG','GIF','WEBP','SVG','BMP'].includes(ext);
    const isVid = ['MP4','MOV','AVI','WEBM','MKV'].includes(ext);
    const isPdf = ext === 'PDF';

    if (isImg && arquivo.preview) {
        return `<img src="${arquivo.preview}" alt="${escapeHTML(arquivo.nome)}" loading="lazy">`;
    }
    if (isVid && arquivo.preview) {
        return `<div class="thumb-video"><img src="${arquivo.preview}"><div class="play-overlay"><i class="fas fa-play"></i></div></div>`;
    }
    if (isPdf) return `<div class="thumb-fallback pdf"><i class="fas fa-file-pdf"></i><span>PDF</span></div>`;
    return `<div class="thumb-fallback"><i class="fas fa-file"></i></div>`;
}

function obterIcone(tipo) {
    const t = (tipo || '').toLowerCase();
    if (t.includes('pdf')) return 'fa-file-pdf';
    if (t.includes('png') || t.includes('jpg') || t.includes('jpeg') || t.includes('gif')) return 'fa-file-image';
    if (t.includes('ppt')) return 'fa-file-powerpoint';
    if (t.includes('doc')) return 'fa-file-word';
    if (t.includes('xls') || t.includes('csv')) return 'fa-file-excel';
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
            card.style.display = card.textContent.toLowerCase().includes(termo) ? 'flex' : 'none';
        });
    });
}

// ============================================================
// CONTATO
// ============================================================
function renderizarContato() {
    const c = estadoSite.config;
    const email = c.Email_Contato || 'marketing@ieadcuiaba.com.br';
    const insta = (c.Instagram || '@ieadcuiaba').replace('@', '');

    const eLink = document.getElementById('contatoEmail');
    const eTxt = document.getElementById('contatoEmailTexto');
    if (eLink) eLink.href = 'mailto:' + email;
    if (eTxt) eTxt.textContent = email;

    const iLink = document.getElementById('contatoInstagram');
    const iTxt = document.getElementById('contatoInstagramTexto');
    if (iLink) iLink.href = 'https://instagram.com/' + insta;
    if (iTxt) iTxt.textContent = '@' + insta;

    const wLink = document.getElementById('contatoWhatsapp');
    if (wLink) wLink.href = 'https://wa.me/5565999999999';
}

// ============================================================
// MODAL DE PREVIEW
// ============================================================
function inicializarPreview() {
    if (!document.getElementById('previewModal')) {
        const modal = document.createElement('div');
        modal.id = 'previewModal';
        modal.className = 'preview-modal';
        modal.innerHTML = `
            <div class="preview-modal-overlay" onclick="fecharPreview()"></div>
            <div class="preview-modal-content">
                <button class="preview-close" onclick="fecharPreview()"><i class="fas fa-times"></i></button>
                <div class="preview-modal-header">
                    <div class="preview-title-area">
                        <i class="fas fa-file preview-title-icon" id="previewTitleIcon"></i>
                        <div>
                            <h3 id="previewTitulo">Nome do arquivo</h3>
                            <p id="previewMeta">Tipo • Tamanho</p>
                        </div>
                    </div>
                </div>
                <div class="preview-modal-body" id="previewBody"></div>
                <div class="preview-modal-footer">
                    <button onclick="fecharPreview()" class="btn-secondary-preview"><i class="fas fa-arrow-left"></i> Voltar</button>
                    <a id="previewDownloadBtn" href="#" download target="_blank" rel="noopener noreferrer" class="btn-download-preview">
                        <i class="fas fa-download"></i> Baixar Arquivo
                    </a>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharPreview(); });
}

function abrirPreview(index) {
    const arquivo = estadoSite.arquivos[index];
    if (!arquivo) return;

    const modal = document.getElementById('previewModal');
    const body = document.getElementById('previewBody');
    document.getElementById('previewTitulo').textContent = arquivo.nome;
    document.getElementById('previewMeta').textContent = `${arquivo.tipo} ${arquivo.tamanho ? '• ' + arquivo.tamanho : ''} ${arquivo.categoria ? '• ' + arquivo.categoria : ''}`;
    document.getElementById('previewTitleIcon').className = `fas ${obterIcone(arquivo.tipo)} preview-title-icon`;
    document.getElementById('previewDownloadBtn').href = arquivo.link;

    const ext = (arquivo.tipo || '').toUpperCase();
    const isImg = ['PNG','JPG','JPEG','GIF','WEBP','SVG','BMP'].includes(ext);
    const isVid = ['MP4','MOV','AVI','WEBM','MKV'].includes(ext);
    const isPdf = ext === 'PDF';
    const fileId = extrairFileId(arquivo.link);

    if (isImg) {
        const urlHD = fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600` : arquivo.link;
        body.innerHTML = `<div class="preview-image-wrapper"><img src="${urlHD}" alt="${escapeHTML(arquivo.nome)}"></div>`;
    } else if (isVid) {
        const url = fileId ? `https://drive.google.com/file/d/${fileId}/preview` : arquivo.link;
        body.innerHTML = `<div class="preview-video-wrapper"><iframe src="${url}" allow="autoplay" allowfullscreen frameborder="0"></iframe></div>`;
    } else if (isPdf) {
        const url = fileId ? `https://drive.google.com/file/d/${fileId}/preview` : arquivo.link;
        body.innerHTML = `<div class="preview-pdf-wrapper"><iframe src="${url}" allowfullscreen frameborder="0"></iframe></div>`;
    } else {
        body.innerHTML = `
            <div class="preview-generic">
                <div class="preview-generic-icon"><i class="fas ${obterIcone(arquivo.tipo)}"></i></div>
                <h4>${escapeHTML(arquivo.nome)}</h4>
                <p>${escapeHTML(arquivo.descricao || 'Este tipo de arquivo não possui pré-visualização.')}</p>
                <p class="preview-hint">Clique em <strong>Baixar Arquivo</strong> para fazer o download.</p>
            </div>`;
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function fecharPreview() {
    const modal = document.getElementById('previewModal');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => {
        const body = document.getElementById('previewBody');
        if (body) body.innerHTML = '';
    }, 300);
}

function extrairFileId(url) {
    if (!url) return null;
    const m1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (m1) return m1[1];
    const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (m2) return m2[1];
    return null;
}
