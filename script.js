// Configurações
const RSS_URL = 'https://oglobo.globo.com/rss/oglobo';
const CORS_PROXY = 'https://corsproxy.io/?';

// Elementos DOM
const loadingElement = document.getElementById('loading');
const newsGrid = document.getElementById('newsGrid');

// Função para formatar data
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) {
        return 'Agora mesmo';
    } else if (diffHours < 24) {
        return `${diffHours}h atrás`;
    } else if (diffDays < 7) {
        return `${diffDays}d atrás`;
    } else {
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
}

// Função para extrair categoria da URL
function extractCategory(url) {
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        
        // Procura por uma categoria válida no caminho
        const categories = ['politica', 'economia', 'brasil', 'mundo', 'rio', 'esportes', 'cultura', 'saude'];
        for (const part of pathParts) {
            if (categories.includes(part)) {
                return part.charAt(0).toUpperCase() + part.slice(1);
            }
        }
        
        // Se não encontrar categoria específica, retorna "Geral"
        return 'Geral';
    } catch (error) {
        return 'Geral';
    }
}

// Função para criar botões de compartilhamento
function createShareButtons(title, url) {
    const encodedTitle = encodeURIComponent(title);
    const encodedUrl = encodeURIComponent(url);
    
    return `
        <div class="share-buttons">
            <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" 
               target="_blank" 
               rel="noopener noreferrer" 
               class="share-btn facebook">
                <i class="fab fa-facebook-f"></i>
                Facebook
            </a>
            <a href="https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}" 
               target="_blank" 
               rel="noopener noreferrer" 
               class="share-btn twitter">
                <i class="fab fa-twitter"></i>
                Twitter
            </a>
            <a href="https://wa.me/?text=${encodedTitle}%20${encodedUrl}" 
               target="_blank" 
               rel="noopener noreferrer" 
               class="share-btn whatsapp">
                <i class="fab fa-whatsapp"></i>
                WhatsApp
            </a>
        </div>
    `;
}

// Função para criar card de notícia
function createNewsCard(item) {
    const title = item.title || 'Sem título';
    const link = item.link || '#';
    const pubDate = item.pubDate ? formatDate(item.pubDate) : 'Data não disponível';
    const category = extractCategory(link);
    const description = item.description || '';
    
    // Extrair imagem do conteúdo
    let imageUrl = '';
    let imageCredit = '';
    
    // Procurar por media:content no description
    function parseXML(xmlText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    const parseError = xmlDoc.getElementsByTagName('parsererror');
    if (parseError.length > 0) {
        throw new Error('Erro ao fazer parse do XML');
    }

    const items = xmlDoc.getElementsByTagName('item');
    const newsItems = [];

    for (let i = 0; i < items.length; i++) {
        const item = items[i];

        const mediaContentTag = item.getElementsByTagName('media:content')[0];
        const mediaCreditTag = item.getElementsByTagName('media:credit')[0];

        const newsItem = {
            title: item.getElementsByTagName('title')[0]?.textContent || '',
            link: item.getElementsByTagName('link')[0]?.textContent || '',
            description: item.getElementsByTagName('description')[0]?.textContent || '',
            pubDate: item.getElementsByTagName('pubDate')[0]?.textContent || '',
            guid: item.getElementsByTagName('guid')[0]?.textContent || '',
            imageUrl: mediaContentTag?.getAttribute('url') || '',
            imageCredit: mediaCreditTag?.textContent || ''
        };

        newsItems.push(newsItem);
    }

    return newsItems;
}

    
    // Procurar por media:credit
    const mediaCreditMatch = description.match(/<media:credit>([^<]*)<\/media:credit>/);
    if (mediaCreditMatch) {
        imageCredit = mediaCreditMatch[1];
    }
    
    // Se não encontrar imagem, usar uma imagem padrão
    if (!imageUrl) {
        imageUrl = 'https://via.placeholder.com/400x220/3b82f6/ffffff?text=O+Globo';
    }
    
    return `
        <article class="news-card">
            <img src="${imageUrl}" 
                 alt="${title}" 
                 class="news-image"
                 onerror="this.src='https://via.placeholder.com/400x220/3b82f6/ffffff?text=O+Globo'">
            
            <div class="news-content">
                <div class="news-meta">
                    <span class="news-category">${category}</span>
                    <span class="news-date">${pubDate}</span>
                </div>
                
                <h2 class="news-title">
                    <a href="${link}" target="_blank" rel="noopener noreferrer">
                        ${title}
                    </a>
                </h2>
                
                ${imageCredit ? `<div class="news-credit">Crédito: ${imageCredit}</div>` : ''}
                
                ${createShareButtons(title, link)}
            </div>
        </article>
    `;
}

// Função para parsear XML
function parseXML(xmlText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    // Verificar se houve erro no parsing
    const parseError = xmlDoc.getElementsByTagName('parsererror');
    if (parseError.length > 0) {
        throw new Error('Erro ao fazer parse do XML');
    }
    
    const items = xmlDoc.getElementsByTagName('item');
    const newsItems = [];
    
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        const newsItem = {
            title: item.getElementsByTagName('title')[0]?.textContent || '',
            link: item.getElementsByTagName('link')[0]?.textContent || '',
            description: item.getElementsByTagName('description')[0]?.textContent || '',
            pubDate: item.getElementsByTagName('pubDate')[0]?.textContent || '',
            guid: item.getElementsByTagName('guid')[0]?.textContent || ''
        };
        
        newsItems.push(newsItem);
    }
    
    return newsItems;
}

// Função para carregar notícias
async function loadNews() {
    try {
        loadingElement.style.display = 'block';
        newsGrid.innerHTML = '';
        
        console.log('Carregando notícias do RSS...');
        
        // Usar proxy CORS para acessar o RSS
        const response = await fetch(CORS_PROXY + encodeURIComponent(RSS_URL));
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const xmlText = await response.text();
        console.log('RSS carregado com sucesso');
        
        const newsItems = parseXML(xmlText);
        console.log(`${newsItems.length} notícias encontradas`);
        
        if (newsItems.length === 0) {
            newsGrid.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Nenhuma notícia encontrada.</p>';
            return;
        }
        
        // Ordenar por data (mais recente primeiro)
        newsItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
        
function createNewsCard(item) {
    const title = item.title || 'Sem título';
    const link = item.link || '#';
    const pubDate = item.pubDate ? formatDate(item.pubDate) : 'Data não disponível';
    const category = extractCategory(link);
    const imageUrl = item.imageUrl || 'https://via.placeholder.com/400x220/3b82f6/ffffff?text=O+Globo';
    const imageCredit = item.imageCredit || '';

    return `
        <article class="news-card">
            <img src="${imageUrl}" 
                 alt="${title}" 
                 class="news-image"
                 onerror="this.src='https://via.placeholder.com/400x220/3b82f6/ffffff?text=O+Globo'">
            
            <div class="news-content">
                <div class="news-meta">
                    <span class="news-category">${category}</span>
                    <span class="news-date">${pubDate}</span>
                </div>
                
                <h2 class="news-title">
                    <a href="${link}" target="_blank" rel="noopener noreferrer">
                        ${title}
                    </a>
                </h2>
                
                ${imageCredit ? `<div class="news-credit">Crédito: ${imageCredit}</div>` : ''}

                ${createShareButtons(title, link)}
            </div>
        </article>
    `;
}


// Função para atualizar notícias
function refreshNews() {
    loadNews();
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('Página carregada, iniciando carregamento das notícias...');
    loadNews();
    
    // Atualizar notícias a cada 5 minutos
    setInterval(refreshNews, 5 * 60 * 1000);
});

// Adicionar funcionalidade ao botão de busca (placeholder)
document.querySelector('.search-btn').addEventListener('click', function() {
    alert('Funcionalidade de busca em desenvolvimento!');
});

// Adicionar smooth scroll para navegação
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Remover classe active de todos os links
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        
        // Adicionar classe active ao link clicado
        this.classList.add('active');
        
        // Aqui poderia implementar filtros por categoria
        console.log('Categoria selecionada:', this.textContent);
    });
});
