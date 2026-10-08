package realtime
import (
 "sync"
 "github.com/gorilla/websocket"
)
type client struct { conn *websocket.Conn; writeMu sync.Mutex }
type Hub struct { mu sync.RWMutex; rooms map[string]map[*websocket.Conn]*client }
func New()*Hub{return &Hub{rooms:map[string]map[*websocket.Conn]*client{}}}
func(h *Hub) Add(room string,c *websocket.Conn)int{h.mu.Lock();defer h.mu.Unlock();if h.rooms[room]==nil{h.rooms[room]=map[*websocket.Conn]*client{}};h.rooms[room][c]=&client{conn:c};return len(h.rooms[room])}
func(h *Hub) Remove(room string,c *websocket.Conn)int{h.mu.Lock();defer h.mu.Unlock();delete(h.rooms[room],c);if len(h.rooms[room])==0{delete(h.rooms,room)};_ = c.Close();return len(h.rooms[room])}
func(h *Hub) Count(room string)int{h.mu.RLock();defer h.mu.RUnlock();return len(h.rooms[room])}
func(h *Hub) Send(c *websocket.Conn,b []byte){h.mu.RLock();var target *client;for _,room:=range h.rooms{if target=room[c];target!=nil{break}};h.mu.RUnlock();if target!=nil{target.writeMu.Lock();defer target.writeMu.Unlock();_ = target.conn.WriteMessage(websocket.TextMessage,b)}}
func(h *Hub) Broadcast(room string,b []byte){h.mu.RLock();cs:=make([]*client,0,len(h.rooms[room]));for _,c:=range h.rooms[room]{cs=append(cs,c)};h.mu.RUnlock();for _,c:=range cs{c.writeMu.Lock();_ = c.conn.WriteMessage(websocket.TextMessage,b);c.writeMu.Unlock()}}
