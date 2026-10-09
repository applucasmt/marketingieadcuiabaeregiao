/* ============================================================
 * CONFIGURAÇÃO CENTRAL DO SISTEMA
 * Marketing IEAD Cuiabá e Região
 * 
 * ⚠️ ALTERE APENAS ESTE ARQUIVO PARA CONFIGURAR O SISTEMA
 * ============================================================ */

const CONFIG = {
    // ============================================================
    // 🔗 URL DO BACKEND (Google Apps Script)
    // Cole aqui a URL gerada em: Implantar > Aplicativo da Web
    // ============================================================
    API_URL: "https://script.google.com/macros/s/AKfycbziXZvHTiX2qQI2VQrHf19fUc3ihOnirfOlCMa1_D-O0z4e8BMKArYpaXFX0YIv0ka8XA/exec",

    // ============================================================
    // 🔐 SENHA DO PAINEL ADMINISTRATIVO
    // ============================================================
    SENHA_ADMIN: "IEAD2026",

    // ============================================================
    // 🎨 IDENTIDADE VISUAL PADRÃO (fallback se não vier da planilha)
    // ============================================================
    CORES_PADRAO: {
        primaria: "#0A1C3A",
        secundaria: "#1A3A6B",
        destaque: "#D4AF37",
        texto: "#1D1D1F",
        fundo: "#FFFFFF"
    },

    // ============================================================
    // 📝 TEXTOS PADRÃO (fallback)
    // ============================================================
    TEXTOS_PADRAO: {
        titulo: "Marketing IEAD Cuiabá e Região",
        subtituloHero: "Recursos Oficiais. Excelência em Comunicação.",
        descricaoHero: "Acesse materiais institucionais, manuais de marca e conteúdos exclusivos.",
        textoBotaoHero: "Explorar Materiais",
        rodape: "© 2026 IEAD Cuiabá e Região. Todos os direitos reservados."
    },

    // ============================================================
    // ⚙️ OUTRAS CONFIGURAÇÕES
    // ============================================================
    LIMITE_UPLOAD_MB: 25,
    VERSAO: "4.0"
};

// ============================================================
// UTILITÁRIOS COMPARTILHADOS
// ============================================================

/**
 * Faz requisição GET à API
 */
async function apiGet(acao, params = {}) {
    if (!CONFIG.API_URL || CONFIG.API_URL.includes("COLE_AQUI")) {
        console.warn("⚠️ API_URL não configurada em config.js");
        return null;
    }

    try {
        const url = new URL(CONFIG.API_URL);
        url.searchParams.set('acao', acao);
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) url.searchParams.set(k, v);
        });

        const response = await fetch(url.toString(), {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache'
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (err) {
        console.error(`Erro em apiGet(${acao}):`, err);
        return null;
    }
}

/**
 * Faz requisição POST à API
 */
async function apiPost(dados) {
    if (!CONFIG.API_URL || CONFIG.API_URL.includes("COLE_AQUI")) {
        console.warn("⚠️ API_URL não configurada em config.js");
        return { status: "erro", mensagem: "API não configurada" };
    }

    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(dados)
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (err) {
        console.error("Erro em apiPost:", err);
        return { status: "erro", mensagem: err.message };
    }
}

/**
 * Converte arquivo para Base64
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Escapa HTML para prevenir XSS
 */
function escapeHTML(texto) {
    if (!texto) return '';
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

/**
 * Aplica cores dinâmicas do CONFIG/planilha nos CSS Variables
 */
function aplicarCores(config = {}) {
    const cores = {
        primaria: config.Cor_Primaria || CONFIG.CORES_PADRAO.primaria,
        secundaria: config.Cor_Secundaria || CONFIG.CORES_PADRAO.secundaria,
        destaque: config.Cor_Destaque || CONFIG.CORES_PADRAO.destaque
    };

    document.documentElement.style.setProperty('--azul-escuro', cores.primaria);
    document.documentElement.style.setProperty('--azul-medio', cores.secundaria);
    document.documentElement.style.setProperty('--dourado', cores.destaque);
}
