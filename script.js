// HIER DEN EXAKTEN CLUB-NAMEN AUS DER CHESS.COM URL EINTRAGEN
const CLUB_SLUG = 'entenhausen'; 

async function initDashboard() {
    try {
        // 1. Live-Mitgliederzahlen laden
        const clubRes = await fetch(`https://api.chess.com/pub/club/${CLUB_SLUG}`);
        const clubData = await clubRes.json();
        
        document.getElementById('member-count').textContent = clubData.members_count || '-';
        
        // Tages-Rating laden (falls verfügbar, ansonsten einen Fallback anzeigen)
        document.getElementById('daily-rating').textContent = clubData.average_daily_rating || 'N/A';
        
        // 2. Laufende und anstehende Matches laden
        const matchesRes = await fetch(`https://api.chess.com/pub/club/${CLUB_SLUG}/matches`);
        const matchesData = await matchesRes.json();
        
        renderMatches(matchesData);
    } catch (error) {
        console.error("Fehler beim Laden der Chess.com Daten:", error);
        document.getElementById('matches-container').innerHTML = '<p style="color: var(--text-muted);">Live-Daten momentan nicht verfügbar.</p>';
    }
}

function renderMatches(data) {
    const container = document.getElementById('matches-container');
    container.innerHTML = ''; // Lade-Text entfernen

    // Wir kombinieren Matches in der Registrierungsphase und laufende Matches (max. 3 Stück für die Übersicht)
    const activeMatches = [...(data.registered || []), ...(data.in_progress || [])].slice(0, 3);

    if (activeMatches.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); font-size: 14px;">Aktuell keine Turniere. Bereite dich auf das nächste vor!</p>';
        return;
    }

    activeMatches.forEach(match => {
        // Gegnerischen Club aus der Match-URL extrahieren
        const opponentUrlParts = match.opponent.split('/');
        const opponentName = opponentUrlParts[opponentUrlParts.length - 1].replace(/-/g, ' ');

        const card = document.createElement('div');
        card.className = 'match-card';
        
        // Klick auf die Karte öffnet das Turnier direkt in Chess.com
        card.onclick = () => window.open(match.url, '_blank');
        
        card.innerHTML = `
            <p class="match-title">vs. <span style="text-transform: capitalize;">${opponentName}</span></p>
            <p class="match-meta">Status: ${match.status === 'registration' ? 'Registrierung läuft 🟢' : 'Match läuft ⚔️'}</p>
        `;
        
        container.appendChild(card);
    });
}

async function loadConfig() {
    try {
        // Lädt die config.json (Zeitstempel verhindert veraltete Daten im Browser-Cache)
        const res = await fetch(`config.json?v=${new Date().getTime()}`);
        const config = await res.json();

        // 1. News anzeigen
        const newsContainer = document.getElementById('club-news');
        if (config.news && config.news.trim() !== "") {
            newsContainer.textContent = config.news;
            newsContainer.style.display = "block";
        }

        // 2. Clubziele laden
        const goalsContainer = document.getElementById('club-goals');
        if (config.goals && config.goals.length > 0) {
            goalsContainer.innerHTML = ""; // Leer machen
            config.goals.forEach(goal => {
                const li = document.createElement('li');
                li.textContent = goal;
                goalsContainer.appendChild(li);
            });
        }

        // 3. Partner intelligent steuern
        const partnerSection = document.getElementById
