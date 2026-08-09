/* =========================================================
   VIBEQUEUE — COMPLETE PLAYLIST + PLAYER JAVASCRIPT
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
   FIND SONG CARD
   ========================================================= */

function findSongCard(songName) {

    let found = null;

    document
        .querySelectorAll(".song-card")
        .forEach(card => {

            if (card.dataset.song === songName) {
                found = card;
            }

        });

    return found;
}


/* =========================================================
   RECENTLY PLAYED
   ========================================================= */

function saveRecentlyPlayed(data) {

    if (!data) return;

    recentlyPlayed = recentlyPlayed.filter(
        song => song.song !== data.song
    );

    recentlyPlayed.unshift({
        song: data.song,
        artist: data.artist,
        file: data.file,
        image: data.image
    });

    recentlyPlayed = recentlyPlayed.slice(0, 8);

    localStorage.setItem(
        "vibequeueRecentlyPlayed",
        JSON.stringify(recentlyPlayed)
    );
}


/* =========================================================
   PLAY SONG
   ========================================================= */

function playSong(data) {

    if (!data) return;

    currentData = data;

    if (currentSong) {
        currentSong.textContent = data.song;
    }

    if (currentArtist) {
        currentArtist.textContent = data.artist;
    }

    saveRecentlyPlayed(data);


    /* =====================================================
       PLAYER POSTER
       ===================================================== */

    if (playerPoster) {

        playerPoster.src =
            "/static/images/" +
            encodeURIComponent(data.image);

        playerPoster.style.display = "block";

        playerPoster.onerror = function () {

            this.style.display = "none";

            if (miniPlaceholder) {
                miniPlaceholder.style.display = "grid";
            }

        };

        if (miniPlaceholder) {
            miniPlaceholder.style.display = "none";
        }
    }


    /* =====================================================
       AUDIO
       ===================================================== */

    audio.src =
        "/static/music/" +
        encodeURIComponent(data.file);

    audio.load();


    /* =====================================================
       REMOVE OLD PLAYING STATE
       ===================================================== */

    document
        .querySelectorAll(".song-card")
        .forEach(card => {

            card.classList.remove("now-playing");

        });


    if (data.card) {
        data.card.classList.add("now-playing");
    }


    audio.play()

        .then(() => {

            if (player) {
                player.classList.add("playing");
            }

            if (mainPlay) {
                mainPlay.textContent = "❚❚";
            }

            showToast(
                data.song + " is playing 🎧"
            );

        })

        .catch(error => {

            console.error(error);

            showToast(
                "Couldn't play this song."
            );

        });
}


/* =========================================================
   PLAY CARD
   ========================================================= */

function playCard(button) {

    const data = getSongData(button);

    if (data) {
        playSong(data);
    }
}


/* =========================================================
   START LISTENING
   ========================================================= */

async function startListening() {

    try {

        const response = await fetch("/queue");

        const result = await response.json();

        const queue = result.queue || [];


        if (queue.length > 0) {

            await nextSong(false);

            return;
        }


        const firstCard =
            document.querySelector(".song-card");

        if (!firstCard) return;


        const playButton =
            firstCard.querySelector(".poster-play") ||
            firstCard.querySelector(".card-buttons button");


        if (playButton) {
            playCard(playButton);
        }

    }

    catch (error) {

        console.error(error);

        const firstCard =
            document.querySelector(".song-card");

        if (!firstCard) return;


        const playButton =
            firstCard.querySelector(".poster-play") ||
            firstCard.querySelector(".card-buttons button");


        if (playButton) {
            playCard(playButton);
        }

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

audio.addEventListener("play", () => {

    if (player) {
        player.classList.add("playing");
    }

    if (mainPlay) {
        mainPlay.textContent = "❚❚";
    }

});


audio.addEventListener("pause", () => {

    if (player) {
        player.classList.remove("playing");
    }

    if (mainPlay) {
        mainPlay.textContent = "▶";
    }

});


audio.addEventListener("loadedmetadata", () => {

    if (duration) {

        duration.textContent =
            formatTime(audio.duration);

    }

});


audio.addEventListener("timeupdate", () => {

    if (!audio.duration) return;


    if (progressBar) {

        progressBar.value =
            (audio.currentTime / audio.duration) * 100;

    }


    if (currentTime) {

        currentTime.textContent =
            formatTime(audio.currentTime);

    }

});


audio.addEventListener("ended", async () => {

    if (repeat) {

        audio.currentTime = 0;

        audio.play();

        return;
    }

    await nextSong(true);

});


/* =========================================================
   TIME
   ========================================================= */

function formatTime(seconds) {

    if (!Number.isFinite(seconds)) {
        return "0:00";
    }

    const minutes =
        Math.floor(seconds / 60);

    const secondsPart =
        Math.floor(seconds % 60)
            .toString()
            .padStart(2, "0");

    return minutes + ":" + secondsPart;
}


/* =========================================================
   PROGRESS
   ========================================================= */

if (progressBar) {

    progressBar.addEventListener("input", () => {

        if (!audio.duration) return;

        audio.currentTime =
            (progressBar.value / 100) *
            audio.duration;

    });

}


/* =========================================================
   VOLUME
   ========================================================= */

if (volume) {

    volume.addEventListener("input", () => {

        audio.volume = volume.value;

        updateVolumeIcon();

    });

}

audio.volume = 0.8;


function updateVolumeIcon() {

    const icon =
        document.getElementById("volumeIcon");

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

    const data = getSongData(button);

    if (!data) return;


    try {

        const response =
            await fetch("/add-to-queue", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    song: data.song,
                    artist: data.artist
                })

            });


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


        if (queueStatus) {

            queueStatus.textContent =
                queue.length +
                (
                    queue.length === 1
                        ? " song waiting"
                        : " songs waiting"
                );

        }


        if (!queueBox) return;


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
            queue.map((song, index) => `

                <div class="queue-song">

                    <div class="queue-number">
                        ${String(index + 1).padStart(2, "0")}
                    </div>

                    <div>

                        <b>
                            ${escapeHtml(song.song)}
                        </b>

                        <small>
                            ${escapeHtml(song.artist)}
                        </small>

                    </div>

                    <div class="queue-wave">

                        <i></i>
                        <i></i>
                        <i></i>
                        <i></i>

                    </div>

                </div>

            `).join("");

    }

    catch (error) {

        console.error("Queue error:", error);

    }
}


/* =========================================================
   NEXT SONG — FIXED
   ========================================================= */

async function nextSong(auto = false) {

    try {

        /* -------------------------------------------------
           FIRST: CHECK SERVER QUEUE
           ------------------------------------------------- */

        const queueResponse =
            await fetch("/queue");

        const queueResult =
            await queueResponse.json();

        const queue =
            queueResult.queue || [];


        /* -------------------------------------------------
           IF QUEUE HAS SONGS → PLAY QUEUED SONG
           ------------------------------------------------- */

        if (queue.length > 0) {

            const nextResponse =
                await fetch("/play-next", {
                    method: "POST"
                });

            const nextResult =
                await nextResponse.json();


            if (
                nextResult.success &&
                nextResult.song
            ) {

                const queuedSong =
                    nextResult.song;


                const matchingCard =
                    findSongCard(
                        queuedSong.song
                    );


                if (matchingCard) {

                    playSong({

                        card: matchingCard,

                        song: queuedSong.song,

                        artist: queuedSong.artist,

                        file: matchingCard.dataset.file,

                        image: matchingCard.dataset.image

                    });

                    await loadQueue();

                    return;

                }

            }

        }


        /* -------------------------------------------------
           QUEUE EMPTY → USE SONG CARDS
           ------------------------------------------------- */

        const cards =
            [...document.querySelectorAll(".song-card")];


        if (!cards.length) {

            showToast("No songs available.");

            return;

        }


        /* -------------------------------------------------
           NOTHING PLAYING → FIRST SONG
           ------------------------------------------------- */

        if (!currentData) {

            const firstButton =
                cards[0].querySelector(".poster-play");


            if (firstButton) {

                playCard(firstButton);

            } else {

                playSong({

                    card: cards[0],

                    song: cards[0].dataset.song,

                    artist: cards[0].dataset.artist,

                    file: cards[0].dataset.file,

                    image: cards[0].dataset.image

                });

            }

            return;

        }


        /* -------------------------------------------------
           FIND CURRENT SONG
           ------------------------------------------------- */

        let currentIndex =
            cards.findIndex(card =>
                card.dataset.song ===
                currentData.song
            );


        /* -------------------------------------------------
           FALLBACK IF CURRENT SONG NOT FOUND
           ------------------------------------------------- */

        if (currentIndex === -1) {
            currentIndex = 0;
        }


        /* -------------------------------------------------
           MOVE TO NEXT SONG
           ------------------------------------------------- */

        const nextIndex =
            (currentIndex + 1) % cards.length;


        const nextCard =
            cards[nextIndex];


        if (!nextCard) return;


        const nextButton =
            nextCard.querySelector(".poster-play");


        if (nextButton) {

            playCard(nextButton);

            return;

        }


        /* -------------------------------------------------
           FALLBACK PLAY
           ------------------------------------------------- */

        playSong({

            card: nextCard,

            song: nextCard.dataset.song,

            artist: nextCard.dataset.artist,

            file: nextCard.dataset.file,

            image: nextCard.dataset.image

        });

    }

    catch (error) {

        console.error(
            "Next song error:",
            error
        );

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
        [...document.querySelectorAll(".song-card")];

    if (!cards.length) return;


    if (!currentData) {

        const button =
            cards[0].querySelector(".poster-play");

        if (button) {
            playCard(button);
        }

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
            (index - 1 + cards.length) %
            cards.length
        ];


    const button =
        previous.querySelector(".poster-play");


    if (button) {
        playCard(button);
    }

}


/* =========================================================
   SHUFFLE
   ========================================================= */

function shuffle() {

    const cards =
        [...document.querySelectorAll(".song-card")];

    if (!cards.length) return;


    const random =
        Math.floor(
            Math.random() * cards.length
        );


    const button =
        cards[random].querySelector(".poster-play");


    if (button) {
        playCard(button);
    }

}


/* =========================================================
   REPEAT
   ========================================================= */

function repeatSong() {

    repeat = !repeat;

    const button =
        document.getElementById("repeatButton");


    if (!button) return;


    if (repeat) {

        button.style.color = "#a18aff";

        showToast("Repeat ON 🔁");

    } else {

        button.style.color = "";

        showToast("Repeat OFF");

    }

}


/* =========================================================
   FAVORITES
   ========================================================= */

function isFavorite(songName) {

    return favorites.some(
        song => song.song === songName
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
                song.song === data.song
        );


    if (existingIndex !== -1) {

        favorites.splice(
            existingIndex,
            1
        );


        button.classList.remove(
            "liked"
        );


        button.textContent = "♡";


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


    button.classList.add("liked");

    button.textContent = "♥";


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

        <div style="
            width:100%;
            padding:10px 15px;
        ">

            ${favorites.map((song, index) => `

                <div style="
                    display:flex;
                    align-items:center;
                    gap:12px;
                    padding:10px;
                    margin-bottom:8px;
                    border-radius:12px;
                    background:#15161f;
                    border:1px solid #252a36;
                    text-align:left;
                ">

                    <img
                        src="/static/images/${encodeURIComponent(song.image)}"
                        alt="${escapeHtml(song.song)}"
                        style="
                            width:50px;
                            height:50px;
                            object-fit:cover;
                            border-radius:10px;
                            flex-shrink:0;
                        "
                    >

                    <div style="
                        flex:1;
                        min-width:0;
                    ">

                        <b style="
                            display:block;
                            color:#fff;
                            font-size:13px;
                        ">
                            ${escapeHtml(song.song)}
                        </b>

                        <small style="
                            display:block;
                            color:#777e8e;
                            margin-top:4px;
                        ">
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

            `).join("")}

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


    const card =
        findSongCard(song.song);


    playSong({

        card: card,

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


    favorites.splice(
        index,
        1
    );


    saveFavorites();

    renderFavorites();


    document
        .querySelectorAll(".song-card")
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

                    heart.textContent = "♡";

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
        .querySelectorAll(".song-card")
        .forEach(card => {

            const heart =
                card.querySelector(".heart");


            if (
                heart &&
                isFavorite(
                    card.dataset.song
                )
            ) {

                heart.classList.add(
                    "liked"
                );

                heart.textContent = "♥";

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

                    card.style.display = "";

                    count++;

                } else {

                    card.style.display = "none";

                }

            });


            const songCount =
                document.getElementById(
                    "songCount"
                );


            if (songCount) {

                songCount.textContent =
                    count +
                    (
                        count === 1
                            ? " song"
                            : " songs"
                    );

            }

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
                event.target === overlay
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


    overlay.classList.add("show");


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
                    src="/static/images/${encodeURIComponent(song.image)}"
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


    playSong({

        card:
            findSongCard(song.song),

        song:
            song.song,

        artist:
            song.artist,

        file:
            song.file,

        image:
            song.image

    });

}


/* =========================================================
   SAVE PLAYLIST
   ========================================================= */

function savePlaylist() {

    localStorage.setItem(
        "vibequeuePlaylist",
        JSON.stringify(myPlaylist)
    );

}


/* =========================================================
   ADD SONG TO PLAYLIST
   ========================================================= */

function addToPlaylist(data) {

    if (!data) return;


    const alreadyExists =
        myPlaylist.some(
            song =>
                song.song === data.song
        );


    if (alreadyExists) {

        showToast(
            data.song +
            " is already in My Playlist 🎵"
        );

        return;

    }


    myPlaylist.push({

        song:
            data.song,

        artist:
            data.artist,

        file:
            data.file,

        image:
            data.image

    });


    savePlaylist();


    showToast(
        data.song +
        " added to My Playlist 🎵"
    );


    const overlay =
        document.getElementById(
            "libraryOverlay"
        );


    if (
        overlay &&
        overlay.classList.contains(
            "show"
        )
    ) {

        renderPlaylistModal();

    }

}


/* =========================================================
   ADD SONG USING CARD
   ========================================================= */

function addCardToPlaylist(button) {

    const data =
        getSongData(button);


    if (!data) return;


    addToPlaylist(data);

}


/* =========================================================
   RENDER PLAYLIST
   ========================================================= */

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
                    Tap ＋ Playlist on any song to add it here.
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
                    src="/static/images/${encodeURIComponent(song.image)}"
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
                    class="library-play"
                    onclick="playPlaylistSong(${index})"
                    title="Play"
                >
                    ▶
                </button>


                <button
                    class="playlist-remove"
                    onclick="removeFromPlaylist(${index})"
                    title="Remove"
                    style="
                        border:0;
                        width:36px;
                        height:36px;
                        border-radius:50%;
                        background:#ff5c8a;
                        color:white;
                        cursor:pointer;
                        font-size:15px;
                    "
                >
                    🗑
                </button>

            </div>

        `
        ).join("");

}


/* =========================================================
   PLAY PLAYLIST SONG
   ========================================================= */

function playPlaylistSong(index) {

    const song =
        myPlaylist[index];


    if (!song) return;


    closeLibrary();


    playSong({

        card:
            findSongCard(song.song),

        song:
            song.song,

        artist:
            song.artist,

        file:
            song.file,

        image:
            song.image

    });

}


/* =========================================================
   REMOVE FROM PLAYLIST
   ========================================================= */

function removeFromPlaylist(index) {

    const song =
        myPlaylist[index];


    if (!song) return;


    myPlaylist.splice(
        index,
        1
    );


    savePlaylist();

    renderPlaylistModal();


    const subtitle =
        document.getElementById(
            "libraryModalSubtitle"
        );


    if (subtitle) {

        subtitle.textContent =
            myPlaylist.length +
            (
                myPlaylist.length === 1
                    ? " song"
                    : " songs"
            );

    }


    showToast(
        song.song +
        " removed from My Playlist"
    );

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
   LIBRARY SIDEBAR
   ========================================================= */

function setupLibraryClicks() {

    const items =
        document.querySelectorAll(
            ".library-item"
        );


    items.forEach(item => {

        item.addEventListener(
            "click",
            () => {

                const text =
                    item.textContent
                        .toLowerCase()
                        .trim();


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
                    src="/static/images/${encodeURIComponent(song.image)}"
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
   ADD PLAYLIST BUTTON TO EVERY SONG CARD
   ========================================================= */

function createPlaylistButtons() {

    document
        .querySelectorAll(".song-card")
        .forEach(card => {

            /* Prevent duplicate Playlist buttons */

            if (
                card.querySelector(
                    ".playlist-add-button"
                )
            ) {
                return;
            }


            const buttons =
                card.querySelector(
                    ".card-buttons"
                );


            if (!buttons) return;


            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "playlist-add-button";


            button.textContent =
                "＋ Playlist";


            button.title =
                "Add to My Playlist";


            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    addToPlaylist({

                        song:
                            card.dataset.song,

                        artist:
                            card.dataset.artist,

                        file:
                            card.dataset.file,

                        image:
                            card.dataset.image

                    });

                }
            );


            /* Full-width Playlist button */

            button.style.gridColumn =
                "1 / -1";


            buttons.appendChild(
                button
            );

        });

}


/* =========================================================
   DOUBLE CLICK — EXTRA SUPPORT
   ========================================================= */

document.addEventListener(
    "dblclick",
    event => {

        const card =
            event.target.closest(
                ".song-card"
            );


        if (!card) return;


        /* Don't trigger when clicking buttons */

        if (
            event.target.closest(
                "button"
            )
        ) {
            return;
        }


        addToPlaylist({

            song:
                card.dataset.song,

            artist:
                card.dataset.artist,

            file:
                card.dataset.file,

            image:
                card.dataset.image

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

createPlaylistButtons();

renderFavorites();

restoreFavoriteHearts();

setupLibraryClicks();

loadQueue();

updateVolumeIcon();