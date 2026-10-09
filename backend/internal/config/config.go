package config

import (
	"crypto/tls"
	"os"
	"strings"

	"github.com/redis/go-redis/v9"
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

func RedisOptionsFromEnv() (*redis.Options, error) {
	for _, key := range []string{"REDIS_URL", "REDIS_ADDR"} {
		value := os.Getenv(key)
		if value == "" {
			continue
		}
		if strings.Contains(value, "://") {
			options, err := redis.ParseURL(value)
			if err != nil {
				return nil, err
			}
			return options, nil
		}
	}

	options := &redis.Options{
		Addr:     env("REDIS_ADDR", "localhost:6379"),
		Password: os.Getenv("REDIS_PASSWORD"),
	}
	if strings.EqualFold(os.Getenv("REDIS_TLS"), "true") {
		options.TLSConfig = &tls.Config{MinVersion: tls.VersionTLS12}
	}
	return options, nil
}

func env(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}
