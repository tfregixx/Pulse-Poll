package auth
import (
 "errors"; "strings"; "time"
 "github.com/gin-gonic/gin"; "github.com/golang-jwt/jwt/v5"; "go.mongodb.org/mongo-driver/bson/primitive"
)
func Token(id primitive.ObjectID, secret string)(string,error){ c:=jwt.MapClaims{"sub":id.Hex(),"exp":time.Now().Add(24*time.Hour).Unix()}; return jwt.NewWithClaims(jwt.SigningMethodHS256,c).SignedString([]byte(secret)) }
func Middleware(secret string) gin.HandlerFunc { return func(c *gin.Context){ h:=c.GetHeader("Authorization"); if !strings.HasPrefix(h,"Bearer "){ c.AbortWithStatusJSON(401,gin.H{"error":gin.H{"code":"UNAUTHORIZED","message":"Authentication required."}}); return }; t,e:=jwt.Parse(strings.TrimPrefix(h,"Bearer "),func(t *jwt.Token)(any,error){ if t.Method!=jwt.SigningMethodHS256{return nil,errors.New("bad signing method")}; return []byte(secret),nil }); if e!=nil||!t.Valid { c.AbortWithStatusJSON(401,gin.H{"error":gin.H{"code":"UNAUTHORIZED","message":"Invalid or expired token."}}); return }; sub,_:=t.Claims.(jwt.MapClaims)["sub"].(string); id,e:=primitive.ObjectIDFromHex(sub); if e!=nil {c.AbortWithStatus(401);return}; c.Set("userID",id); c.Next() } }
