const RSS_URL = 'https://oglobo.globo.com/rss/oglobo';
const CORS_PROXY = 'https://corsproxy.io/?';
const loadingElement = document.getElementById('loading');
const newsGrid = document.getElementById('newsGrid');

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

function extractCategory(url) {
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        const categories = ['politica', 'economia', 'brasil', 'mundo', 'rio', 'esportes', 'cultura', 'saude'];
        for (const part of pathParts) {
            if (categories.includes(part)) {
                return part.charAt(0).toUpperCase() + part.slice(1);
            }
        }
        return 'Geral';
    } catch (error) {
        return 'Geral';
    }
}

function createShareButtons(title, url) {
    const encodedTitle = encodeURIComponent(title);
    const encodedUrl = encodeURIComponent(url);

    return `
        <div class="share-buttons">
            <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" class="share-btn facebook">
                <i class="fab fa-facebook-f"></i> Facebook
            </a>
            <a href="https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}" target="_blank" class="share-btn twitter">
                <i class="fab fa-twitter"></i> Twitter
            </a>
            <a href="https://wa.me/?text=${encodedTitle}%20${encodedUrl}" target="_blank" class="share-btn whatsapp">
                <i class="fab fa-whatsapp"></i> WhatsApp
            </a>
        </div>
    `;
}

function createNewsCard(item) {
    const title = item.title || 'Sem título';
    const link = item.link || '#';
    const pubDate = item.pubDate ? formatDate(item.pubDate) : 'Data não disponível';
    const category = extractCategory(link);
    const imageUrl = item.imageUrl || 'https://via.placeholder.com/400x220/3b82f6/ffffff?text=O+Globo';
    const imageCredit = item.imageCredit || '';

    return `
        <article class="news-card">
            <img src="${imageUrl}" alt="${title}" class="news-image"
                onerror="this.src='https://via.placeholder.com/400x220/3b82f6/ffffff?text=O+Globo'">
            <div class="news-content">
                <div class="news-meta">
                    <span class="news-category">${category}</span>
                    <span class="news-date">${pubDate}</span>
                </div>
                <h2 class="news-title">
                    <a href="${link}" target="_blank" rel="noopener noreferrer">${title}</a>
                </h2>
                ${imageCredit ? `<div class="news-credit">Crédito: ${imageCredit}</div>` : ''}
                ${createShareButtons(title, link)}
            </div>
        </article>
    `;
}

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

async function loadNews() {
    try {
        loadingElement.style.display = 'block';
        newsGrid.innerHTML = '';

        const response = await fetch(CORS_PROXY + encodeURIComponent(RSS_URL));
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const xmlText = await response.text();
        const newsItems = parseXML(xmlText);

        newsItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

        const newsHTML = newsItems.map(item => createNewsCard(item)).join('');
        newsGrid.innerHTML = newsHTML;

    } catch (error) {
        console.error('Erro ao carregar notícias:', error);
        newsGrid.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <h3>Erro ao carregar notícias</h3>
                <p>Não foi possível carregar as notícias do O Globo.</p>
                <p>Erro: ${error.message}</p>
                <button onclick="loadNews()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Tentar novamente
                </button>
            </div>
        `;
    } finally {
        loadingElement.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    loadNews();
    setInterval(loadNews, 5 * 60 * 1000);
});
