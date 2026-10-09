package main

import (
	"context"
	"log"
	"time"

	"livepoll/internal/app"
	"livepoll/internal/config"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	_ = godotenv.Load()
	cfg := config.Load()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	mc, err := mongo.Connect(ctx, options.Client().ApplyURI(cfg.MongoURI))
	if err != nil {
		log.Fatal(err)
	}
	redisOptions, err := config.RedisOptionsFromEnv()
	if err != nil {
		log.Fatal(err)
	}
	rdb := redis.NewClient(redisOptions)
	if err = rdb.Ping(ctx).Err(); err != nil {
		log.Println("Redis Error:", err)
	}
	a := app.New(cfg, mc.Database(cfg.MongoDB), rdb)
	if err = a.Indexes(ctx); err != nil {
		log.Fatal(err)
	}

	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{cfg.FrontendURL},
		AllowMethods:     []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))
	a.Routes(r)
	log.Fatal(r.Run(":" + cfg.Port))
}
