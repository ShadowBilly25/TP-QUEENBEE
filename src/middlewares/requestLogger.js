// Une ligne par requête : date, méthode, URL complète, statut, durée.
// "finish" est émis une seule fois par réponse, quand elle est entièrement envoyée.
export function requestLogger(req, res, next) {
  const debut = process.hrtime.bigint();

  res.on("finish", () => {
    const duree = Number(process.hrtime.bigint() - debut) / 1e6;
    console.log(
      `${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${duree.toFixed(1)} ms`
    );
  });

  next();
}
