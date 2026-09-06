"""Thin wrapper around django-redis, used by the Routing Adapter to cache
route and geocoding results by location pair — protects the
OpenRouteService daily quota (2,000 routing / 1,000 geocoding requests),
per docs/spec.md sections 3 and 7."""

from django.core.cache import cache

ROUTE_TTL_SECONDS = 60 * 60 * 24 * 7  # a week — routes rarely change
GEOCODE_TTL_SECONDS = 60 * 60 * 24 * 30  # a month — place coordinates are stable


class CacheAdapter:
    def get(self, key):
        return cache.get(key)

    def set(self, key, value, ttl_seconds):
        cache.set(key, value, ttl_seconds)

    @staticmethod
    def geocode_key(text):
        return f"geocode:{text.strip().lower()}"

    @staticmethod
    def reverse_geocode_key(lat, lon):
        return f"reverse:{round(lat, 4)}:{round(lon, 4)}"

    @staticmethod
    def route_key(coords):
        # Versioned so a change to what `directions()` computes and caches
        # (e.g. adding per-leg geometry, or how duration is derived) can't
        # silently serve an old cached shape to code that expects the new
        # one — bump this whenever that shape changes.
        rounded = ",".join(f"{lat:.4f}:{lon:.4f}" for lat, lon in coords)
        return f"route:v2:{rounded}"
