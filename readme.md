# Express Backend z Google Gemini API

Minimalny backend (80 linii) dla generatora aplikacji biznesowych z integracją AI.

## 🚀 Szybki Start

### 1. Instalacja

```bash
# Sklonuj pliki do nowego folderu
mkdir gemini-backend
cd gemini-backend

# Skopiuj server.js, package.json i .env
npm install
```

### 2. Konfiguracja Gemini API

1. Idź na https://makersuite.google.com/app/apikey
2. Wygeneruj nowy API key
3. Skopiuj `.env` i wstaw swój klucz:

```bash
# .env
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=3001
```

### 3. Uruchomienie

```bash
# Produkcja
npm start

# Development (z auto-restart)
npm run dev
```

## 🔗 Integracja z React

W swoim React projekcie zmień `Chat.tsx` na wersję z artefaktu i uruchom oba serwery:

```bash
# Terminal 1 - Backend
cd gemini-backend
npm start

# Terminal 2 - React Frontend  
cd your-react-app
npm run dev
```

## 🧪 Testowanie

### Health Check
```bash
curl http://localhost:3001/health
```

### Chat API
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Potrzebuję sklep internetowy z produktami"}'
```

Odpowiedź będzie zawierać tag `<create_vendor_app>` gotowy do parsowania przez React!

## 📁 Struktura Plików

```
gemini-backend/
├── server.js          # Główny serwer Express
├── package.json       # Zależności npm
├── .env               # Konfiguracja (API keys)
└── README.md          # Ta instrukcja
```

## 🎯 Funkcje

- ✅ POST `/api/chat` - komunikacja z Gemini AI
- ✅ System prompt dla generatora aplikacji
- ✅ CORS dla React na localhost:5173
- ✅ Error handling i walidacja
- ✅ Environment variables
- ✅ Health check endpoint

## 🤖 Jak Działa AI

Backend wysyła do Gemini system prompt, który:
1. Analizuje opis aplikacji od użytkownika
2. Generuje tag `<create_vendor_app>` z schema
3. React parsuje tag i tworzy aplikację w Supabase

**Przykład:**
- Input: "Potrzebuję CRM dla klientów"
- Output: `<create_vendor_app name="CRM System" slug="crm" schema="clients:name:string,email:string;contacts:date:date,notes:text">`