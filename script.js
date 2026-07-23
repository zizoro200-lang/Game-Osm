// ============================
// SUPABASE
// ============================

const SUPABASE_URL =
    "https://mcvoliwjegewtulkeaey.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_1eQuNUBJ_4Z4sGBAqwTpQA_XfXUrhJE";

const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ============================
// VARIABLES
// ============================

let tournaments = [];
let selectedTournament = null;
let currentUser = null;
let authMode = "login";


// ============================
// AUTH MODAL
// ============================

function openAuthModal(mode = "login") {

    authMode = mode;

    updateAuthUI();

    document
        .getElementById("authModal")
        .classList.add("active");

    document
        .getElementById("authError")
        .style.display = "none";

}


function closeAuthModal() {

    document
        .getElementById("authModal")
        .classList.remove("active");

    document
        .getElementById("authForm")
        .reset();

    document
        .getElementById("authError")
        .style.display = "none";

}


function toggleAuthMode() {

    authMode =
        authMode === "login"
            ? "signup"
            : "login";

    updateAuthUI();

}


function updateAuthUI() {

    const title =
        document.getElementById("authTitle");

    const subtitle =
        document.getElementById("authSubtitle");

    const submitButton =
        document.getElementById("authSubmitButton");

    const switchText =
        document.getElementById("authSwitchText");

    const switchButton =
        document.getElementById("authSwitchButton");

    const passwordInput =
        document.getElementById("authPassword");


    if (authMode === "login") {

        title.textContent =
            "تسجيل الدخول";

        subtitle.textContent =
            "سجل دخولك للانضمام إلى البطولات";

        submitButton.textContent =
            "تسجيل الدخول";

        switchText.textContent =
            "ليس لديك حساب؟";

        switchButton.textContent =
            "إنشاء حساب";

        passwordInput.autocomplete =
            "current-password";

    } else {

        title.textContent =
            "إنشاء حساب";

        subtitle.textContent =
            "أنشئ حسابك وابدأ المنافسة";

        submitButton.textContent =
            "إنشاء حساب";

        switchText.textContent =
            "لديك حساب بالفعل؟";

        switchButton.textContent =
            "تسجيل الدخول";

        passwordInput.autocomplete =
            "new-password";

    }

}


// ============================
// HANDLE AUTH
// ============================

async function handleAuth(event) {

    event.preventDefault();

    const email =
        document
            .getElementById("authEmail")
            .value
            .trim();

    const password =
        document
            .getElementById("authPassword")
            .value;

    const errorElement =
        document.getElementById("authError");

    const submitButton =
        document.getElementById(
            "authSubmitButton"
        );


    errorElement.style.display =
        "none";


    if (!email || !password) {

        errorElement.textContent =
            "من فضلك أكمل جميع البيانات.";

        errorElement.style.display =
            "block";

        return;

    }


    if (password.length < 6) {

        errorElement.textContent =
            "كلمة المرور يجب أن تكون 6 أحرف على الأقل.";

        errorElement.style.display =
            "block";

        return;

    }


    submitButton.disabled =
        true;


    submitButton.textContent =
        authMode === "login"
            ? "جاري تسجيل الدخول..."
            : "جاري إنشاء الحساب...";


    let result;


    try {

        if (authMode === "login") {

            result =
                await supabaseClient.auth.signInWithPassword({

                    email:
                        email,

                    password:
                        password

                });

        } else {

            result =
                await supabaseClient.auth.signUp({

                    email:
                        email,

                    password:
                        password

                });

        }


    } catch (error) {

        console.error(
            "Auth error:",
            error
        );

        errorElement.textContent =
            "حدث خطأ غير متوقع ❌";

        errorElement.style.display =
            "block";

        submitButton.disabled =
            false;

        updateAuthUI();

        return;

    }


    submitButton.disabled =
        false;

    updateAuthUI();


    if (result.error) {

        console.error(
            "Auth error:",
            result.error
        );

        errorElement.textContent =
            getAuthErrorMessage(
                result.error
            );

        errorElement.style.display =
            "block";

        return;

    }


    if (authMode === "signup") {

        if (
            result.data.user &&
            !result.data.session
        ) {

            errorElement.textContent =
                "تم إنشاء الحساب بنجاح ✅ تحقق من بريدك الإلكتروني لتفعيل الحساب.";

            errorElement.style.display =
                "block";

            return;

        }

        showToast(
            "تم إنشاء الحساب بنجاح 🎉"
        );

    } else {

        showToast(
            "تم تسجيل الدخول بنجاح 👋"
        );

    }


    closeAuthModal();

    await updateUserUI();

    renderTournaments();

}


function getAuthErrorMessage(error) {

    const message =
        error?.message || "";


    if (
        message.includes(
            "Invalid login credentials"
        )
    ) {

        return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";

    }


    if (
        message.includes(
            "User already registered"
        )
    ) {

        return "هذا البريد الإلكتروني مسجل بالفعل.";

    }


    if (
        message.includes(
            "Password should be at least"
        )
    ) {

        return "كلمة المرور يجب أن تكون 6 أحرف على الأقل.";

    }


    if (
        message.includes(
            "Email not confirmed"
        )
    ) {

        return "يجب تأكيد بريدك الإلكتروني أولًا.";

    }


    return (
        message ||
        "حدث خطأ أثناء العملية."
    );

}


// ============================
// LOGOUT
// ============================

async function logoutUser() {

    const {
        error
    } =
        await supabaseClient.auth.signOut();


    if (error) {

        console.error(
            "Logout error:",
            error
        );

        showToast(
            "حدث خطأ أثناء تسجيل الخروج ❌"
        );

        return;

    }


    currentUser =
        null;


    showToast(
        "تم تسجيل الخروج 👋"
    );


    await updateUserUI();

    renderTournaments();

}


// ============================
// UPDATE USER UI
// ============================

async function updateUserUI() {

    const {
        data
    } =
        await supabaseClient.auth.getUser();


    currentUser =
        data?.user || null;


    const loginButton =
        document.getElementById(
            "loginNavButton"
        );

    const signupButton =
        document.getElementById(
            "signupNavButton"
        );

    const userArea =
        document.getElementById(
            "userArea"
        );

    const userEmail =
        document.getElementById(
            "userEmail"
        );


    if (!loginButton) {

        return;

    }


    if (currentUser) {

        loginButton.style.display =
            "none";

        signupButton.style.display =
            "none";

        userArea.style.display =
            "flex";

        userEmail.textContent =
            currentUser.email || "";

    } else {

        loginButton.style.display =
            "inline-flex";

        signupButton.style.display =
            "inline-flex";

        userArea.style.display =
            "none";

        userEmail.textContent =
            "";

    }

}


// ============================
// LOAD TOURNAMENTS
// ============================

async function loadTournaments() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("tournaments")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Error loading tournaments:",
            error
        );

        showToast(
            "حدث خطأ أثناء تحميل البطولات ❌"
        );

        return;

    }


    tournaments =
        (data || []).map(
            tournament => ({

                id:
                    tournament.id,

                name:
                    tournament.name,

                description:
                    tournament.description || "",

                type:
                    tournament.tournament_type ||
                    "open",

                reward:
                    tournament.reward_coins || 0,

                minLevel:
                    tournament.min_level,

                maxLevel:
                    tournament.max_level,

                groupUrl:
                    tournament.group_url,

                ownerId:
                    tournament.owner_id ||
                    null,

                createdAt:
                    tournament.created_at

            })
        );


    renderTournaments();

}


// ============================
// RENDER TOURNAMENTS
// ============================

function renderTournaments(
    list = tournaments
) {

    const grid =
        document.getElementById(
            "tournamentsGrid"
        );

    const empty =
        document.getElementById(
            "emptyState"
        );

    const count =
        document.getElementById(
            "tournamentCount"
        );


    if (!grid) {

        return;

    }


    grid.innerHTML =
        "";


    count.textContent =
        list.length;


    if (
        list.length === 0
    ) {

        empty.style.display =
            "block";

        return;

    }


    empty.style.display =
        "none";


    list.forEach(
        tournament => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "tournament-card";


            const reward =
                tournament.reward > 0

                    ? `🏆 ${tournament.reward} Coins`

                    : "🎁 بدون جائزة";


            const tournamentType =
                tournament.type === "private"

                    ? "🔒 خاصة"

                    : "🟢 مفتوحة";


            const joinText =
                tournament.type === "private"

                    ? "طلب الانضمام"

                    : "انضم للبطولة";


            const isOwner =
                currentUser &&
                tournament.ownerId &&
                tournament.ownerId ===
                currentUser.id;


            card.innerHTML = `

                <div class="card-top">

                    <div class="card-title">

                        ${escapeHTML(
                            tournament.name
                        )}

                    </div>


                    <div class="level-badge">

                        Level
                        ${tournament.minLevel}
                        -
                        ${tournament.maxLevel}

                    </div>

                </div>


                <p class="card-description">

                    ${escapeHTML(
                        tournament.description
                    )}

                </p>


                <div class="card-info">

                    <span>

                        ${reward}

                    </span>


                    <span>

                        ${tournamentType}

                    </span>

                </div>


                <div class="card-actions">

                    <button

                        class="join-button"

                        onclick="openJoinModal(${tournament.id})"

                    >

                        ${joinText}

                    </button>


                    <button

                        class="details-button"

                        onclick="openDetailsModal(${tournament.id})"

                    >

                        التفاصيل

                    </button>


                    ${
                        isOwner
                            ? `
                                <button

                                    class="manage-button"

                                    onclick="openManageTournamentModal(${tournament.id})"

                                >

                                    إدارة

                                </button>
                            `
                            : ""
                    }

                </div>

            `;


            grid.appendChild(
                card
            );

        }
    );

}


// ============================
// CREATE TOURNAMENT
// ============================

async function createTournament(
    event
) {

    event.preventDefault();


    if (!currentUser) {

        showToast(
            "يجب تسجيل الدخول أولًا 🔐"
        );

        openAuthModal(
            "login"
        );

        return;

    }


    const name =
        document
            .getElementById(
                "tournamentName"
            )
            .value
            .trim();


    const description =
        document
            .getElementById(
                "tournamentDescription"
            )
            .value
            .trim();


    const tournamentType =
        document
            .getElementById(
                "tournamentType"
            )
            .value;


    const reward =
        Number(
            document
                .getElementById(
                    "rewardCoins"
                )
                .value
        ) || 0;


    const minLevel =
        Number(
            document
                .getElementById(
                    "minLevel"
                )
                .value
        );


    const maxLevel =
        Number(
            document
                .getElementById(
                    "maxLevel"
                )
                .value
        );


    const groupUrl =
        document
            .getElementById(
                "groupUrl"
            )
            .value
            .trim();


    if (
        !name ||
        !description ||
        !groupUrl
    ) {

        alert(
            "من فضلك أكمل جميع البيانات."
        );

        return;

    }


    if (
        minLevel > maxLevel
    ) {

        alert(
            "أقل Level يجب أن يكون أصغر من أو يساوي أعلى Level."
        );

        return;

    }


    if (
        minLevel < 1 ||
        maxLevel > 10
    ) {

        alert(
            "الـ Level يجب أن يكون من 1 إلى 10."
        );

        return;

    }


    if (
        reward < 0
    ) {

        alert(
            "الجائزة لا يمكن أن تكون سالبة."
        );

        return;

    }


    const {
        error
    } =
        await supabaseClient
            .from("tournaments")
            .insert({

                name:
                    name,

                description:
                    description,

                tournament_type:
                    tournamentType,

                reward_coins:
                    reward,

                min_level:
                    minLevel,

                max_level:
                    maxLevel,

                group_url:
                    groupUrl,

                owner_id:
                    currentUser.id

            });


    if (error) {

        console.error(
            "Create tournament error:",
            error
        );

        alert(
            "حدث خطأ أثناء إنشاء البطولة ❌"
        );

        return;

    }


    document
        .getElementById(
            "createTournamentForm"
        )
        .reset();


    updateTournamentTypeInfo();

    closeCreateModal();


    showToast(
        "تم إنشاء البطولة بنجاح 🎉"
    );


    await loadTournaments();

}


// ============================
// TOURNAMENT TYPE INFO
// ============================

function updateTournamentTypeInfo() {

    const type =
        document
            .getElementById(
                "tournamentType"
            )
            .value;


    const info =
        document
            .getElementById(
                "tournamentTypeInfo"
            );


    if (
        type === "private"
    ) {

        info.textContent =
            "🔒 اللاعب يرسل طلب انضمام، وصاحب البطولة يقرر قبوله أو رفضه.";

    } else {

        info.textContent =
            "🟢 أي لاعب يستوفي شروط الـ Level يمكنه الانضمام مباشرة.";

    }

}


// ============================
// OPEN JOIN MODAL
// ============================

function openJoinModal(
    id
) {

    if (!currentUser) {

        showToast(
            "يجب تسجيل الدخول أولًا 🔐"
        );

        openAuthModal(
            "login"
        );

        return;

    }


    selectedTournament =
        tournaments.find(
            tournament =>
                tournament.id === id
        );


    if (
        !selectedTournament
    ) {

        return;

    }


    document
        .getElementById(
            "joinTitle"
        )
        .textContent =
            selectedTournament.name;


    const typeElement =
        document.getElementById(
            "joinTournamentType"
        );


    const joinInfo =
        document.getElementById(
            "joinInfo"
        );


    const submitButton =
        document.getElementById(
            "joinSubmitButton"
        );


    if (
        selectedTournament.type ===
        "private"
    ) {

        typeElement.textContent =
            "🔒 بطولة خاصة";


        joinInfo.textContent =
            "🔒 هذه بطولة خاصة، سيتم إرسال طلبك إلى صاحب البطولة لمراجعته.";


        submitButton.textContent =
            "إرسال طلب الانضمام";

    } else {

        typeElement.textContent =
            "🟢 بطولة مفتوحة";


        joinInfo.textContent =
            "🟢 هذه بطولة مفتوحة، سيتم انضمامك مباشرة بعد التسجيل.";


        submitButton.textContent =
            "انضم للبطولة";

    }


    document
        .getElementById(
            "joinModal"
        )
        .classList
        .add("active");


    document
        .getElementById(
            "joinForm"
        )
        .style
        .display =
            "block";


    document
        .getElementById(
            "successMessage"
        )
        .style
        .display =
            "none";


    document
        .getElementById(
            "joinError"
        )
        .style
        .display =
            "none";


    document
        .getElementById(
            "joinForm"
        )
        .reset();

}


// ============================
// JOIN TOURNAMENT
// ============================

async function joinTournament(
    event
) {

    event.preventDefault();


    if (!currentUser) {

        showToast(
            "يجب تسجيل الدخول أولًا 🔐"
        );

        closeJoinModal();

        openAuthModal(
            "login"
        );

        return;

    }


    if (
        !selectedTournament
    ) {

        return;

    }


    const playerName =
        document
            .getElementById(
                "playerName"
            )
            .value
            .trim();


    const playerLevel =
        Number(
            document
                .getElementById(
                    "playerLevel"
                )
                .value
        );


    const error =
        document
            .getElementById(
                "joinError"
            );


    const submitButton =
        document
            .getElementById(
                "joinSubmitButton"
            );


    if (
        !playerName
    ) {

        error.textContent =
            "اكتب اسمك أولًا.";

        error.style.display =
            "block";

        return;

    }


    if (

        playerLevel <
        selectedTournament.minLevel

        ||

        playerLevel >
        selectedTournament.maxLevel

    ) {

        error.textContent =

            `❌ مستواك غير مناسب.
            البطولة تقبل من Level
            ${selectedTournament.minLevel}
            إلى Level
            ${selectedTournament.maxLevel}.`;


        error.style.display =
            "block";


        return;

    }


    error.style.display =
        "none";


    submitButton.disabled =
        true;


    submitButton.textContent =
        "جاري التسجيل...";


    // ============================
    // PRIVATE TOURNAMENT
    // ============================

    if (
        selectedTournament.type ===
        "private"
    ) {

        // منع إرسال طلب مكرر

        const {
            data: existingRequest
        } =
            await supabaseClient
                .from(
                    "tournament_requests"
                )
                .select("id,status")
                .eq(
                    "tournament_id",
                    selectedTournament.id
                )
                .eq(
                    "user_id",
                    currentUser.id
                )
                .maybeSingle();


        if (existingRequest) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                "إرسال طلب الانضمام";


            if (
                existingRequest.status ===
                "pending"
            ) {

                error.textContent =
                    "لقد أرسلت طلبًا بالفعل، وهو قيد المراجعة 📩";

            } else if (
                existingRequest.status ===
                "approved"
            ) {

                error.textContent =
                    "تم قبول طلبك بالفعل.";

            } else {

                error.textContent =
                    "تم رفض طلبك سابقًا.";

            }


            error.style.display =
                "block";

            return;

        }


        const {
            error: requestError
        } =
            await supabaseClient
                .from(
                    "tournament_requests"
                )
                .insert({

                    tournament_id:
                        selectedTournament.id,

                    player_name:
                        playerName,

                    player_level:
                        playerLevel,

                    status:
                        "pending",

                    user_id:
                        currentUser.id

                });


        if (
            requestError
        ) {

            console.error(
                requestError
            );


            submitButton.disabled =
                false;

            submitButton.textContent =
                "إرسال طلب الانضمام";


            error.textContent =
                "حدث خطأ أثناء إرسال طلب الانضمام ❌";


            error.style.display =
                "block";


            return;

        }


        document
            .getElementById(
                "joinForm"
            )
            .style
            .display =
                "none";


        document
            .getElementById(
                "successMessage"
            )
            .style
            .display =
                "block";


        document
            .getElementById(
                "successTitle"
            )
            .textContent =
            "تم إرسال طلبك 📩";


        document
            .getElementById(
                "successText"
            )
            .textContent =
            "طلبك الآن قيد المراجعة من صاحب البطولة.";


        document
            .getElementById(
                "groupLink"
            )
            .style
            .display =
                "none";


        return;

    }


    // ============================
    // OPEN TOURNAMENT
    // ============================

    // منع التسجيل المكرر

    const {
        data: existingParticipant
    } =
        await supabaseClient
            .from(
                "participants"
            )
            .select("id")
            .eq(
                "tournament_id",
                selectedTournament.id
            )
            .eq(
                "user_id",
                currentUser.id
            )
            .maybeSingle();


    if (existingParticipant) {

        submitButton.disabled =
            false;

        submitButton.textContent =
            "انضم للبطولة";


        error.textContent =
            "أنت مسجل بالفعل في هذه البطولة ✅";


        error.style.display =
            "block";

        return;

    }


    const {
        error: insertError
    } =
        await supabaseClient
            .from(
                "participants"
            )
            .insert({

                tournament_id:
                    selectedTournament.id,

                player_name:
                    playerName,

                player_level:
                    playerLevel,

                user_id:
                    currentUser.id

            });


    if (
        insertError
    ) {

        console.error(
            insertError
        );


        submitButton.disabled =
            false;

        submitButton.textContent =
            "انضم للبطولة";


        error.textContent =
            "حدث خطأ أثناء التسجيل ❌";


        error.style.display =
            "block";


        return;

    }


    document
        .getElementById(
            "joinForm"
        )
        .style
        .display =
            "none";


    document
        .getElementById(
            "successMessage"
        )
        .style
        .display =
            "block";


    document
        .getElementById(
            "successTitle"
        )
        .textContent =
            "تم قبولك! 🎉";


    document
        .getElementById(
            "successText"
        )
        .textContent =
            "يمكنك الآن الانضمام إلى جروب البطولة.";


    const groupLink =
        document.getElementById(
            "groupLink"
        );


    groupLink.href =
        selectedTournament.groupUrl;


    groupLink.style.display =
        "block";


    document
        .getElementById(
            "joinForm"
        )
        .reset();

}


// ============================
// SEARCH
// ============================

function searchTournaments() {

    const query =
        document
            .getElementById(
                "searchInput"
            )
            .value
            .toLowerCase()
            .trim();


    const filtered =
        tournaments.filter(
            tournament =>

                tournament.name
                    .toLowerCase()
                    .includes(
                        query
                    )

                ||

                tournament.description
                    .toLowerCase()
                    .includes(
                        query
                    )

        );


    renderTournaments(
        filtered
    );

}


// ============================
// CREATE MODAL
// ============================

function openCreateModal() {

    if (!currentUser) {

        showToast(
            "يجب تسجيل الدخول أولًا 🔐"
        );

        openAuthModal(
            "login"
        );

        return;

    }


    document
        .getElementById(
            "createModal"
        )
        .classList
        .add("active");


    updateTournamentTypeInfo();

}


function closeCreateModal() {

    document
        .getElementById(
            "createModal"
        )
        .classList
        .remove("active");

}


// ============================
// JOIN MODAL
// ============================

function closeJoinModal() {

    document
        .getElementById(
            "joinModal"
        )
        .classList
        .remove("active");


    selectedTournament =
        null;

}


// ============================
// MANAGEMENT MODAL
// ============================

async function openManageTournamentModal(
    id
) {

    if (!currentUser) {

        return;

    }


    const tournament =
        tournaments.find(
            item =>
                item.id === id
        );


    if (!tournament) {

        return;

    }


    if (
        tournament.ownerId !==
        currentUser.id
    ) {

        showToast(
            "ليس لديك صلاحية إدارة هذه البطولة ❌"
        );

        return;

    }


    document
        .getElementById(
            "manageTournamentTitle"
        )
        .textContent =
            `إدارة: ${tournament.name}`;


    document
        .getElementById(
            "manageTournamentModal"
        )
        .classList
        .add("active");


    await loadTournamentManagement(
        tournament.id
    );

}


// ============================
// LOAD MANAGEMENT
// ============================

async function loadTournamentManagement(
    tournamentId
) {

    const requestsResult =
        await supabaseClient
            .from(
                "tournament_requests"
            )
            .select("*")
            .eq(
                "tournament_id",
                tournamentId
            )
            .eq(
                "status",
                "pending"
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    const participantsResult =
        await supabaseClient
            .from(
                "participants"
            )
            .select("*")
            .eq(
                "tournament_id",
                tournamentId
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    const requests =
        requestsResult.data || [];


    const participants =
        participantsResult.data || [];


    document
        .getElementById(
            "pendingRequestsCount"
        )
        .textContent =
            requests.length;


    document
        .getElementById(
            "participantsCount"
        )
        .textContent =
            participants.length;


    const requestsList =
        document.getElementById(
            "requestsList"
        );


    const participantsList =
        document.getElementById(
            "participantsList"
        );


    requestsList.innerHTML =
        "";


    participantsList.innerHTML =
        "";


    if (
        requests.length === 0
    ) {

        requestsList.innerHTML =

            `<div class="management-empty">
                لا توجد طلبات مشاركة حاليًا.
            </div>`;

    } else {

        requests.forEach(
            request => {

                requestsList.innerHTML += `

                    <div class="management-item">

                        <strong>
                            ${escapeHTML(
                                request.player_name
                            )}
                        </strong>

                        <span>
                            Level ${request.player_level}
                        </span>

                        <div>

                            <button
                                onclick="approveRequest(${request.id})"
                            >
                                قبول
                            </button>

                            <button
                                onclick="rejectRequest(${request.id})"
                            >
                                رفض
                            </button>

                        </div>

                    </div>

                `;

            }
        );

    }


    if (
        participants.length === 0
    ) {

        participantsList.innerHTML =

            `<div class="management-empty">
                لا يوجد مشاركون حتى الآن.
            </div>`;

    } else {

        participants.forEach(
            participant => {

                participantsList.innerHTML += `

                    <div class="management-item">

                        <strong>
                            ${escapeHTML(
                                participant.player_name
                            )}
                        </strong>

                        <span>
                            Level ${participant.player_level}
                        </span>

                    </div>

                `;

            }
        );

    }

}


// ============================
// APPROVE REQUEST
// ============================

async function approveRequest(
    requestId
) {

    if (!currentUser) {

        return;

    }


    const {
        data: request,
        error: requestError
    } =
        await supabaseClient
            .from(
                "tournament_requests"
            )
            .select("*")
            .eq(
                "id",
                requestId
            )
            .single();


    if (
        requestError ||
        !request
    ) {

        showToast(
            "تعذر العثور على الطلب ❌"
        );

        return;

    }


    const {
        data: tournament
    } =
        await supabaseClient
            .from(
                "tournaments"
            )
            .select("*")
            .eq(
                "id",
                request.tournament_id
            )
            .single();


    if (
        !tournament ||
        tournament.owner_id !==
        currentUser.id
    ) {

        showToast(
            "ليس لديك صلاحية ❌"
        );

        return;

    }


    // منع إضافة اللاعب مرتين

    const {
        data: existingParticipant
    } =
        await supabaseClient
            .from(
                "participants"
            )
            .select("id")
            .eq(
                "tournament_id",
                request.tournament_id
            )
            .eq(
                "user_id",
                request.user_id
            )
            .maybeSingle();


    if (existingParticipant) {

        await supabaseClient
            .from(
                "tournament_requests"
            )
            .update({
                status:
                    "approved"
            })
            .eq(
                "id",
                requestId
            );


        showToast(
            "اللاعب مسجل بالفعل في البطولة."
        );


        await loadTournamentManagement(
            request.tournament_id
        );

        return;

    }


    const {
        error: participantError
    } =
        await supabaseClient
            .from(
                "participants"
            )
            .insert({

                tournament_id:
                    request.tournament_id,

                player_name:
                    request.player_name,

                player_level:
                    request.player_level,

                user_id:
                    request.user_id || null

            });


    if (participantError) {

        console.error(
            participantError
        );

        showToast(
            "حدث خطأ أثناء قبول الطلب ❌"
        );

        return;

    }


    const {
        error: updateError
    } =
        await supabaseClient
            .from(
                "tournament_requests"
            )
            .update({

                status:
                    "approved"

            })
            .eq(
                "id",
                requestId
            );


    if (updateError) {

        showToast(
            "تمت إضافة اللاعب لكن حدث خطأ في تحديث الطلب ❌"
        );

        return;

    }


    showToast(
        "تم قبول اللاعب 🎉"
    );


    await loadTournamentManagement(
        request.tournament_id
    );

}


// ============================
// REJECT REQUEST
// ============================

async function rejectRequest(
    requestId
) {

    if (!currentUser) {

        return;

    }


    const {
        data: request
    } =
        await supabaseClient
            .from(
                "tournament_requests"
            )
            .select(
                "tournament_id"
            )
            .eq(
                "id",
                requestId
            )
            .single();


    if (!request) {

        showToast(
            "تعذر العثور على الطلب ❌"
        );

        return;

    }


    const {
        data: tournament
    } =
        await supabaseClient
            .from(
                "tournaments"
            )
            .select(
                "owner_id"
            )
            .eq(
                "id",
                request.tournament_id
            )
            .single();


    if (
        !tournament ||
        tournament.owner_id !==
        currentUser.id
    ) {

        showToast(
            "ليس لديك صلاحية ❌"
        );

        return;

    }


    const {
        error
    } =
        await supabaseClient
            .from(
                "tournament_requests"
            )
            .update({

                status:
                    "rejected"

            })
            .eq(
                "id",
                requestId
            );


    if (error) {

        showToast(
            "حدث خطأ أثناء رفض الطلب ❌"
        );

        return;

    }


    showToast(
        "تم رفض الطلب"
    );


    await loadTournamentManagement(
        request.tournament_id
    );

}


// ============================
// DETAILS MODAL
// ============================

async function openDetailsModal(
    id
) {

    const tournament =
        tournaments.find(
            item =>
                item.id === id
        );


    if (!tournament) {

        return;

    }


    document
        .getElementById(
            "detailsTournamentTitle"
        )
        .textContent =
            tournament.name;


    document
        .getElementById(
            "detailsTournamentType"
        )
        .textContent =
            tournament.type === "private"

                ? "🔒 بطولة خاصة"

                : "🟢 بطولة مفتوحة";


    document
        .getElementById(
            "detailsModal"
        )
        .classList
        .add("active");


    const {
        data: participants,
        error
    } =
        await supabaseClient
            .from(
                "participants"
            )
            .select("*")
            .eq(
                "tournament_id",
                tournament.id
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            error
        );

        showToast(
            "حدث خطأ أثناء تحميل المشاركين ❌"
        );

        return;

    }


    const list =
        participants || [];


    document
        .getElementById(
            "detailsParticipantsCount"
        )
        .textContent =
            list.length;


    const participantsList =
        document.getElementById(
            "detailsParticipantsList"
        );


    participantsList.innerHTML =
        "";


    if (
        list.length === 0
    ) {

        participantsList.innerHTML =

            `<div class="management-empty">
                لا يوجد مشاركون حتى الآن.
            </div>`;

        return;

    }


    list.forEach(
        participant => {

            participantsList.innerHTML += `

                <div class="management-item">

                    <strong>

                        ${escapeHTML(
                            participant.player_name
                        )}

                    </strong>

                    <span>

                        Level
                        ${participant.player_level}

                    </span>

                </div>

            `;

        }
    );

}


// ============================
// CLOSE MODALS
// ============================

function closeManageTournamentModal() {

    document
        .getElementById(
            "manageTournamentModal"
        )
        .classList
        .remove("active");

}


function closeDetailsModal() {

    document
        .getElementById(
            "detailsModal"
        )
        .classList
        .remove("active");

}


// ============================
// SCROLL
// ============================

function scrollToTournaments() {

    document
        .getElementById(
            "tournaments"
        )
        .scrollIntoView({

            behavior:
                "smooth"

        });

}


// ============================
// TOAST
// ============================

function showToast(
    message
) {

    const toast =
        document.getElementById(
            "toast"
        );


    if (!toast) {

        return;

    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        window.toastTimer
    );


    window.toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );

}


// ============================
// SECURITY
// ============================

function escapeHTML(
    text
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text || "";


    return div.innerHTML;

}


// ============================
// CLOSE MODAL BY BACKDROP
// ============================

window.addEventListener(
    "click",
    function(event) {

        if (
            event.target.classList
                .contains(
                    "modal-overlay"
                )
        ) {

            event.target.classList
                .remove(
                    "active"
                );

        }

    }
);


// ============================
// ESC KEY
// ============================

window.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape"
        ) {

            document
                .querySelectorAll(
                    ".modal-overlay.active"
                )
                .forEach(
                    modal => {

                        modal.classList
                            .remove(
                                "active"
                            );

                    }
                );

            selectedTournament =
                null;

        }

    }
);


// ============================
// AUTH STATE
// ============================

supabaseClient.auth.onAuthStateChange(
    function(
        event,
        session
    ) {

        currentUser =
            session?.user || null;


        // نستخدم setTimeout حتى لا تحدث
        // مشاكل أثناء تغيير حالة Supabase

        setTimeout(
            async () => {

                await updateUserUI();

                renderTournaments();

            },
            0
        );

    }
);


// ============================
// START
// ============================

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        updateAuthUI();

        updateTournamentTypeInfo();


        const {
            data
        } =
            await supabaseClient.auth.getUser();


        currentUser =
            data?.user || null;


        await updateUserUI();


        await loadTournaments();

    }
);
