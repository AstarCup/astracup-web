Multiplayer
Get User High Score

requires user OAuth lazer

Returns detail of highest score of specified user and the surrounding scores.

    Example request:

curl --request GET \
    --get "https://osu.ppy.sh/api/v2/rooms/5/playlist/10/scores/users/20" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"

Request

GET /rooms/{room}/playlist/{playlist}/scores/users/{user}
Headers
Content-Type      

Example: application/json
Accept      

Example: application/json
URL Parameters
room   integer   

Id of the room.
playlist   integer   

Id of the playlist item.
user   integer   

User id.
Response Format

Returns Score object.
Get Scores

OAuth public

Returns a list of scores for specified playlist item.

    Example request:

curl --request GET \
    --get "https://osu.ppy.sh/api/v2/rooms/9/playlist/3/scores?limit=16&sort=eaque" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"

Request

GET /rooms/{room}/playlist/{playlist}/scores
Headers
Content-Type      

Example: application/json
Accept      

Example: application/json
URL Parameters
room   integer   

Id of the room.
playlist   integer   

Id of the playlist item.
Query Parameters
limit   integer  optional  

Number of scores to be returned.
sort   string  optional  

MultiplayerScoresSort parameter.
cursor_string   string  optional  

CursorString for pagination.
Response Format

Returns MultiplayerScores object.
Get a Score

requires user OAuth lazer

Returns detail of specified score and the surrounding scores.

    Example request:

curl --request GET \
    --get "https://osu.ppy.sh/api/v2/rooms/1/playlist/12/scores/10" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"

Request

GET /rooms/{room}/playlist/{playlist}/scores/{score}
Headers
Content-Type      

Example: application/json
Accept      

Example: application/json
URL Parameters
room   integer   

Id of the room.
playlist   integer   

Id of the playlist item.
score   integer   

Id of the score.
Response Format

Returns Score object.
Get Multiplayer Rooms

OAuth public

Returns a list of multiplayer rooms.

    Example request:

curl --request GET \
    --get "https://osu.ppy.sh/api/v2/rooms" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"

Request

GET /rooms
Headers
Content-Type      

Example: application/json
Accept      

Example: application/json
Query Parameters
limit   integer  optional  

Maximum number of results.
mode   string  optional  

Filter mode; active (default), all, ended, participated, owned.
season_id   string  optional  

Season ID to return Rooms from.
sort   string  optional  

Sort order; ended, created.
type_group   string  optional  

playlists (default) or realtime.
