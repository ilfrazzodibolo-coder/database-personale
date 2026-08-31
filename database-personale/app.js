// ======================================================
// CONFIGURAZIONE SUPABASE
// ======================================================

const SUPABASE_URL =
    "https://gsokxkjrodcuwqxsybje.supabase.co";


const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_qrnRxLCNWSRVxwsDui7_7Q_iiiJ53aa";


// Creazione del client Supabase

const client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);



// ======================================================
// ELEMENTI HTML
// ======================================================

const loginView =
    document.getElementById("loginView");

const appView =
    document.getElementById("appView");

const loginForm =
    document.getElementById("loginForm");

const dataForm =
    document.getElementById("dataForm");

const loginMessage =
    document.getElementById("loginMessage");

const dataMessage =
    document.getElementById("dataMessage");

const dataList =
    document.getElementById("dataList");

const userEmail =
    document.getElementById("userEmail");

const logoutBtn =
    document.getElementById("logoutBtn");

const refreshBtn =
    document.getElementById("refreshBtn");



// ======================================================
// MESSAGGI
// ======================================================

function message(element, text) {

    element.textContent = text;

}



// ======================================================
// CARICAMENTO DATI
// ======================================================

async function loadData() {

    dataList.innerHTML =
        "<p class='loading'>Caricamento...</p>";


    const {

        data,

        error

    } = await client

        .from("dati_personali")

        .select(
            "id, nome, informazioni, user_id"
        )

        .order(
            "id",
            {
                ascending: false
            }
        );


    if (error) {

        dataList.innerHTML = "";

        message(
            dataMessage,
            "Errore: " + error.message
        );

        return;
    }


    if (!data || data.length === 0) {

        dataList.innerHTML =
            "<p class='loading'>Nessun dato presente.</p>";

        return;
    }


    dataList.innerHTML = "";


    data.forEach(row => {

        const item =
            document.createElement("article");

        item.className =
            "data-item";


        const title =
            document.createElement("h3");

        title.textContent =
            row.nome;


        const information =
            document.createElement("p");

        information.textContent =
            row.informazioni || "";


        const actions =
            document.createElement("div");

        actions.className =
            "actions";


        // Pulsante modifica

        const editButton =
            document.createElement("button");

        editButton.className =
            "edit";

        editButton.textContent =
            "✏️ Modifica";


        editButton.addEventListener(
            "click",
            () => editData(row)
        );


        // Pulsante elimina

        const deleteButton =
            document.createElement("button");

        deleteButton.className =
            "delete";

        deleteButton.textContent =
            "🗑️ Elimina";


        deleteButton.addEventListener(
            "click",
            () => deleteData(row.id)
        );


        actions.append(
            editButton,
            deleteButton
        );


        item.append(
            title,
            information,
            actions
        );


        dataList.appendChild(item);

    });

}



// ======================================================
// MODIFICA DATI
// ======================================================

async function editData(row) {

    const newName =
        prompt(
            "Inserisci il nuovo nome:",
            row.nome
        );


    if (newName === null) {

        return;
    }


    const newInformation =
        prompt(
            "Inserisci le nuove informazioni:",
            row.informazioni || ""
        );


    if (newInformation === null) {

        return;
    }


    const {

        error

    } = await client

        .from("dati_personali")

        .update({

            nome: newName,

            informazioni: newInformation

        })

        .eq(
            "id",
            row.id
        );


    if (error) {

        alert(
            "Errore: " + error.message
        );

        return;
    }


    await loadData();

}



// ======================================================
// ELIMINA DATI
// ======================================================

async function deleteData(id) {

    const confirmation =
        confirm(
            "Vuoi eliminare definitivamente questo dato?"
        );


    if (!confirmation) {

        return;
    }


    const {

        error

    } = await client

        .from("dati_personali")

        .delete()

        .eq(
            "id",
            id
        );


    if (error) {

        alert(
            "Errore: " + error.message
        );

        return;
    }


    await loadData();

}



// ======================================================
// LOGIN
// ======================================================

loginForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        message(
            loginMessage,
            "Accesso in corso..."
        );


        const email =
            document
                .getElementById("email")
                .value
                .trim();


        const password =
            document
                .getElementById("password")
                .value;


        const {

            error

        } = await client.auth.signInWithPassword({

            email: email,

            password: password

        });


        if (error) {

            message(
                loginMessage,
                "Accesso non riuscito: " +
                error.message
            );

            return;
        }


        loginForm.reset();


        message(
            loginMessage,
            ""
        );


        await updateInterface();

    }
);



// ======================================================
// AGGIUNTA DATI
// ======================================================

dataForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        message(
            dataMessage,
            "Salvataggio..."
        );


        const {

            data: {
                user
            }

        } = await client.auth.getUser();


        if (!user) {

            message(
                dataMessage,
                "Sessione scaduta. Effettua nuovamente il login."
            );

            return;
        }


        const nome =
            document
                .getElementById("nome")
                .value
                .trim();


        const informazioni =
            document
                .getElementById("informazioni")
                .value
                .trim();


        const {

            error

        } = await client

            .from("dati_personali")

            .insert({

                nome: nome,

                informazioni: informazioni,

                user_id: user.id

            });


        if (error) {

            message(
                dataMessage,
                "Errore: " + error.message
            );

            return;
        }


        dataForm.reset();


        message(
            dataMessage,
            "Dato salvato! ✅"
        );


        await loadData();

    }
);



// ======================================================
// LOGOUT
// ======================================================

logoutBtn.addEventListener(
    "click",
    async () => {

        await client.auth.signOut();

        await updateInterface();

    }
);



// ======================================================
// AGGIORNA
// ======================================================

refreshBtn.addEventListener(
    "click",
    loadData
);



// ======================================================
// AGGIORNA INTERFACCIA
// ======================================================

async function updateInterface() {

    const {

        data: {
            session
        }

    } = await client.auth.getSession();


    if (session && session.user) {

        loginView.classList.add(
            "hidden"
        );


        appView.classList.remove(
            "hidden"
        );


        userEmail.textContent =
            session.user.email || "";


        await loadData();

    }

    else {

        appView.classList.add(
            "hidden"
        );


        loginView.classList.remove(
            "hidden"
        );

    }

}



// ======================================================
// CONTROLLO LOGIN
// ======================================================

client.auth.onAuthStateChange(
    () => {

        updateInterface();

    }
);



// ======================================================
// AVVIO
// ======================================================

updateInterface();