/* ============================================================
 * CONFIGURAÇÃO CENTRAL DO SISTEMA
 * Marketing IEAD Cuiabá e Região
 * ============================================================ */

window.CONFIG = {
    API_URL: "https://script.google.com/macros/s/AKfycbziXZvHTiX2qQI2VQrHf19fUc3ihOnirfOlCMa1_D-O0z4e8BMKArYpaXFX0YIv0ka8XA/exec",
    SENHA_ADMIN: "IEAD2026",

    CORES_PADRAO: {
        primaria: "#0A1C3A",
        secundaria: "#1A3A6B",
        destaque: "#D4AF37"
    },

    TEXTOS_PADRAO: {
        titulo: "Marketing IEAD Cuiabá e Região",
        subtituloHero: "Recursos Oficiais. Excelência em Comunicação.",
        descricaoHero: "Acesse materiais institucionais, manuais de marca e conteúdos exclusivos.",
        textoBotaoHero: "Explorar Materiais",
        rodape: "© 2026 IEAD Cuiabá e Região. Todos os direitos reservados."
    },

    LIMITE_UPLOAD_MB: 25,
    VERSAO: "21.0"
};

// ============================================================
// UTILITÁRIOS COMPARTILHADOS
// ============================================================

window.apiGet = async function(acao, params = {}) {
    if (!window.CONFIG || !window.CONFIG.API_URL || window.CONFIG.API_URL.includes("COLE_AQUI")) {
        console.warn("⚠️ API_URL não configurada em config.js");
        return null;
    }

    try {
        const url = new URL(window.CONFIG.API_URL);
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
};

window.apiPost = async function(dados) {
    if (!window.CONFIG || !window.CONFIG.API_URL || window.CONFIG.API_URL.includes("COLE_AQUI")) {
        console.warn("⚠️ API_URL não configurada em config.js");
        return { status: "erro", mensagem: "API não configurada" };
    }

    try {
        const response = await fetch(window.CONFIG.API_URL, {
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
};

window.fileToBase64 = function(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

window.escapeHTML = function(texto) {
    if (texto === null || texto === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(texto);
    return div.innerHTML;
};

window.aplicarCores = function(config = {}) {
    if (document.body.classList.contains('cms-body')) return;
    if (document.querySelector('.cms-sidebar')) return;

    const cores = {
        primaria: config.Cor_Primaria || window.CONFIG.CORES_PADRAO.primaria,
        secundaria: config.Cor_Secundaria || window.CONFIG.CORES_PADRAO.secundaria,
        destaque: config.Cor_Destaque || window.CONFIG.CORES_PADRAO.destaque
    };

    document.documentElement.style.setProperty('--azul-escuro', cores.primaria);
    document.documentElement.style.setProperty('--azul-medio', cores.secundaria);
    document.documentElement.style.setProperty('--dourado', cores.destaque);
};

console.log("✅ config.js carregado com sucesso");
console.log("CONFIG.API_URL:", window.CONFIG.API_URL);
