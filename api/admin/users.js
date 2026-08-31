export default async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({
      error: "Configurazione server mancante"
    });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Non autenticato"
    });
  }

  const accessToken = authHeader.substring(7);

  try {
    // 1. Verifica l'utente che sta facendo la richiesta
    const userResponse = await fetch(
      `${supabaseUrl}/auth/v1/user`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: serviceKey
        }
      }
    );

    if (!userResponse.ok) {
      return res.status(401).json({
        error: "Sessione non valida"
      });
    }

    const currentUser = await userResponse.json();

    // 2. Controlla che sia ADMIN
    const profileResponse = await fetch(
      `${supabaseUrl}/rest/v1/profili?id=eq.${currentUser.id}&select=ruolo,attivo`,
      {
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey
        }
      }
    );

    const profiles = await profileResponse.json();
    const profile = profiles[0];

    if (
      !profile ||
      profile.ruolo !== "admin" ||
      profile.attivo !== true
    ) {
      return res.status(403).json({
        error: "Accesso riservato all'amministratore"
      });
    }

    // 3. GET = elenco utenti
    if (req.method === "GET") {
      const usersResponse = await fetch(
        `${supabaseUrl}/auth/v1/admin/users`,
        {
          headers: {
            Authorization: `Bearer ${serviceKey}`,
            apikey: serviceKey
          }
        }
      );

      const data = await usersResponse.json();

      if (!usersResponse.ok) {
        return res.status(usersResponse.status).json(data);
      }

      return res.status(200).json(data);
    }

    return res.status(405).json({
      error: "Metodo non consentito"
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Errore interno del server"
    });
  }
}
