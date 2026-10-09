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
});

// ============================================================
// CARREGAR DADOS DO BACKEND
// ============================================================
async function carregarDadosSite() {
    // Carrega tudo de uma vez (otimizado)
    const dados = await apiGet('tudo');

    if (dados) {
        estadoSite.config = dados.config || {};
        estadoSite.arquivos = dados.arquivos || [];
        estadoSite.carrossel = dados.carrossel || [];
        estadoSite.menus = dados.menus || [];
    } else {
        // Fallback: usa config.js como padrão
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
// APLICAR CONFIGURAÇÕES (cores, logo, textos)
// ============================================================
function aplicarConfiguracoes() {
    const c = estadoSite.config;

    // Aplica cores
    aplicarCores(c);

    // Título do documento
    if (c.Titulo_Site) document.title = c.Titulo_Site;

    // Logo
    if (c.Logo_URL) {
        const logoImg = document.getElementById('siteLogo');
        logoImg.src = c.Logo_URL;
        logoImg.onerror = () => {
            logoImg.src = "https://via.placeholder.com/120x40/0a1c3a/d4af37?text=IEAD";
        };
    }

    // Subtítulo no header
    if (c.Subtitulo_Hero) {
        document.getElementById('siteSubtitulo').textContent = c.Subtitulo_Hero.split('.')[0] || 'Cuiabá e Região';
    }

    // Hero
    document.getElementById('heroTitulo').textContent = c.Titulo_Site || CONFIG.TEXTOS_PADRAO.titulo;
    document.getElementById('heroDescricao').textContent = c.Descricao_Hero || CONFIG.TEXTOS_PADRAO.descricaoHero;
    document.getElementById('heroBotao').textContent = c.Texto_Botao_Hero || CONFIG.TEXTOS_PADRAO.textoBotaoHero;

    // Rodapé
    document.getElementById('siteRodape').textContent = c.Texto_Rodape || CONFIG.TEXTOS_PADRAO.rodape;

    // Redes sociais no rodapé
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

    // Mostrar/ocultar carrossel
    if (c.Mostrar_Carrossel === 'FALSE') {
        document.getElementById('carouselSection').style.display = 'none';
    }

    // Mostrar/ocultar busca
    if (c.Mostrar_Busca === 'FALSE') {
        document.querySelector('.search-wrapper').style.display = 'none';
    }
}

// ============================================================
// MENUS DINÂMICOS
// ============================================================
function renderizarMenus() {
    const nav = document.getElementById('siteMenus');
    
    if (!estadoSite.menus.length) {
        // Menus padrão
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
// CARROSSEL DINÂMICO
// ============================================================
function renderizarCarrossel() {
    const track = document.getElementById('carouselTrack');
    const dotsContainer = document.getElementById('dotsContainer');

    // Se não há carrossel, usa padrão
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
// ARQUIVOS (GRID DE DOWNLOADS)
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

    grid.innerHTML = arquivos.map(a => {
        const icone = obterIcone(a.tipo);
        return `
            <div class="card">
                <div>
                    <i class="fas ${icone} card-icon"></i>
                    <h3>${escapeHTML(a.nome)}</h3>
                    <p>${escapeHTML(a.descricao || 'Clique para acessar')}</p>
                    ${a.tamanho ? `<span class="badge-size">${a.tamanho}</span>` : ''}
                </div>
                <a href="${a.link}" target="_blank" rel="noopener noreferrer" class="btn-download">
                    <i class="fas fa-download"></i> Baixar
                </a>
            </div>
        `;
    }).join('');
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
