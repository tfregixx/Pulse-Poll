package config

import (
	"os"
	"strings"
)

type Config struct {
	Port, MongoURI, MongoDB, RedisAddr, RedisPassword, JWTSecret, FrontendURL string
	RedisTLS                                                                  bool
}

func Load() Config {
	return Config{
		Port:          env("PORT", "8080"),
		MongoURI:      env("MONGO_URI", "mongodb://localhost:27017"),
		MongoDB:       env("MONGO_DB", "livepoll"),
		RedisAddr:     env("REDIS_ADDR", "localhost:6379"),
		RedisPassword: os.Getenv("REDIS_PASSWORD"),
		JWTSecret:     env("JWT_SECRET", "dev-only-secret-change-me"),
		FrontendURL:   env("FRONTEND_URL", "http://localhost:5173"),
		RedisTLS:      strings.EqualFold(os.Getenv("REDIS_TLS"), "true"),
	}
}

func env(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}
