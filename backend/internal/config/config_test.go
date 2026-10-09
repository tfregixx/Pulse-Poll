package config

import "testing"

func TestRedisOptionsFromEnv_ParsesRedisURL(t *testing.T) {
	t.Setenv("REDIS_URL", "rediss://default:secret@full-eel-206130.upstash.io:6379")
	t.Setenv("REDIS_ADDR", "")
	t.Setenv("REDIS_PASSWORD", "")
	t.Setenv("REDIS_TLS", "")

	opts, err := RedisOptionsFromEnv()
	if err != nil {
		t.Fatalf("RedisOptionsFromEnv returned an error: %v", err)
	}
	if opts.Addr != "full-eel-206130.upstash.io:6379" {
		t.Fatalf("expected addr to be parsed from REDIS_URL, got %q", opts.Addr)
	}
	if opts.Password != "secret" {
		t.Fatalf("expected password to be parsed from REDIS_URL, got %q", opts.Password)
	}
	if opts.TLSConfig == nil {
		t.Fatal("expected TLS config for rediss:// URLs")
	}
}
