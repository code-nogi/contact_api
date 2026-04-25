/*-------------------------------*/
/*MODUL IMPORT*/
/*-------------------------------*/
import express from "express";
import { Resend } from "resend";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import validator from "validator";
import "dotenv/config";
import { serverLogging } from "./helperfunctions.mjs";
import { allowedOrigins, notifyEmails, siteemails } from "./constants.mjs";

/*-------------------------------*/
/*ENV VALIDATION*/
/*-------------------------------*/
const requiredEnv = [
  "RESEND_API_KEY",
  "NOTIFY_EMAIL_CODENOGI",
  "NOTIFY_EMAIL_SONOVIC",
];
if (!requiredEnv.every((key) => process.env[key])) {
  console.error(`❌ Missing required env variables!`);
  process.exit(1);
}

/*-------------------------------*/
/*GLOBAL VARIABLES*/
/*-------------------------------*/
const server = express();
const resend = new Resend(process.env.RESEND_API_KEY);
const port = process.env.PORT ?? 3388;

/*-------------------------------*/
/*MIDDLEWARES*/
/*-------------------------------*/
//HELMET
server.use(helmet());
//BODY SIZE LIMIT
server.use(express.json({ limit: "10kb" }));
//REQUEST RATE LIMITER
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    status: "error",
    message: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
//CORS
server.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error("CORS not allowed"));
    },
  }),
);

/*-------------------------------*/
/*ENDPOINTS*/
/*-------------------------------*/
server.post("/contact/siteemail", limiter, async (request, response) => {
  const { name, email, message, site } = request.body;
  //CHECK BLANK DATA
  if (!name || !email || !message) {
    const logMessage = `❌ Blank input field: ${!name ? "Name" : ""} ${!email ? "Email" : ""} ${!message ? "Message" : ""}`;
    await serverLogging(logMessage);
    return response
      .status(400)
      .json({ status: "fail", message: "Please fill in every input field!" });
  }
  //CHECK SITE VALIDATION
  if (!Object.keys(notifyEmails).includes(site)) {
    const logMessage = `❌ Invalid site parameter: ${site}`;
    await serverLogging(logMessage);
    return response
      .status(400)
      .json({ status: "fail", message: "Invalid site parameter!" });
  }
  //CHECK EMAIL VALIDATION
  if (!validator.isEmail(email)) {
    const logMessage = `❌ Invalid email address: ${email}`;
    await serverLogging(logMessage);
    return response
      .status(400)
      .json({ status: "fail", message: "Invalid email address!" });
  }
  //NOTIFY_EMAIL SELECTION
  const notifyEmail = notifyEmails[site];
  //MESSAGE LENGTH VALIDATION
  if (message.length > 3000) {
    const logMessage = `❌ Message too long: ${message.length} char`;
    await serverLogging(logMessage);
    return response
      .status(400)
      .json({ status: "fail", message: "Message too long!" });
  }
  try {
    const { data, error } = await resend.emails.send({
      from: `Contact Form ${siteemails[site]}`,
      to: notifyEmail,
      replyTo: email,
      subject: `Új üzenet – ${site}`,
      html: `
    <h2>Új kapcsolatfelvétel</h2>
    <p><strong>Név:</strong> ${validator.escape(name)}</p>
    <p><strong>Email:</strong> ${validator.escape(email)}</p>
    <p><strong>Üzenet:</strong></p>
    <p>${validator.escape(message).replace(/\n/g, "<br>")}</p>
  `,
    });
    if (error) {
      const logMessage = `❌ Resend error: ${JSON.stringify(error)}`;
      await serverLogging(logMessage);
      return response.status(500).json({
        status: "error",
        message: "An error occurred while sending the email!",
      });
    }
    const logMessage = `✅ Email sent. site=${site}, resendId=${data.id}`;
    await serverLogging(logMessage);
    response.json({ status: "success", message: "Email has sent!" });
  } catch (error) {
    const logMessage = `❌ Email sending error: ${error}.`;
    await serverLogging(logMessage);
    response.status(500).json({
      status: "error",
      message: "An error occurred while sending the email!",
    });
  }
});

/*-------------------------------*/
/*SERVER LISTENING*/
/*-------------------------------*/
const contactServer = server.listen(port);
contactServer.on("listening", async () => {
  const logMessage = `✅ The server is listening on port ${port}.`;
  await serverLogging(logMessage);
});

/*-------------------------------*/
/*SERVER ERROR HANDLING*/
/*-------------------------------*/
contactServer.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`❌ Port ${port} is already in use.`);
  } else if (error.code === "EACCES") {
    console.error(`❌ No permission to bind to port ${port}.`);
  } else {
    console.error(`❌ Server error: ${error.message}`);
  }
  process.exit(1);
});

/*-------------------------------*/
/*SERVER GRACEFUL SHUTDOWN*/
/*-------------------------------*/
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  contactServer.close(() => process.exit(0));
});
