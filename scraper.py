import requests
from bs4 import BeautifulSoup
import json
import re

# Tarnung als normaler Browser
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
    "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7"
}

def update_club_data():
    config_path = 'config.json'
    
    # 1. Bisherige config.json laden, um Ziele und Partner zu behalten
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
    except FileNotFoundError:
        config = {"partners": [], "news": "", "upcoming_tournaments": [], "goals": [], "live_members": "..."}

    # 2. Reale Mitgliederzahl von der Startseite scrapen
    try:
        club_url = "https://www.chess.com/club/entenhausen"
        res = requests.get(club_url, headers=HEADERS, timeout=10)
        soup = BeautifulSoup(res.text, 'html.parser')
        
        # Sucht im HTML nach dem Wort "Mitglieder" oder "Members"
        text_content = soup.get_text()
        match = re.search(r'([\d\.,]+)\s*(Mitglieder|Members)', text_content, re.IGNORECASE)
        if match:
            # Kommas/Punkte entfernen (z.B. aus 1,234)
            clean_number = match.group(1).replace(',', '').replace('.', '')
            config['live_members'] = clean_number
    except Exception as e:
        print(f"Fehler beim Mitglieder scrapen: {e}")

    # 3. Anstehende Turniere scrapen
    try:
        events_url = "https://www.chess.com/clubs/events/entenhausen"
        res = requests.get(events_url, headers=HEADERS, timeout=10)
        soup = BeautifulSoup(res.text, 'html.parser')
        
        tournaments = []
        # Wir suchen alle Event-Karten (die Chess.com Struktur)
        event_cards = soup.select('.club-match-component, .event-component, .v5-section-content-list-item')
        
        for card in event_cards[:3]: # Nur die Top 3
            title_elem = card.select_one('.club-match-title, .event-title, a.club-event-title')
            date_elem = card.select_one('.club-match-time, .event-time, .club-event-time')
            link_elem = card.select_one('a')
            
            if title_elem and link_elem:
                tournaments.append({
                    "title": title_elem.get_text(strip=True),
                    "format": "Club Arena", # Fallback
                    "date": date_elem.get_text(strip=True) if date_elem else "Demnächst",
                    "url": link_elem['href'] if link_elem['href'].startswith('http') else 'https://www.chess.com' + link_elem['href']
                })
        
        if tournaments:
            config['upcoming_tournaments'] = tournaments
            
    except Exception as e:
        print(f"Fehler beim Turniere scrapen: {e}")

    # 4. Neue Daten in die config.json schreiben
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=4, ensure_ascii=False)
    print("Update erfolgreich abgeschlossen!")

if __name__ == "__main__":
    update_club_data()
