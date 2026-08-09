/* =========================================================
   VIBEQUEUE — FULL REPLACEMENT JAVASCRIPT
   ========================================================= */

const audio = document.getElementById("audio");
const player = document.getElementById("player");
const mainPlay = document.getElementById("mainPlay");
const progressBar = document.getElementById("progressBar");
const volume = document.getElementById("volume");

const currentSong = document.getElementById("currentSong");
const currentArtist = document.getElementById("currentArtist");
const currentTime = document.getElementById("currentTime");
const duration = document.getElementById("duration");

const playerPoster = document.getElementById("playerPoster");
const miniPlaceholder = document.getElementById("miniPlaceholder");

const queueBox = document.getElementById("queueBox");
const queueStatus = document.getElementById("queueStatus");
const favoritesBox = document.getElementById("favoritesBox");
const toast = document.getElementById("toast");

let currentData = null;
let repeat = false;


/* =========================================================
   STORAGE
   ========================================================= */

let favorites = JSON.parse(
    localStorage.getItem("vibequeueFavorites") || "[]"
);

let recentlyPlayed = JSON.parse(
    localStorage.getItem("vibequeueRecentlyPlayed") || "[]"
);

let myPlaylist = JSON.parse(
    localStorage.getItem("vibequeuePlaylist") || "[]"
);


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message) {

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(window.toastTimer);

    window.toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 1800);
}


/* =========================================================
   SONG DATA
   ========================================================= */

function getSongData(button) {

    const card = button.closest(".song-card");

    if (!card) return null;

    return {
        card: card,
        song: card.dataset.song,
        artist: card.dataset.artist,
        file: card.dataset.file,
        image: card.dataset.image
    };
}


/* =========================================================
   IMAGE PATH
   ========================================================= */

function getImagePath(image) {

    if (!image) return "";

    return "/static/images/" +
        encodeURIComponent(image);
}


/* =========================================================
   RECENTLY PLAYED
   ========================================================= */

function saveRecentlyPlayed(data) {

    if (!data) return;

    recentlyPlayed =
        recentlyPlayed.filter(
            song => song.song !== data.song
        );

    recentlyPlayed.unshift({
        song: data.song,
        artist: data.artist,
        file: data.file,
        image: data.image
    });

    recentlyPlayed =
        recentlyPlayed.slice(0, 8);

    localStorage.setItem(
        "vibequeueRecentlyPlayed",
        JSON.stringify(recentlyPlayed)
    );
}


/* =========================================================
   PLAYER POSTER — FIXED
   ========================================================= */

function setPlayerPoster(image) {

    if (!playerPoster) return;

    const imagePath = getImagePath(image);

    if (!imagePath) {

        playerPoster.style.display = "none";

        if (miniPlaceholder) {
            miniPlaceholder.style.display = "grid";
        }

        return;
    }


    /* Hide placeholder first */

    if (miniPlaceholder) {
        miniPlaceholder.style.display = "none";
    }


    /* Force image to display */

    playerPoster.style.display = "block";
    playerPoster.style.visibility = "visible";
    playerPoster.style.opacity = "1";


    /* Set image */

    playerPoster.src = imagePath;


    /* If image fails, show placeholder */

    playerPoster.onerror = function () {

        console.error(
            "Player poster not found:",
            imagePath
        );

        this.style.display = "none";

        if (miniPlaceholder) {
            miniPlaceholder.style.display = "grid";
        }
    };


    playerPoster.onload = function () {

        this.style.display = "block";
        this.style.visibility = "visible";
        this.style.opacity = "1";

        if (miniPlaceholder) {
            miniPlaceholder.style.display = "none";
        }
    };
}


/* =========================================================
   PLAY SONG
   ========================================================= */

function playSong(data) {

    if (!data) return;

    currentData = data;


    /* Song information */

    currentSong.textContent =
        data.song;

    currentArtist.textContent =
        data.artist;


    /* Recently played */

    saveRecentlyPlayed(data);


    /* FIX: SHOW POSTER IN BOTTOM PLAYER */

    setPlayerPoster(data.image);


    /* Audio */

    audio.src =
        "/static/music/" +
        encodeURIComponent(data.file);

    audio.load();


    /* Remove old playing state */

    document
        .querySelectorAll(".song-card")
        .forEach(card => {

            card.classList.remove(
                "now-playing"
            );

        });


    /* Highlight current song */

    if (data.card) {

        data.card.classList.add(
            "now-playing"
        );

    }


    /* Play */

    audio.play()

        .then(() => {

            if (player) {
                player.classList.add(
                    "playing"
                );
            }

            mainPlay.textContent =
                "❚❚";

            showToast(
                data.song +
                " is playing 🎧"
            );

        })

        .catch(error => {

            console.error(
                "Audio error:",
                error
            );

            showToast(
                "Couldn't play this song."
            );

        });
}


/* =========================================================
   PLAY CARD
   ========================================================= */

function playCard(button) {

    const data =
        getSongData(button);

    if (data) {
        playSong(data);
    }
}


/* =========================================================
   START LISTENING
   ========================================================= */

async function startListening() {

    try {

        const response =
            await fetch("/queue");

        const result =
            await response.json();

        const queue =
            result.queue || [];


        if (queue.length > 0) {

            await nextSong(false);

            return;
        }


        const firstCard =
            document.querySelector(
                ".song-card"
            );

        if (!firstCard) return;


        playCard(
            firstCard.querySelector(
                ".card-buttons button"
            )
        );

    }

    catch (error) {

        console.error(error);

        const firstCard =
            document.querySelector(
                ".song-card"
            );

        if (!firstCard) return;

        playCard(
            firstCard.querySelector(
                ".card-buttons button"
            )
        );
    }
}


/* =========================================================
   PLAY / PAUSE
   ========================================================= */

function togglePlay() {

    if (!audio.src) {

        startListening();

        return;
    }


    if (audio.paused) {

        audio.play();

    } else {

        audio.pause();

    }
}


/* =========================================================
   AUDIO EVENTS
   ========================================================= */

audio.addEventListener(
    "play",
    () => {

        if (player) {
            player.classList.add(
                "playing"
            );
        }

        mainPlay.textContent =
            "❚❚";

    }
);


audio.addEventListener(
    "pause",
    () => {

        if (player) {
            player.classList.remove(
                "playing"
            );
        }

        mainPlay.textContent =
            "▶";

    }
);


audio.addEventListener(
    "loadedmetadata",
    () => {

        duration.textContent =
            formatTime(
                audio.duration
            );

    }
);


audio.addEventListener(
    "timeupdate",
    () => {

        if (!audio.duration) return;

        progressBar.value =
            (
                audio.currentTime /
                audio.duration
            ) * 100;

        currentTime.textContent =
            formatTime(
                audio.currentTime
            );

    }
);


/* =========================================================
   SONG ENDED
   ========================================================= */

audio.addEventListener(
    "ended",
    async () => {

        if (repeat) {

            audio.currentTime = 0;

            audio.play();

            return;
        }

        await nextSong(true);

    }
);


/* =========================================================
   TIME
   ========================================================= */

function formatTime(seconds) {

    if (
        !Number.isFinite(seconds)
    ) {
        return "0:00";
    }

    const minutes =
        Math.floor(
            seconds / 60
        );

    const secondsPart =
        Math.floor(
            seconds % 60
        )
        .toString()
        .padStart(2, "0");

    return (
        minutes +
        ":" +
        secondsPart
    );
}


/* =========================================================
   PROGRESS
   ========================================================= */

progressBar.addEventListener(
    "input",
    () => {

        if (!audio.duration) return;

        audio.currentTime =
            (
                progressBar.value /
                100
            ) *
            audio.duration;

    }
);


/* =========================================================
   VOLUME
   ========================================================= */

volume.addEventListener(
    "input",
    () => {

        audio.volume =
            volume.value;

        updateVolumeIcon();

    }
);

audio.volume = 0.8;


function updateVolumeIcon() {

    const icon =
        document.getElementById(
            "volumeIcon"
        );

    if (!icon) return;

    if (audio.volume === 0) {

        icon.textContent = "🔇";

    } else if (audio.volume < 0.5) {

        icon.textContent = "🔉";

    } else {

        icon.textContent = "🔊";

    }
}


/* =========================================================
   QUEUE
   ========================================================= */

async function queueCard(button) {

    const data =
        getSongData(button);

    if (!data) return;


    try {

        const response =
            await fetch(
                "/add-to-queue",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            song: data.song,
                            artist: data.artist
                        })
                }
            );


        const result =
            await response.json();


        if (result.success) {

            showToast(
                data.song +
                " added to queue ♫"
            );

            await loadQueue();

        } else {

            showToast(
                result.message ||
                "Couldn't add song."
            );

        }

    }

    catch (error) {

        console.error(error);

        showToast(
            "Server connection error."
        );

    }
}


/* =========================================================
   LOAD QUEUE
   ========================================================= */

async function loadQueue() {

    try {

        const response =
            await fetch("/queue");

        const result =
            await response.json();

        const queue =
            result.queue || [];


        queueStatus.textContent =
            queue.length +
            (
                queue.length === 1
                    ? " song waiting"
                    : " songs waiting"
            );


        if (queue.length === 0) {

            queueBox.innerHTML = `

                <div class="empty-box">

                    <div class="empty-icon">
                        ≋
                    </div>

                    <b>
                        Your queue is empty
                    </b>

                    <small>
                        Add songs above and they'll appear here.
                    </small>

                </div>

            `;

            return;
        }


        queueBox.innerHTML =
            queue.map(
                (song, index) => `

                <div class="queue-song">

                    <div class="queue-number">
                        ${String(
                            index + 1
                        ).padStart(2, "0")}
                    </div>

                    <div>

                        <b>
                            ${escapeHtml(
                                song.song
                            )}
                        </b>

                        <small>
                            ${escapeHtml(
                                song.artist
                            )}
                        </small>

                    </div>

                    <div class="queue-wave">

                        <i></i>
                        <i></i>
                        <i></i>
                        <i></i>

                    </div>

                </div>

            `
            ).join("");

    }

    catch (error) {

        console.error(
            "Queue error:",
            error
        );

    }
}


/* =========================================================
   NEXT SONG
   ========================================================= */

async function nextSong(auto = false) {

    try {

        const response =
            await fetch(
                "/play-next",
                {
                    method: "POST"
                }
            );

        const result =
            await response.json();


        if (!result.success) {

            await loadQueue();

            if (!auto) {

                showToast(
                    "Your queue is empty."
                );

            }

            return;
        }


        const queuedSong =
            result.song;


        const cards =
            document.querySelectorAll(
                ".song-card"
            );


        let matchingCard = null;


        cards.forEach(card => {

            if (
                card.dataset.song ===
                queuedSong.song
            ) {

                matchingCard = card;

            }

        });


        if (!matchingCard) {

            await loadQueue();

            showToast(
                "Song card not found."
            );

            return;
        }


        playSong({

            card: matchingCard,

            song: queuedSong.song,

            artist: queuedSong.artist,

            file: matchingCard.dataset.file,

            image: matchingCard.dataset.image

        });


        await loadQueue();

    }

    catch (error) {

        console.error(error);

        showToast(
            "Could not play next song."
        );

    }
}


/* =========================================================
   PREVIOUS
   ========================================================= */

function previousSong() {

    const cards =
        [
            ...document.querySelectorAll(
                ".song-card"
            )
        ];

    if (!cards.length) return;


    if (!currentData) {

        playCard(
            cards[0].querySelector(
                ".card-buttons button"
            )
        );

        return;
    }


    const index =
        cards.findIndex(
            card =>
                card.dataset.song ===
                currentData.song
        );


    const previous =
        cards[
            (
                index -
                1 +
                cards.length
            ) %
            cards.length
        ];


    playCard(
        previous.querySelector(
            ".card-buttons button"
        )
    );
}


/* =========================================================
   SHUFFLE
   ========================================================= */

function shuffle() {

    const cards =
        [
            ...document.querySelectorAll(
                ".song-card"
            )
        ];

    if (!cards.length) return;


    const random =
        Math.floor(
            Math.random() *
            cards.length
        );


    playCard(
        cards[random].querySelector(
            ".card-buttons button"
        )
    );
}


/* =========================================================
   REPEAT
   ========================================================= */

function repeatSong() {

    repeat = !repeat;

    const button =
        document.getElementById(
            "repeatButton"
        );


    if (repeat) {

        button.style.color =
            "#a18aff";

        showToast(
            "Repeat ON 🔁"
        );

    } else {

        button.style.color =
            "";

        showToast(
            "Repeat OFF"
        );

    }
}


/* =========================================================
   FAVORITES
   ========================================================= */

function isFavorite(songName) {

    return favorites.some(
        song =>
            song.song === songName
    );
}


function saveFavorites() {

    localStorage.setItem(
        "vibequeueFavorites",
        JSON.stringify(favorites)
    );
}


function favoriteSong(button) {

    const data =
        getSongData(button);

    if (!data) return;


    const existingIndex =
        favorites.findIndex(
            song =>
                song.song ===
                data.song
        );


    if (existingIndex !== -1) {

        favorites.splice(
            existingIndex,
            1
        );

        button.classList.remove(
            "liked"
        );

        button.textContent =
            "♡";

        saveFavorites();

        renderFavorites();

        showToast(
            "Removed from favorites"
        );

        return;
    }


    favorites.push({

        song: data.song,
        artist: data.artist,
        image: data.image,
        file: data.file

    });


    button.classList.add(
        "liked"
    );

    button.textContent =
        "♥";


    button.classList.add(
        "heart-pop"
    );

    setTimeout(() => {

        button.classList.remove(
            "heart-pop"
        );

    }, 450);


    saveFavorites();

    renderFavorites();

    showToast(
        "Added to favorites ❤️"
    );
}


/* =========================================================
   RENDER FAVORITES
   ========================================================= */

function renderFavorites() {

    if (!favoritesBox) return;


    if (favorites.length === 0) {

        favoritesBox.innerHTML = `

            <div class="empty-icon">
                ♡
            </div>

            <b>
                No favorite songs yet
            </b>

            <small>
                Tap ♡ on a song to add it here.
            </small>

        `;

        return;
    }


    favoritesBox.innerHTML = `

        <div
            style="
                width:100%;
                padding:10px 15px;
            "
        >

            ${favorites.map(
                (song, index) => `

                <div
                    style="
                        display:flex;
                        align-items:center;
                        gap:12px;
                        padding:10px;
                        margin-bottom:8px;
                        border-radius:12px;
                        background:#15161f;
                        border:1px solid #252a36;
                        text-align:left;
                    "
                >

                    <img
                        src="${getImagePath(song.image)}"
                        alt="${escapeHtml(song.song)}"
                        style="
                            width:50px;
                            height:50px;
                            object-fit:cover;
                            border-radius:10px;
                            flex-shrink:0;
                        "
                    >

                    <div
                        style="
                            flex:1;
                            min-width:0;
                        "
                    >

                        <b
                            style="
                                display:block;
                                color:#fff;
                                font-size:13px;
                            "
                        >
                            ${escapeHtml(song.song)}
                        </b>

                        <small
                            style="
                                display:block;
                                color:#777e8e;
                                margin-top:4px;
                            "
                        >
                            ${escapeHtml(song.artist)}
                        </small>

                    </div>

                    <button
                        onclick="playFavorite(${index})"
                        style="
                            border:0;
                            width:36px;
                            height:36px;
                            border-radius:50%;
                            background:white;
                            color:#08080d;
                            cursor:pointer;
                        "
                    >
                        ▶
                    </button>

                    <button
                        onclick="removeFavorite(${index})"
                        style="
                            border:0;
                            width:36px;
                            height:36px;
                            border-radius:50%;
                            background:#ff5c8a;
                            color:white;
                            cursor:pointer;
                        "
                    >
                        ♥
                    </button>

                </div>

            `
            ).join("")}

        </div>
    `;
}


/* =========================================================
   PLAY FAVORITE
   ========================================================= */

function playFavorite(index) {

    const song =
        favorites[index];

    if (!song) return;


    const cards =
        document.querySelectorAll(
            ".song-card"
        );


    let matchingCard = null;


    cards.forEach(card => {

        if (
            card.dataset.song ===
            song.song
        ) {

            matchingCard = card;

        }

    });


    playSong({

        card: matchingCard,

        song: song.song,

        artist: song.artist,

        file: song.file,

        image: song.image

    });
}


/* =========================================================
   REMOVE FAVORITE
   ========================================================= */

function removeFavorite(index) {

    const song =
        favorites[index];

    if (!song) return;


    favorites.splice(index, 1);

    saveFavorites();

    renderFavorites();


    document
        .querySelectorAll(
            ".song-card"
        )
        .forEach(card => {

            if (
                card.dataset.song ===
                song.song
            ) {

                const heart =
                    card.querySelector(
                        ".heart"
                    );

                if (heart) {

                    heart.classList.remove(
                        "liked"
                    );

                    heart.textContent =
                        "♡";

                }

            }

        });


    showToast(
        "Removed from favorites"
    );
}


/* =========================================================
   RESTORE HEARTS
   ========================================================= */

function restoreFavoriteHearts() {

    document
        .querySelectorAll(
            ".song-card"
        )
        .forEach(card => {

            const heart =
                card.querySelector(
                    ".heart"
                );


            if (
                heart &&
                isFavorite(
                    card.dataset.song
                )
            ) {

                heart.classList.add(
                    "liked"
                );

                heart.textContent =
                    "♥";

            }

        });
}


/* =========================================================
   CLEAR QUEUE
   ========================================================= */

async function clearQueue() {

    const yes =
        confirm(
            "Empty your entire music queue?"
        );


    if (!yes) return;


    try {

        const response =
            await fetch(
                "/clear-queue",
                {
                    method: "POST"
                }
            );


        const result =
            await response.json();


        if (result.success) {

            await loadQueue();

            showToast(
                "Vibe cleared 🫧"
            );

        }

    }

    catch (error) {

        console.error(error);

        showToast(
            "Could not clear queue."
        );

    }
}


/* =========================================================
   SEARCH
   ========================================================= */

const searchInput =
    document.getElementById(
        "searchInput"
    );


if (searchInput) {

    searchInput.addEventListener(
        "input",
        function () {

            const text =
                this.value
                    .toLowerCase()
                    .trim();


            const cards =
                document.querySelectorAll(
                    ".song-card"
                );


            let count = 0;


            cards.forEach(card => {

                const song =
                    card.dataset.song
                        .toLowerCase();

                const artist =
                    card.dataset.artist
                        .toLowerCase();


                if (
                    song.includes(text) ||
                    artist.includes(text)
                ) {

                    card.style.display =
                        "";

                    count++;

                } else {

                    card.style.display =
                        "none";

                }

            });


            document
                .getElementById(
                    "songCount"
                )
                .textContent =
                count +
                (
                    count === 1
                        ? " song"
                        : " songs"
                );

        }
    );
}


/* =========================================================
   LIBRARY MODAL
   ========================================================= */

function createLibraryModal() {

    if (
        document.getElementById(
            "libraryOverlay"
        )
    ) return;


    const overlay =
        document.createElement(
            "div"
        );

    overlay.id =
        "libraryOverlay";

    overlay.className =
        "library-overlay";


    /*
       IMPORTANT:
       These inline values make the modal work
       even if mobile CSS has a z-index/display issue.
    */

    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.zIndex = "99999";


    overlay.innerHTML = `

        <div class="library-modal">

            <div class="library-modal-header">

                <div>

                    <h3 id="libraryModalTitle">
                        Your Library
                    </h3>

                    <small id="libraryModalSubtitle">
                        Your music collection
                    </small>

                </div>

                <button
                    type="button"
                    class="library-close"
                    onclick="closeLibrary()"
                >
                    ×
                </button>

            </div>

            <div
                class="library-modal-body"
                id="libraryModalBody"
            ></div>

        </div>

    `;


    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                overlay
            ) {

                closeLibrary();

            }

        }
    );


    document.body.appendChild(
        overlay
    );
}


/* =========================================================
   OPEN LIBRARY
   ========================================================= */

function openLibrary(type) {

    createLibraryModal();


    const overlay =
        document.getElementById(
            "libraryOverlay"
        );

    const title =
        document.getElementById(
            "libraryModalTitle"
        );

    const subtitle =
        document.getElementById(
            "libraryModalSubtitle"
        );


    if (!overlay) return;


    overlay.classList.add(
        "show"
    );


    /*
       NO TYPE = LIBRARY HOME
    */

    if (!type) {

        title.textContent =
            "Your Library";

        subtitle.textContent =
            "Your music collection";

        renderLibraryHome();

        return;
    }


    if (type === "playlist") {

        title.textContent =
            "🎵 My Playlist";

        subtitle.textContent =
            myPlaylist.length +
            (
                myPlaylist.length === 1
                    ? " song"
                    : " songs"
            );

        renderPlaylistModal();

        return;
    }


    if (type === "recent") {

        title.textContent =
            "🕘 Recently Played";

        subtitle.textContent =
            recentlyPlayed.length +
            " recently played";

        renderRecentlyPlayedModal();

        return;
    }


    if (type === "liked") {

        title.textContent =
            "❤️ Liked Songs";

        subtitle.textContent =
            favorites.length +
            (
                favorites.length === 1
                    ? " favorite"
                    : " favorites"
            );

        renderFavoritesModal();

        return;
    }
}


/* =========================================================
   LIBRARY HOME — SPOTIFY STYLE
   ========================================================= */

function renderLibraryHome() {

    const body =
        document.getElementById(
            "libraryModalBody"
        );

    if (!body) return;


    body.innerHTML = `

        <div class="library-home">

            <button
                type="button"
                class="library-choice"
                onclick="openLibrary('playlist')"
            >

                <div class="library-choice-icon">
                    🎵
                </div>

                <div>
                    <b>My Playlist</b>

                    <small>
                        ${myPlaylist.length}
                        ${
                            myPlaylist.length === 1
                                ? " song"
                                : " songs"
                        }
                    </small>
                </div>

                <span>›</span>

            </button>


            <button
                type="button"
                class="library-choice"
                onclick="openLibrary('recent')"
            >

                <div class="library-choice-icon">
                    🕘
                </div>

                <div>
                    <b>Recently Played</b>

                    <small>
                        ${
                            recentlyPlayed.length
                        }
                        recently played
                    </small>
                </div>

                <span>›</span>

            </button>


            <button
                type="button"
                class="library-choice"
                onclick="openLibrary('liked')"
            >

                <div class="library-choice-icon">
                    ❤️
                </div>

                <div>
                    <b>Liked Songs</b>

                    <small>
                        ${favorites.length}
                        ${
                            favorites.length === 1
                                ? " favorite"
                                : " favorites"
                        }
                    </small>
                </div>

                <span>›</span>

            </button>

        </div>

    `;
}


/* =========================================================
   CLOSE LIBRARY
   ========================================================= */

function closeLibrary() {

    const overlay =
        document.getElementById(
            "libraryOverlay"
        );

    if (overlay) {

        overlay.classList.remove(
            "show"
        );

    }
}


/* =========================================================
   RECENTLY PLAYED MODAL
   ========================================================= */

function renderRecentlyPlayedModal() {

    const body =
        document.getElementById(
            "libraryModalBody"
        );

    if (!body) return;


    if (recentlyPlayed.length === 0) {

        body.innerHTML = `

            <div class="library-empty">

                <div>🕘</div>

                <b>
                    Nothing played yet
                </b>

                <p>
                    Songs you play will appear here.
                </p>

            </div>

        `;

        return;
    }


    body.innerHTML =
        recentlyPlayed.map(
            (song, index) => `

            <div class="library-song">

                <img
                    src="${getImagePath(song.image)}"
                    alt="${escapeHtml(song.song)}"
                >

                <div class="library-song-info">

                    <b>
                        ${escapeHtml(song.song)}
                    </b>

                    <small>
                        ${escapeHtml(song.artist)}
                    </small>

                </div>

                <button
                    type="button"
                    class="library-play"
                    onclick="playRecentlyPlayed(${index})"
                >
                    ▶
                </button>

            </div>

        `
        ).join("");
}


/* =========================================================
   PLAY RECENT SONG
   ========================================================= */

function playRecentlyPlayed(index) {

    const song =
        recentlyPlayed[index];

    if (!song) return;


    closeLibrary();


    const cards =
        document.querySelectorAll(
            ".song-card"
        );


    let card = null;


    cards.forEach(item => {

        if (
            item.dataset.song ===
            song.song
        ) {

            card = item;

        }

    });


    playSong({

        card: card,

        song: song.song,

        artist: song.artist,

        file: song.file,

        image: song.image

    });
}


/* =========================================================
   MY PLAYLIST
   ========================================================= */

function savePlaylist() {

    localStorage.setItem(
        "vibequeuePlaylist",
        JSON.stringify(myPlaylist)
    );
}


function addToPlaylist(data) {

    if (!data) return;


    const exists =
        myPlaylist.some(
            song =>
                song.song ===
                data.song
        );


    if (exists) {

        showToast(
            "Already in My Playlist 🎵"
        );

        return;
    }


    myPlaylist.push({

        song: data.song,

        artist: data.artist,

        file: data.file,

        image: data.image

    });


    savePlaylist();

    showToast(
        data.song +
        " added to My Playlist 🎵"
    );
}


function renderPlaylistModal() {

    const body =
        document.getElementById(
            "libraryModalBody"
        );

    if (!body) return;


    if (myPlaylist.length === 0) {

        body.innerHTML = `

            <div class="library-empty">

                <div>🎵</div>

                <b>
                    Your playlist is empty
                </b>

                <p>
                    Double-click a song to add it here.
                </p>

            </div>

        `;

        return;
    }


    body.innerHTML =
        myPlaylist.map(
            (song, index) => `

            <div class="library-song">

                <img
                    src="${getImagePath(song.image)}"
                    alt="${escapeHtml(song.song)}"
                >

                <div class="library-song-info">

                    <b>
                        ${escapeHtml(song.song)}
                    </b>

                    <small>
                        ${escapeHtml(song.artist)}
                    </small>

                </div>

                <button
                    type="button"
                    class="library-play"
                    onclick="playPlaylistSong(${index})"
                >
                    ▶
                </button>

            </div>

        `
        ).join("");
}


function playPlaylistSong(index) {

    const song =
        myPlaylist[index];

    if (!song) return;


    closeLibrary();


    const cards =
        document.querySelectorAll(
            ".song-card"
        );


    let card = null;


    cards.forEach(item => {

        if (
            item.dataset.song ===
            song.song
        ) {

            card = item;

        }

    });


    playSong({

        card: card,

        song: song.song,

        artist: song.artist,

        file: song.file,

        image: song.image

    });
}


/* =========================================================
   CREATE PLAYLIST
   ========================================================= */

function createPlaylist() {

    openLibrary(
        "playlist"
    );
}


/* =========================================================
   LIBRARY SIDEBAR CLICKS
   ========================================================= */

function setupLibraryClicks() {

    const items =
        document.querySelectorAll(
            ".library-item"
        );


    items.forEach(item => {

        const text =
            item.textContent
                .toLowerCase()
                .trim();


        item.addEventListener(
            "click",
            () => {

                if (
                    text.includes(
                        "my playlist"
                    )
                ) {

                    openLibrary(
                        "playlist"
                    );

                }

                else if (
                    text.includes(
                        "recently played"
                    )
                ) {

                    openLibrary(
                        "recent"
                    );

                }

                else if (
                    text.includes(
                        "liked songs"
                    )
                ) {

                    openLibrary(
                        "liked"
                    );

                }

            }
        );

    });
}


/* =========================================================
   FAVORITES LIBRARY MODAL
   ========================================================= */

function renderFavoritesModal() {

    const body =
        document.getElementById(
            "libraryModalBody"
        );

    if (!body) return;


    if (favorites.length === 0) {

        body.innerHTML = `

            <div class="library-empty">

                <div>♡</div>

                <b>
                    No liked songs yet
                </b>

                <p>
                    Tap the heart on a song to save it.
                </p>

            </div>

        `;

        return;
    }


    body.innerHTML =
        favorites.map(
            (song, index) => `

            <div class="library-song">

                <img
                    src="${getImagePath(song.image)}"
                    alt="${escapeHtml(song.song)}"
                >

                <div class="library-song-info">

                    <b>
                        ${escapeHtml(song.song)}
                    </b>

                    <small>
                        ${escapeHtml(song.artist)}
                    </small>

                </div>

                <button
                    type="button"
                    class="library-play"
                    onclick="playFavoriteFromLibrary(${index})"
                >
                    ▶
                </button>

            </div>

        `
        ).join("");
}


function playFavoriteFromLibrary(index) {

    closeLibrary();

    playFavorite(index);
}


/* =========================================================
   DOUBLE CLICK → PLAYLIST
   ========================================================= */

document.addEventListener(
    "dblclick",
    event => {

        const card =
            event.target.closest(
                ".song-card"
            );

        if (!card) return;


        addToPlaylist({

            song: card.dataset.song,

            artist: card.dataset.artist,

            file: card.dataset.file,

            image: card.dataset.image

        });

    }
);


/* =========================================================
   HTML SAFETY
   ========================================================= */

function escapeHtml(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================================
   INITIAL LOAD
   ========================================================= */

renderFavorites();

restoreFavoriteHearts();

setupLibraryClicks();

loadQueue();

updateVolumeIcon();


/* =========================================================
   RIGHT CLICK → PLAYLIST
   ========================================================= */

document.addEventListener(
    "contextmenu",
    event => {

        const card =
            event.target.closest(
                ".song-card"
            );

        if (!card) return;


        event.preventDefault();


        addToPlaylist({

            song: card.dataset.song,

            artist: card.dataset.artist,

            file: card.dataset.file,

            image: card.dataset.image

        });

    }
);