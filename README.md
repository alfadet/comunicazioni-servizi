# Comunicazioni Servizi - Alfa Security

Web app mobile-first per l'inserimento e l'invio via email dei protocolli operativi
(sito, data, orario, unità assegnate) dei servizi di sicurezza.

## Stack
- Frontend: React + Vite, servito da nginx
- Backend: Node.js + Express
- Database: PostgreSQL
- Invio email: Nodemailer (SMTP)
- Tutto containerizzato con Docker Compose

## Configurazione

1. Copia `.env.example` in `.env` e compila i valori:
   - `DB_PASSWORD`: stringa casuale forte
   - `SMTP_USER` / `SMTP_PASS`: account email mittente. Per Gmail serve una
     **app password** (non la password normale), generata da
     https://myaccount.google.com/apppasswords con la verifica in due passaggi attiva
   - `RECIPIENT_EMAIL`: già impostato su `amm.alfadetectives@gmail.com`

**Nota**: l'app non ha login — chiunque abbia il link può accedere e inviare comunicazioni.
Scelta esplicita dell'utente per semplicità d'uso.

## Deploy sul VPS

```bash
cd /var/www
git clone https://github.com/alfadet/comunicazioni-servizi
cd comunicazioni-servizi
cp .env.example .env
nano .env   # compila i valori
docker compose up -d --build
```

Per aggiornamenti successivi (stesso pattern delle altre app):

```bash
cd /var/www/comunicazioni-servizi
git pull
docker compose up -d --build
```

## Nginx (host) e sottodominio

Il frontend è esposto sulla porta `8090` del container (verifica che sia libera sul
VPS, altrimenti cambiala in `docker-compose.yml`). Aggiungi un blocco nginx sull'host,
sullo stesso modello degli altri sottodomini:

```nginx
server {
    server_name servizi.alfasecurity.group;
    location / {
        proxy_pass http://localhost:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Poi genera il certificato SSL con certbot come per gli altri sottodomini.

## Uso

1. Il dipendente apre il link (nessun login richiesto) e sceglie la visualizzazione
   Desktop o iPhone al primo accesso.
2. Sezione **Operatori**: aggiunge/modifica/cancella i nominativi disponibili.
3. Sezione **Siti**: aggiunge/modifica/cancella i siti/locali/eventi disponibili.
4. Sezione **Nuova**: compila uno o più "protocolli operativi" (sito selezionabile dalla
   lista, data, orario, unità assegnate cercabili dalla lista, note), poi tocca
   "Rivedi e invia" per vedere l'anteprima esatta dell'email prima della conferma.
5. Sezione **Storico**: consulta le comunicazioni già inviate; da ogni comunicazione
   si può toccare "Duplica e modifica" per riaprirla in un nuovo form, correggere
   i dati (es. nominativi sbagliati) e inviarla di nuovo.

L'email generata ha oggetto `COMUNICAZIONE SERVIZI - ALFA SECURITY - [data odierna]`
e corpo con i protocolli numerati progressivamente, nello stesso formato già in uso.
