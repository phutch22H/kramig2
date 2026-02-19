"use client";

import { useEffect, useState, useRef } from "react";
import { fetchArtists, fetchSimilarArtists, Artist, SimilarArtist } from "@/lib/api";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [similarArtists, setSimilarArtists] = useState<SimilarArtist[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  // Typeahead state
  const [typeaheadResults, setTypeaheadResults] = useState<Artist[]>([]);
  const [showTypeahead, setShowTypeahead] = useState(false);
  const [searchingTypeahead, setSearchingTypeahead] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadArtists();
  }, [page, activeLetter]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowTypeahead(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function loadArtists() {
    setLoading(true);
    fetchArtists({
      search: search || undefined,
      letter: activeLetter || undefined,
      page,
      page_size: 60,
    })
      .then((data) => {
        setArtists(data.items);
        setTotalPages(data.total_pages);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (value.trim().length < 2) {
      setTypeaheadResults([]);
      setShowTypeahead(false);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearchingTypeahead(true);
      try {
        const data = await fetchArtists({ search: value.trim(), page_size: 8 });
        setTypeaheadResults(data.items || []);
        setShowTypeahead(true);
      } catch {
        setTypeaheadResults([]);
      } finally {
        setSearchingTypeahead(false);
      }
    }, 250);
  }

  function handleTypeaheadSelect(artist: Artist) {
    setSearch("");
    setShowTypeahead(false);
    setTypeaheadResults([]);
    handleArtistClick(artist);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShowTypeahead(false);
    setActiveLetter(null);
    setPage(1);
    loadArtists();
  }

  function handleLetterClick(letter: string) {
    setSearch("");
    setShowTypeahead(false);
    setActiveLetter(activeLetter === letter ? null : letter);
    setPage(1);
  }

  async function handleArtistClick(artist: Artist) {
    if (selectedArtist?.slug === artist.slug) {
      setSelectedArtist(null);
      setSimilarArtists([]);
      return;
    }
    setSelectedArtist(artist);
    setLoadingSimilar(true);
    setSimilarArtists([]);
    const data = await fetchSimilarArtists(artist.slug);
    setSimilarArtists(data?.similar || []);
    setLoadingSimilar(false);
  }

  return (
    <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 48px" }}>
      <div style={{ padding: "48px 0 24px" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "8px" }}>Artists</h1>
        <p style={{ color: "#888", fontSize: "1rem" }}>Browse {total > 0 ? `${total} ` : ""}artists — click any artist to discover similar ones</p>
      </div>

      <form onSubmit={handleSearchSubmit} style={{ marginBottom: "24px" }}>
        <div ref={dropdownRef} style={{ position: "relative", maxWidth: "500px" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => typeaheadResults.length > 0 && setShowTypeahead(true)}
              placeholder="Search for an artist you like..."
              style={{
                flex: 1, padding: "12px 20px", border: "1px solid #222", borderRadius: "20px",
                fontSize: "0.9rem", background: "#111", color: "#fff", outline: "none", fontFamily: "var(--font-sans)",
              }}
            />
            <button type="submit" style={{
              padding: "12px 28px", background: "#4BFA94", color: "#000", border: "none", borderRadius: "20px",
              fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em",
            }}>
              Search
            </button>
          </div>
          {showTypeahead && (
            <div style={{
              position: "absolute", top: "100%", left: 0, right: "100px", zIndex: 50,
              background: "#111", border: "1px solid #333", borderRadius: "12px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)", maxHeight: "320px", overflowY: "auto",
              marginTop: "6px",
            }}>
              {searchingTypeahead && (
                <div style={{ padding: "12px 20px", fontSize: "0.85rem", color: "#555" }}>Searching...</div>
              )}
              {typeaheadResults.map((a) => (
                <div
                  key={a.id}
                  onClick={() => handleTypeaheadSelect(a)}
                  style={{
                    padding: "12px 20px", cursor: "pointer", fontSize: "0.9rem",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    borderBottom: "1px solid #1a1a1a",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#1a1a1a")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ color: "#fff", fontWeight: 500 }}>{a.name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {a.genre && (
                      <span style={{
                        fontSize: "0.7rem", padding: "2px 8px",
                        background: "rgba(75, 250, 148, 0.12)", color: "#4BFA94",
                        borderRadius: "9999px", fontWeight: 600,
                      }}>
                        {a.genre}
                      </span>
                    )}
                    {a.spotify_track_url && (
                      <a
                        href={a.spotify_track_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "3px",
                          padding: "2px 7px", background: "#1DB954", color: "#fff",
                          borderRadius: "9999px", fontSize: "0.6rem", fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                        Play
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {!searchingTypeahead && typeaheadResults.length === 0 && search.trim().length >= 2 && (
                <div style={{ padding: "12px 20px", fontSize: "0.85rem", color: "#555" }}>
                  No artists found for &ldquo;{search.trim()}&rdquo;
                </div>
              )}
            </div>
          )}
        </div>
      </form>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "32px" }}>
        {LETTERS.map((letter) => (
          <button key={letter} onClick={() => handleLetterClick(letter)}
            style={{
              width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center",
              border: activeLetter === letter ? "1px solid #4BFA94" : "1px solid #333",
              borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
              background: activeLetter === letter ? "#4BFA94" : "transparent",
              color: activeLetter === letter ? "#000" : "#888",
              transition: "all 0.2s ease",
            }}>
            {letter}
          </button>
        ))}
        {activeLetter && (
          <button onClick={() => { setActiveLetter(null); setPage(1); }}
            style={{
              padding: "0 14px", height: "36px", border: "1px solid #333", borderRadius: "4px",
              cursor: "pointer", fontSize: "0.75rem", fontWeight: 500, background: "transparent", color: "#888",
            }}>
            Clear
          </button>
        )}
      </div>

      {selectedArtist && (
        <div style={{
          marginBottom: "32px", padding: "24px", background: "#0a0a0a",
          borderRadius: "8px", border: "1px solid #222",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "4px" }}>
                Artists like <span style={{ color: "#4BFA94" }}>{selectedArtist.name}</span>
              </h2>
              {selectedArtist.genre && (
                <p style={{ color: "#888", fontSize: "0.85rem" }}>
                  Based on genre affinity with {selectedArtist.genre}
                </p>
              )}
            </div>
            <button
              onClick={() => { setSelectedArtist(null); setSimilarArtists([]); }}
              style={{
                background: "transparent", border: "1px solid #333", borderRadius: "20px",
                padding: "8px 16px", color: "#888", cursor: "pointer", fontSize: "0.8rem",
              }}>
              Dismiss
            </button>
          </div>

          {loadingSimilar ? (
            <div style={{ textAlign: "center", padding: "32px", color: "#888" }}>
              Finding similar artists...
            </div>
          ) : similarArtists.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px", color: "#888" }}>
              No similar artists found
            </div>
          ) : (
            <div style={{
              display: "flex", gap: "12px", overflowX: "auto",
              paddingBottom: "8px", scrollSnapType: "x mandatory",
            }}>
              {similarArtists.map((sa) => (
                <div
                  key={sa.id}
                  onClick={() => handleArtistClick(sa)}
                  style={{
                    minWidth: "160px", maxWidth: "160px",
                    background: "#111", borderRadius: "5px", padding: "16px 14px",
                    cursor: "pointer", scrollSnapAlign: "start",
                    border: "1px solid #222",
                    transition: "border-color 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#4BFA94")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#222")}
                >
                  <h4 style={{ fontSize: "0.85rem", fontWeight: 600, color: "#fff", marginBottom: "6px" }}>
                    {sa.name}
                  </h4>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap", marginBottom: "8px" }}>
                    {sa.genre && (
                      <span style={{
                        display: "inline-block", padding: "2px 8px",
                        background: "rgba(75, 250, 148, 0.12)", color: "#4BFA94",
                        borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 600,
                      }}>
                        {sa.genre}
                      </span>
                    )}
                    {sa.spotify_track_url && (
                      <a
                        href={sa.spotify_track_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "3px",
                          padding: "2px 7px", background: "#1DB954", color: "#fff",
                          borderRadius: "9999px", fontSize: "0.6rem", fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                        Play
                      </a>
                    )}
                  </div>
                  <div style={{ marginTop: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                      <span style={{ fontSize: "0.65rem", color: "#555" }}>Match</span>
                      <span style={{ fontSize: "0.65rem", color: "#4BFA94" }}>{Math.round(sa.affinity_score * 100)}%</span>
                    </div>
                    <div style={{
                      height: "3px", background: "#222", borderRadius: "2px",
                      overflow: "hidden",
                    }}>
                      <div style={{
                        width: `${sa.affinity_score * 100}%`,
                        height: "100%",
                        background: `rgba(75, 250, 148, ${0.4 + sa.affinity_score * 0.6})`,
                        borderRadius: "2px",
                        transition: "width 0.3s ease",
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "64px", color: "#888" }}>Loading...</div>
      ) : artists.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px" }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "8px" }}>No artists found</h2>
          <p style={{ color: "#888" }}>Try a different search or letter</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
          {artists.map((artist) => (
            <div key={artist.id} onClick={() => handleArtistClick(artist)} style={{
              background: "#111", borderRadius: "5px", padding: "20px 16px",
              transition: "all 0.2s ease", cursor: "pointer",
              border: selectedArtist?.slug === artist.slug ? "1px solid #4BFA94" : "1px solid transparent",
            }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "6px", color: "#fff" }}>{artist.name}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                {artist.genre && (
                  <span style={{
                    display: "inline-block", padding: "2px 10px", background: "rgba(75, 250, 148, 0.12)",
                    color: "#4BFA94", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600,
                  }}>
                    {artist.genre}
                  </span>
                )}
                {artist.spotify_track_url && (
                  <a
                    href={artist.spotify_track_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "3px",
                      padding: "2px 8px", background: "#1DB954", color: "#fff",
                      borderRadius: "9999px", fontSize: "0.65rem", fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                    Play
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", margin: "40px 0" }}>
          {page > 1 && (
            <button onClick={() => setPage(page - 1)} style={{
              padding: "0 16px", height: "40px", border: "1px solid #222", borderRadius: "20px",
              background: "transparent", color: "#888", cursor: "pointer", fontSize: "0.9rem",
            }}>Prev</button>
          )}
          <span style={{ display: "flex", alignItems: "center", padding: "0 16px", color: "#888", fontSize: "0.9rem" }}>
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <button onClick={() => setPage(page + 1)} style={{
              padding: "0 16px", height: "40px", border: "1px solid #4BFA94", borderRadius: "20px",
              background: "#4BFA94", color: "#000", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem",
            }}>Next</button>
          )}
        </div>
      )}
    </div>
  );
}
