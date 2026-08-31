// ======================================================
// CONFIGURAZIONE SUPABASE
// ======================================================

const SUPABASE_URL =
    "https://gsokxkjrodcuwqxsybje.supabase.co";


const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_qrnRxLCNWSRVxwsDui7_7Q_iiiJ53aa";


const client =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );



// ======================================================
// ELEMENTI LOGIN
// ======================================================

const loginView =
    document.getElementById("loginView");

const appView =
    document.getElementById("appView");

const loginForm =
    document.getElementById("loginForm");

const loginMessage =
    document.getElementById("loginMessage");

const userEmail =
    document.getElementById("userEmail");

const logoutBtn =
    document.getElementById("logoutBtn");



// ======================================================
// ELEMENTI DATI
// ======================================================

const dataForm =
    document.getElementById("dataForm");

const dataMessage =
    document.getElementById("dataMessage");

const dataList =
    document.getElementById("dataList");

const refreshBtn =
    document.getElementById("refreshBtn");



// ======================================================
// ELEMENTI MODIFICA
// ======================================================

const editModal =
    document.getElementById("editModal");

const editForm =
    document.getElementById("editForm");

const editNome =
    document.getElementById("editNome");

const editInformazioni =
    document.getElementById("editInformazioni");

const editMessage =
    document.getElementById("editMessage");

const closeModalBtn =
    document.getElementById("closeModalBtn");

const cancelEditBtn =
    document.getElementById("cancelEditBtn");


// ID del dato che stiamo modificando

let editingId = null;



// ======================================================
// FUNZIONE MESSAGGI
// ======================================================

function showMessage(element, text) {

    element.textContent = text;

}



// ======================================================
// CARICA I DATI
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

        showMessage(
            dataMessage,
            "Errore nel caricamento: " +
            error.message
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

        // Contenitore

        const item =
            document.createElement("article");

        item.className =
            "data-item";


        // Nome

        const title =
            document.createElement("h3");

        title.textContent =
            row.nome;


        // Informazioni

        const information =
            document.createElement("p");

        information.textContent =
            row.informazioni || "";


        // Pulsanti

        const actions =
            document.createElement("div");

        actions.className =
            "actions";


        // ------------------------------
        // MODIFICA
        // ------------------------------

        const editButton =
            document.createElement("button");

        editButton.type =
            "button";

        editButton.className =
            "edit";

        editButton.textContent =
            "✏️ Modifica";


        editButton.addEventListener(
            "click",
            () => openEditModal(row)
        );


        // ------------------------------
        // ELIMINA
        // ------------------------------

        const deleteButton =
            document.createElement("button");

        deleteButton.type =
            "button";

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
// APRI FINESTRA MODIFICA
// ======================================================

function openEditModal(row) {

    editingId =
        row.id;


    editNome.value =
        row.nome || "";


    editInformazioni.value =
        row.informazioni || "";


    showMessage(
        editMessage,
        ""
    );


    editModal.classList.remove(
        "hidden"
    );


    editNome.focus();

}



// ======================================================
// CHIUDI FINESTRA MODIFICA
// ======================================================

function closeEditModal() {

    editingId =
        null;


    editForm.reset();


    showMessage(
        editMessage,
        ""
    );


    editModal.classList.add(
        "hidden"
    );

}



// ======================================================
// PULSANTI CHIUSURA
// ======================================================

closeModalBtn.addEventListener(
    "click",
    closeEditModal
);


cancelEditBtn.addEventListener(
    "click",
    closeEditModal
);



// ======================================================
// CHIUDI CLICCANDO FUORI DALLA FINESTRA
// ======================================================

editModal.addEventListener(
    "click",
    event => {

        if (
            event.target === editModal
        ) {

            closeEditModal();

        }

    }
);



// ======================================================
// SALVA MODIFICA
// ======================================================

editForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (!editingId) {

            return;
        }


        const nome =
            editNome.value.trim();


        const informazioni =
            editInformazioni.value.trim();


        if (!nome) {

            showMessage(
                editMessage,
                "Il nome è obbligatorio."
            );

            return;
        }


        showMessage(
            editMessage,
            "Salvataggio..."
        );


        const {
            error
        } = await client

            .from("dati_personali")

            .update({

                nome:
                    nome,

                informazioni:
                    informazioni

            })

            .eq(
                "id",
                editingId
            );


        if (error) {

            showMessage(
                editMessage,
                "Errore: " +
                error.message
            );

            return;
        }


        closeEditModal();


        showMessage(
            dataMessage,
            "Modifica salvata! ✅"
        );


        await loadData();

    }
);



// ======================================================
// ELIMINA DATO
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
            "Errore: " +
            error.message
        );

        return;
    }


    showMessage(
        dataMessage,
        "Dato eliminato! ✅"
    );


    await loadData();

}



// ======================================================
// LOGIN
// ======================================================

loginForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        showMessage(
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

            email:
                email,

            password:
                password

        });


        if (error) {

            showMessage(
                loginMessage,
                "Accesso non riuscito: " +
                error.message
            );

            return;
        }


        loginForm.reset();


        showMessage(
            loginMessage,
            ""
        );


        await updateInterface();

    }
);



// ======================================================
// AGGIUNGI DATO
// ======================================================

dataForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        showMessage(
            dataMessage,
            "Salvataggio..."
        );


        const {
            data: {
                user
            }
        } =
            await client.auth.getUser();


        if (!user) {

            showMessage(
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

                nome:
                    nome,

                informazioni:
                    informazioni,

                user_id:
                    user.id

            });


        if (error) {

            showMessage(
                dataMessage,
                "Errore: " +
                error.message
            );

            return;
        }


        dataForm.reset();


        showMessage(
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
// INTERFACCIA
// ======================================================

async function updateInterface() {

    const {
        data: {
            session
        }
    } =
        await client.auth.getSession();


    if (
        session &&
        session.user
    ) {

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
// CAMBIO SESSIONE
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