# contact_api

Egyszerű, biztonságos e-mail küldő API webhelyek kapcsolatfelvételi űrlapjaihoz, **Express.js** és **Resend** alapokon. Több domain-t is kiszolgál egyetlen futó példányban: a beérkező kérés `site` mezője alapján dönti el, melyik címzettnek és melyik feladói cím nevében küldje az értesítést.

## Funkciók

- E-mail küldés a [Resend](https://resend.com) szolgáltatáson keresztül
- Több webhely támogatása egyetlen API-n (`codenogi`, `sonovic`)
- Bemenet-validáció (`validator` csomag) és HTML escape az XSS ellen
- CORS whitelist alapú engedélyezés
- Rate limiting (15 percenként 100 kérés / IP)
- Biztonsági fejlécek a `helmet` csomaggal
- Body méretkorlát (10 kB) és üzenethossz-korlát (3000 karakter)
- Saját fájl alapú naplózás (`logs/server.log`)
- Kötelező környezeti változók ellenőrzése induláskor
- Graceful shutdown (`SIGTERM` kezelés)

## Követelmények

- Node.js 18 vagy újabb (ES Modules támogatás miatt)
- npm
- Érvényes Resend API kulcs

## Telepítés

```bash
git clone <repository-url>
cd contact_api
npm install
```

## Konfiguráció

Hozz létre egy `.env` fájlt a projekt gyökerében az alábbi változókkal:

```env
# Node környezet (development esetén konzolra is naplóz)
NODE_ENV=development

# Resend API kulcs
RESEND_API_KEY=your_resend_api_key_here

# Értesítési címek site-onként
NOTIFY_EMAIL_CODENOGI=example1@gmail.com
NOTIFY_EMAIL_SONOVIC=example2@gmail.com

# Opcionális, alapértelmezetten 3388
PORT=3388
```

A `RESEND_API_KEY`, `NOTIFY_EMAIL_CODENOGI` és `NOTIFY_EMAIL_SONOVIC` változók kötelezőek; ha bármelyik hiányzik, a szerver hibával leáll induláskor.

### Engedélyezett domainek és feladói címek

A `constants.mjs` fájl tartalmazza a CORS whitelist-et és a feladói címeket. Új webhely hozzáadásához itt kell bővíteni az `allowedOrigins`, `notifyEmails` és `siteemails` objektumokat (és a `.env` fájlt egy új `NOTIFY_EMAIL_*` változóval):

```javascript
const allowedOrigins = [
  "http://localhost:5173",
  "https://nogradijozsef.hu",
  "https://sono-vic.hu",
];

const notifyEmails = {
  codenogi: process.env.NOTIFY_EMAIL_CODENOGI,
  sonovic: process.env.NOTIFY_EMAIL_SONOVIC,
};

const siteemails = {
  codenogi: "<noreply@nogradijozsef.hu>",
  sonovic: "<noreply@sono-vic.hu>",
};
```

## Indítás

```bash
npm start
```

Sikeres indítás esetén a szerver a megadott porton (alapértelmezetten 3388) figyel, és a `logs/server.log` fájlba írja az indítási üzenetet.

## API végpont

### `POST /contact/siteemail`

Kapcsolatfelvételi üzenet küldése a megadott site-hoz tartozó címre.

**Kérés fejlécek**

```
Content-Type: application/json
```

**Kérés törzs**

| Mező      | Típus    | Kötelező | Leírás                                                    |
|-----------|----------|----------|-----------------------------------------------------------|
| `name`    | string   | igen     | A feladó neve                                             |
| `email`   | string   | igen     | A feladó e-mail címe (validátorral ellenőrizve)           |
| `message` | string   | igen     | Az üzenet szövege (max. 3000 karakter)                    |
| `site`    | string   | igen     | A site azonosítója: `codenogi` vagy `sonovic`             |

**Példa kérés**

```bash
curl -X POST http://localhost:3388/contact/siteemail \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teszt Elek",
    "email": "teszt@example.com",
    "message": "Ez egy próbaüzenet.",
    "site": "codenogi"
  }'
```

**Válaszok**

Sikeres küldés (`200 OK`):

```json
{ "status": "success", "message": "Email has sent!" }
```

Hibás bemenet (`400 Bad Request`) – például hiányzó mező, érvénytelen e-mail, ismeretlen site vagy túl hosszú üzenet:

```json
{ "status": "fail", "message": "Invalid email address!" }
```

Túl sok kérés (`429 Too Many Requests`):

```json
{ "status": "error", "message": "Too many requests, please try again later." }
```

Szerver- vagy Resend-hiba (`500 Internal Server Error`):

```json
{ "status": "error", "message": "An error occurred while sending the email!" }
```

## Naplózás

Minden lényeges esemény (sikeres küldés, validációs hiba, Resend-hiba, indítás) a `logs/server.log` fájlba kerül ISO 8601 időbélyeggel. A `logs` mappa az első naplóíráskor automatikusan létrejön. `NODE_ENV=development` esetén a bejegyzések a konzolra is kiíródnak.

## Projektstruktúra

```
contact_api/
├── index.mjs            # Belépési pont, Express szerver és végpontok
├── constants.mjs        # CORS whitelist, site → e-mail mapping
├── helperfunctions.mjs  # Naplózási segédfüggvények
├── package.json
├── .env                 # Környezeti változók (nem verziókövetett)
├── .gitignore
└── logs/
    └── server.log       # Futás közbeni napló (futáskor jön létre)
```

## Függőségek

- [express](https://www.npmjs.com/package/express) – HTTP szerver és routing
- [resend](https://www.npmjs.com/package/resend) – e-mail küldési szolgáltatás kliense
- [cors](https://www.npmjs.com/package/cors) – CORS middleware
- [helmet](https://www.npmjs.com/package/helmet) – biztonsági HTTP fejlécek
- [express-rate-limit](https://www.npmjs.com/package/express-rate-limit) – kérésszám-korlátozás
- [validator](https://www.npmjs.com/package/validator) – e-mail validáció és HTML escape
- [dotenv](https://www.npmjs.com/package/dotenv) – `.env` fájl betöltése

## Licenc

MIT

## Szerző

!gi
