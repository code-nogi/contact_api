/*-------------------------------*/
/*MODUL IMPORT*/
/*-------------------------------*/
import { appendFile, mkdir } from "fs/promises";

/*-------------------------------*/
/*HELPERFUNCTIONS*/
/*-------------------------------*/
//A naplózási időt generáló függvény
const logDateTime = () => {
  return new Date(Date.now()).toISOString();
};

//A szerver naplózási fájlt szerkesztő függvény
const serverLogging = async (message) => {
  await mkdir("./logs", { recursive: true });
  await appendFile("./logs/server.log", `${logDateTime()} ${message}\n`);
  if (process.env.NODE_ENV === "development") {
    console.log(`${logDateTime()} ${message}`);
  }
};

/*-------------------------------*/
/*MODUL EXPORT*/
/*-------------------------------*/
export { serverLogging };
