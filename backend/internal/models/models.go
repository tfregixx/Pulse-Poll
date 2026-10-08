package models
import (
 "time"
 "go.mongodb.org/mongo-driver/bson/primitive"
)
type User struct { ID primitive.ObjectID `bson:"_id,omitempty" json:"id"`; Name string `bson:"name" json:"name"`; Email string `bson:"email" json:"email"`; PasswordHash string `bson:"passwordHash" json:"-"`; CreatedAt time.Time `bson:"createdAt" json:"createdAt"` }
type Option struct { ID string `bson:"id" json:"id"`; Text string `bson:"text" json:"text"` }
type Poll struct { ID primitive.ObjectID `bson:"_id,omitempty" json:"id"`; CreatorID primitive.ObjectID `bson:"creatorId" json:"creatorId"`; Question string `bson:"question" json:"question"`; Options []Option `bson:"options" json:"options"`; Status string `bson:"status" json:"status"`; CreatedAt time.Time `bson:"createdAt" json:"createdAt"`; ExpiresAt *time.Time `bson:"expiresAt,omitempty" json:"expiresAt,omitempty"` }
type Vote struct { ID primitive.ObjectID `bson:"_id,omitempty"`; PollID primitive.ObjectID `bson:"pollId"`; OptionID string `bson:"optionId"`; VoterID string `bson:"voterId"`; CreatedAt time.Time `bson:"createdAt"` }
type Result struct { OptionID string `json:"optionId"`; Count int64 `json:"count"` }
type Snapshot struct { Type string `json:"type"`; PollID string `json:"pollId"`; Results []Result `json:"results"`; TotalVotes int64 `json:"totalVotes"` }
