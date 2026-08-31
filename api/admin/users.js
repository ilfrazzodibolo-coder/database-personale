// ======================================================
// API ADMIN - GESTIONE UTENTI
// ======================================================

const { createClient } = require("@supabase/supabase-js");

// ======================================================
// CONFIGURAZIONE
// ======================================================

const SUPABASE_URL = process.env.SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

const SUPABASE_PUBLISHABLE_KEY =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY;

if (
    !SUPABASE_URL ||
    !SUPABASE_SERVICE_ROLE_KEY
) {
    throw new Error(
        "Variabili Supabase mancanti."
    );
}

if (!SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY mancante."
    );
}

// ======================================================
// CLIENT ADMIN
// ======================================================

const supabaseAdmin =
    createClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

// ======================================================
// FUNZIONE PRINCIPALE
// ======================================================

module.exports = async function handler(req, res) {

    // ==================================================
    // METODO
    // ==================================================

    if (
        req.method !== "GET" &&
        req.method !== "POST"
    ) {

        return res.status(405).json({
            error: "Metodo non consentito."
        });

    }

    try {

        // ==================================================
        // CONTROLLO TOKEN
        // ==================================================

        const authorization =
            req.headers.authorization || "";

        if (
            !authorization.startsWith("Bearer ")
        ) {

            return res.status(401).json({
                error: "Autenticazione richiesta."
            });

        }

        const token =
            authorization.substring(7);

        if (!token) {

            return res.status(401).json({
                error: "Token mancante."
            });

        }

        // ==================================================
        // CLIENT SUPABASE UTENTE
        // ==================================================

        const supabaseUser =
            createClient(
                SUPABASE_URL,
                SUPABASE_PUBLISHABLE_KEY,
                {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false
                    }
                }
            );

        // ==================================================
        // VERIFICA UTENTE
        // ==================================================

        const {
            data: userData,
            error: userError
        } =
            await supabaseUser.auth.getUser(token);

        const user =
            userData?.user;

        if (
            userError ||
            !user
        ) {

            console.error(
                "Errore autenticazione:",
                userError
            );

            return res.status(401).json({
                error: "Sessione non valida."
            });

        }

        // ==================================================
        // CONTROLLO PROFILO ADMIN
        // ==================================================

        const {
            data: profile,
            error: profileError
        } =
            await supabaseAdmin
                .from("profili")
                .select(
                    "id, email, ruolo, attivo"
                )
                .eq(
                    "id",
                    user.id
                )
                .maybeSingle();

        if (profileError) {

            console.error(
                "Errore profilo:",
                profileError
            );

            return res.status(500).json({
                error:
                    "Errore nel controllo del profilo."
            });

        }

        if (
            !profile ||
            profile.ruolo !== "admin" ||
            profile.attivo !== true
        ) {

            return res.status(403).json({
                error:
                    "Non hai i permessi di amministratore."
            });

        }

        // ==================================================
        // GET - ELENCO UTENTI
        // ==================================================

        if (req.method === "GET") {

            const {
                data,
                error
            } =
                await supabaseAdmin.auth.admin
                    .listUsers({
                        page: 1,
                        perPage: 1000
                    });

            if (error) {

                console.error(
                    "Errore elenco utenti:",
                    error
                );

                return res.status(500).json({
                    error:
                        "Impossibile caricare gli utenti."
                });

            }

            return res.status(200).json({

                users:
                    (data?.users || []).map(
                        user => ({

                            id:
                                user.id,

                            email:
                                user.email,

                            email_confirmed_at:
                                user.email_confirmed_at,

                            created_at:
                                user.created_at,

                            last_sign_in_at:
                                user.last_sign_in_at

                        })
                    )

            });

        }

        // ==================================================
        // POST - CREA UTENTE
        // ==================================================

        if (req.method === "POST") {

            const body =
                req.body || {};

            if (
                body.action !== "create"
            ) {

                return res.status(400).json({
                    error:
                        "Azione non valida."
                });

            }

            const email =
                String(
                    body.email || ""
                )
                .trim()
                .toLowerCase();

            const password =
                String(
                    body.password || ""
                );

            if (
                !email ||
                !password
            ) {

                return res.status(400).json({
                    error:
                        "Email e password sono obbligatorie."
                });

            }

            if (
                password.length < 6
            ) {

                return res.status(400).json({
                    error:
                        "La password deve contenere almeno 6 caratteri."
                });

            }

            // ==================================================
            // CREA ACCOUNT SUPABASE
            // ==================================================

            const {
                data,
                error
            } =
                await supabaseAdmin.auth.admin
                    .createUser({

                        email:
                            email,

                        password:
                            password,

                        email_confirm:
                            true

                    });

            if (error) {

                console.error(
                    "Errore creazione utente:",
                    error
                );

                return res.status(400).json({
                    error:
                        error.message
                });

            }

            // ==================================================
            // CREA PROFILO
            // ==================================================

            const {
                error: profileInsertError
            } =
                await supabaseAdmin
                    .from("profili")
                    .insert({

                        id:
                            data.user.id,

                        email:
                            email,

                        ruolo:
                            "utente",

                        attivo:
                            true

                    });

            if (profileInsertError) {

                console.error(
                    "Errore creazione profilo:",
                    profileInsertError
                );

                // Elimina l'account se il profilo
                // non viene creato correttamente.

                await supabaseAdmin.auth.admin
                    .deleteUser(
                        data.user.id
                    );

                return res.status(500).json({
                    error:
                        "Account creato ma impossibile creare il profilo."
                });

            }

            // ==================================================
            // RISPOSTA
            // ==================================================

            return res.status(201).json({

                success:
                    true,

                message:
                    "Account creato correttamente.",

                user: {

                    id:
                        data.user.id,

                    email:
                        data.user.email

                }

            });

        }

    } catch (error) {

        console.error(
            "Errore API admin:",
            error
        );

        return res.status(500).json({

            error:
                error.message ||
                "Errore interno del server."

        });

    }

};
