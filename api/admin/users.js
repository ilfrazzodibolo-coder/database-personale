import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
    process.env.SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY;


// Client ADMIN
// Questa chiave rimane SOLO sul server Vercel.
// NON inserirla mai in app.js.

const adminClient =
    createClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY
    );


// ======================================================
// FUNZIONE PRINCIPALE
// ======================================================

export default async function handler(
    req,
    res
) {

    try {

        // --------------------------------------------------
        // Controlla metodo
        // --------------------------------------------------

        if (
            ![
                "GET",
                "POST",
                "DELETE",
                "PATCH"
            ].includes(req.method)
        ) {

            return res
                .status(405)
                .json({
                    error:
                        "Metodo non consentito."
                });

        }


        // --------------------------------------------------
        // Recupera token dell'utente
        // --------------------------------------------------

        const authorization =
            req.headers.authorization;


        if (
            !authorization ||
            !authorization.startsWith(
                "Bearer "
            )
        ) {

            return res
                .status(401)
                .json({
                    error:
                        "Token mancante."
                });

        }


        const token =
            authorization.replace(
                "Bearer ",
                ""
            );


        // --------------------------------------------------
        // Verifica l'utente
        // --------------------------------------------------

        const {
            data: {
                user
            },
            error: userError
        } =
            await adminClient.auth.getUser(
                token
            );


        if (
            userError ||
            !user
        ) {

            return res
                .status(401)
                .json({
                    error:
                        "Sessione non valida."
                });

        }


        // --------------------------------------------------
        // Controlla che sia ADMIN
        // --------------------------------------------------

        const {
            data: profile,
            error: profileError
        } =
            await adminClient
                .from("profili")
                .select(
                    "id, ruolo, attivo"
                )
                .eq(
                    "id",
                    user.id
                )
                .maybeSingle();


        if (
            profileError
        ) {

            console.error(
                profileError
            );

            return res
                .status(500)
                .json({
                    error:
                        "Impossibile verificare i permessi."
                });

        }


        if (
            !profile ||
            profile.ruolo !== "admin" ||
            profile.attivo !== true
        ) {

            return res
                .status(403)
                .json({
                    error:
                        "Non hai i permessi di amministratore."
                });

        }


        // ==================================================
        // GET → ELENCO UTENTI
        // ==================================================

        if (
            req.method === "GET"
        ) {

            const {
                data,
                error
            } =
                await adminClient.auth.admin
                    .listUsers({
                        page: 1,
                        perPage: 1000
                    });


            if (error) {

                return res
                    .status(500)
                    .json({
                        error:
                            error.message
                    });

            }


            return res
                .status(200)
                .json({
                    users:
                        data.users
                });

        }


        // ==================================================
        // POST → CREA UTENTE
        // ==================================================

        if (
            req.method === "POST"
        ) {

            const {
                action,
                email,
                password
            } =
                req.body || {};


            if (
                action !== "create"
            ) {

                return res
                    .status(400)
                    .json({
                        error:
                            "Azione non valida."
                    });

            }


            if (
                !email ||
                !password
            ) {

                return res
                    .status(400)
                    .json({
                        error:
                            "Email e password sono obbligatorie."
                    });

            }


            if (
                password.length < 6
            ) {

                return res
                    .status(400)
                    .json({
                        error:
                            "La password deve contenere almeno 6 caratteri."
                    });

            }


            const {
                data,
                error
            } =
                await adminClient.auth.admin
                    .createUser({

                        email:
                            email,

                        password:
                            password,

                        email_confirm:
                            true

                    });


            if (error) {

                return res
                    .status(400)
                    .json({
                        error:
                            error.message
                    });

            }


            // Crea anche il profilo
            // dell'utente

            if (
                data.user
            ) {

                await adminClient
                    .from("profili")
                    .upsert({

                        id:
                            data.user.id,

                        email:
                            email,

                        ruolo:
                            "utente",

                        attivo:
                            true

                    });

            }


            return res
                .status(201)
                .json({

                    success:
                        true,

                    user:
                        data.user

                });

        }


        // ==================================================
        // DELETE → ELIMINA UTENTE
        // ==================================================

        if (
            req.method === "DELETE"
        ) {

            const userId =
                req.body?.userId;


            if (
                !userId
            ) {

                return res
                    .status(400)
                    .json({
                        error:
                            "ID utente mancante."
                    });

            }


            // Impedisce all'admin
            // di eliminare se stesso

            if (
                userId === user.id
            ) {

                return res
                    .status(400)
                    .json({
                        error:
                            "Non puoi eliminare il tuo stesso account."
                    });

            }


            const {
                error
            } =
                await adminClient.auth.admin
                    .deleteUser(
                        userId
                    );


            if (error) {

                return res
                    .status(400)
                    .json({
                        error:
                            error.message
                    });

            }


            // Elimina anche il profilo

            await adminClient
                .from("profili")
                .delete()
                .eq(
                    "id",
                    userId
                );


            return res
                .status(200)
                .json({

                    success:
                        true

                });

        }


        // ==================================================
        // PATCH → ATTIVA / DISATTIVA UTENTE
        // ==================================================

        if (
            req.method === "PATCH"
        ) {

            const {
                userId,
                attivo
            } =
                req.body || {};


            if (
                !userId ||
                typeof attivo !==
                    "boolean"
            ) {

                return res
                    .status(400)
                    .json({
                        error:
                            "Dati non validi."
                    });

            }


            // Non permettere
            // di disattivare se stesso

            if (
                userId === user.id
            ) {

                return res
                    .status(400)
                    .json({
                        error:
                            "Non puoi disattivare il tuo stesso account."
                    });

            }


            const {
                error
            } =
                await adminClient
                    .from("profili")
                    .update({

                        attivo:
                            attivo

                    })
                    .eq(
                        "id",
                        userId
                    );


            if (error) {

                return res
                    .status(400)
                    .json({
                        error:
                            error.message
                    });

            }


            return res
                .status(200)
                .json({

                    success:
                        true,

                    attivo:
                        attivo

                });

        }

    } catch (error) {

        console.error(
            "Errore API admin:",
            error
        );


        return res
            .status(500)
            .json({

                error:
                    error.message ||
                    "Errore interno del server."

            });

    }

}
