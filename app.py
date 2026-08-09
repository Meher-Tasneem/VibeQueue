from flask import Flask, render_template, request, jsonify
from music_queue import MusicQueue

app = Flask(__name__)

music_queue = MusicQueue()


SONGS = {

    "Tum Hi Ho": {
        "artist": "Arijit Singh",
        "file": "TumHiHo.mp3"
    },

    "Saiyaara": {
        "artist": "Faheem Abdullah",
        "file": "Saiyaara.mp3"
    },

    "Ishq Wala Love": {
        "artist": "Shekhar Ravjiani",
        "file": "IshqWalaLove.mp3"
    },

    "Apna Bana Le": {
        "artist": "Arijit Singh",
        "file": "ApnaBanaLe.mp3"
    },

    "Sapta Sagaradaache Ello": {
        "artist": "Kannada",
        "file": "SaptaSagaradaacheEllo.mp3"
    },

    "Naa Ee Sanjege": {
        "artist": "Kannada",
        "file": "NaaEeSanjege.mp3"
    },

    "Perfect": {
        "artist": "Ed Sheeran",
        "file": "Perfect.mp3"
    },

    "Until I Found You": {
        "artist": "Stephen Sanchez",
        "file": "UntilIFoundYou.mp3"
    }

}


@app.route("/")
def home():

    return render_template(
        "index.html",
        songs=SONGS
    )


# ==============================
# ADD SONG TO QUEUE
# ==============================

@app.route("/add-to-queue", methods=["POST"])
def add_to_queue():

    data = request.get_json()

    song = data.get("song")
    artist = data.get("artist")

    if not song:

        return jsonify({
            "success": False,
            "message": "Song name missing"
        })

    music_queue.enqueue({
        "song": song,
        "artist": artist
    })

    return jsonify({
        "success": True,
        "message": f"{song} added to queue"
    })


# ==============================
# GET QUEUE
# ==============================

@app.route("/queue")
def get_queue():

    return jsonify({
        "success": True,
        "queue": music_queue.get_all()
    })


# ==============================
# PLAY NEXT
# ==============================

@app.route("/play-next", methods=["POST"])
def play_next():

    song = music_queue.dequeue()

    if song is None:

        return jsonify({
            "success": False,
            "message": "Queue is empty"
        })

    return jsonify({
        "success": True,
        "song": song
    })


# ==============================
# CLEAR QUEUE
# ==============================

@app.route("/clear-queue", methods=["POST"])
def clear_queue():

    music_queue.clear()

    return jsonify({
        "success": True
    })


# ==============================
# RUN
# ==============================

if __name__ == "__main__":

    app.run(
        debug=True
    )