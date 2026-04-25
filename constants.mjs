/*-------------------------------*/
/*CONSTANTS*/
/*-------------------------------*/
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
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

/*-------------------------------*/
/*MODUL EXPORT*/
/*-------------------------------*/
export { allowedOrigins, notifyEmails, siteemails };
