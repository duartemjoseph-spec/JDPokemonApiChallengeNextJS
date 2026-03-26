"use client";

import { useEffect, useMemo, useState } from "react";
import {
  cleanSearchValue,
  getPokemonCardData,
  isGenOneToFive,
  titleCase,
  type PokemonData
} from "@/lib/pokemon";

type FavoritePokemon = {
  id: number;
  name: string;
};

const FAVORITES_KEY = "jd-pokemon-favorites";

export default function HomePage() {
  // search and status
  const [searchValue, setSearchValue] = useState("");
  const [statusText, setStatusText] = useState("Ready. Search a Pokemon name or number from 1 to 649.");
  const [isLoading, setIsLoading] = useState(false);

  // current pokemon data
  const [pokemon, setPokemon] = useState<PokemonData | null>(null);
  const [location, setLocation] = useState("N/A");
  const [evolutionPaths, setEvolutionPaths] = useState<string[]>([]);

  // favorites
  const [favorites, setFavorites] = useState<FavoritePokemon[]>([]);

  const favoriteIds = useMemo(() => favorites.map((item) => item.id), [favorites]);
  const currentIsFavorite = pokemon ? favoriteIds.includes(pokemon.id) : false;

  // load favorites from local storage
  useEffect(() => {
    const storedFavorites = localStorage.getItem(FAVORITES_KEY);

    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
  }, []);

  // load one pokemon when page opens
  useEffect(() => {
    loadPokemon(25);
  }, []);

  function saveFavorites(updatedFavorites: FavoritePokemon[]) {
    setFavorites(updatedFavorites);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
  }

  async function loadPokemon(nameOrId: string | number) {
    try {
      setIsLoading(true);
      setStatusText("Loading...");

      const data = await getPokemonCardData(nameOrId);

      setPokemon(data.pokemon);
      setLocation(data.location);
      setEvolutionPaths(data.evolutionPaths);
      setStatusText("Done.");
    } catch (error) {
      setPokemon(null);
      setLocation("N/A");
      setEvolutionPaths([]);
      setStatusText(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSearch() {
    const cleanedValue = cleanSearchValue(searchValue);

    if (!cleanedValue) {
      setStatusText("Please type a Pokemon name or number.");
      return;
    }

    const numberValue = Number(cleanedValue);

    if (!Number.isNaN(numberValue) && Number.isInteger(numberValue)) {
      if (!isGenOneToFive(numberValue)) {
        setStatusText("Only Gen 1 - 5 Pokemon are allowed.");
        return;
      }

      await loadPokemon(numberValue);
      return;
    }

    await loadPokemon(cleanedValue);
  }

  async function handleRandomPokemon() {
    const randomId = Math.floor(Math.random() * 649) + 1;
    await loadPokemon(randomId);
  }

  function handleFavoriteClick() {
    if (!pokemon) {
      return;
    }

    const favoriteInfo = {
      id: pokemon.id,
      name: titleCase(pokemon.name)
    };

    if (currentIsFavorite) {
      const updatedFavorites = favorites.filter((item) => item.id !== pokemon.id);
      saveFavorites(updatedFavorites);
      return;
    }

    saveFavorites([favoriteInfo, ...favorites]);
  }

  function removeFavorite(id: number) {
    const updatedFavorites = favorites.filter((item) => item.id !== id);
    saveFavorites(updatedFavorites);
  }

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/assets/background.png')" }}
    >
      <div className="min-h-screen bg-black/50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
          {/* header */}
          <section className="rounded-3xl border-4 border-slate-300 bg-sky-100/85 p-5 shadow-xl backdrop-blur-sm">
            <h1 className="mb-4 text-center text-3xl font-black text-emerald-600 sm:text-5xl">
              Pokedex!
            </h1>

            <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleSearch();
                  }
                }}
                placeholder="Search by name or # (1 - 649)"
                className="h-12 w-full rounded-xl border-2 border-slate-400 px-4 outline-none"
              />

              <button
                onClick={handleSearch}
                className="h-12 rounded-xl bg-slate-900 px-5 text-white"
              >
                Search
              </button>

              <button
                onClick={handleRandomPokemon}
                className="h-12 rounded-xl bg-indigo-600 px-5 text-white"
              >
                Random
              </button>
            </div>

            <p className="mt-3 text-center text-sm text-slate-800">{statusText}</p>
          </section>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* pokemon info */}
            <section className="rounded-3xl border-4 border-slate-300 bg-sky-100/85 p-5 shadow-xl backdrop-blur-sm lg:col-span-2">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-emerald-600 sm:text-4xl">
                    {pokemon ? titleCase(pokemon.name) : "No Pokemon Loaded"}
                  </h2>
                  <p className="mt-1 text-base text-slate-800">
                    <span className="font-semibold">Pokedex #:</span>{" "}
                    {pokemon ? pokemon.id : "-"}
                  </p>
                </div>

                <button
                  onClick={handleFavoriteClick}
                  className="h-12 rounded-xl bg-emerald-600 px-4 text-white"
                >
                  {currentIsFavorite ? "Remove Favorite" : "Add to Favorites"}
                </button>
              </div>

              {/* images */}
              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border-2 border-slate-300 bg-white/90 p-4 text-center">
                  <p className="mb-2 font-semibold">Normal</p>
                  {pokemon?.sprites.front_default ? (
                    <img
                      src={pokemon.sprites.front_default}
                      alt={`${pokemon.name} normal sprite`}
                      className="mx-auto h-52 w-52 object-contain sm:h-64 sm:w-64"
                    />
                  ) : (
                    <p>N/A</p>
                  )}
                </div>

                <div className="rounded-2xl border-2 border-slate-300 bg-white/90 p-4 text-center">
                  <p className="mb-2 font-semibold">Shiny</p>
                  {pokemon?.sprites.front_shiny ? (
                    <img
                      src={pokemon.sprites.front_shiny}
                      alt={`${pokemon.name} shiny sprite`}
                      className="mx-auto h-52 w-52 object-contain sm:h-64 sm:w-64"
                    />
                  ) : (
                    <p>N/A</p>
                  )}
                </div>
              </div>

              {/* basic info */}
              <div className="mb-4 space-y-3 text-base text-slate-900">
                <p>
                  <span className="font-semibold">Types:</span>{" "}
                  {pokemon ? pokemon.types.map((item) => titleCase(item.type.name)).join(", ") : "-"}
                </p>
                <p>
                  <span className="font-semibold">Location:</span> {location}
                </p>
              </div>

              {/* abilities */}
              <details className="mb-3 rounded-2xl border-2 border-slate-300 bg-white/80 p-4">
                <summary className="font-semibold">Abilities</summary>
                <ul className="mt-3 list-disc space-y-1 pl-5">
                  {pokemon?.abilities.map((item) => (
                    <li key={item.ability.name}>{titleCase(item.ability.name)}</li>
                  ))}
                </ul>
              </details>

              {/* moves */}
              <details className="mb-3 rounded-2xl border-2 border-slate-300 bg-white/80 p-4">
                <summary className="font-semibold">Moves</summary>
                <ul className="mt-3 grid max-h-64 list-disc gap-x-6 gap-y-1 overflow-y-auto pl-5 sm:grid-cols-2">
                  {pokemon?.moves.map((item) => (
                    <li key={item.move.name}>{titleCase(item.move.name)}</li>
                  ))}
                </ul>
              </details>

              {/* evolution paths */}
              <details className="rounded-2xl border-2 border-slate-300 bg-white/80 p-4" open>
                <summary className="font-semibold">Evolution Path</summary>
                <div className="mt-3 space-y-2">
                  {evolutionPaths.length === 0 ? (
                    <p>N/A</p>
                  ) : (
                    evolutionPaths.map((path) => (
                      <div
                        key={path}
                        className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2"
                      >
                        {path}
                      </div>
                    ))
                  )}
                </div>
              </details>
            </section>

            {/* favorites */}
            <aside className="rounded-3xl border-4 border-slate-300 bg-sky-100/85 p-5 shadow-xl backdrop-blur-sm">
              <h2 className="mb-4 text-2xl font-black text-emerald-600">Favorites</h2>

              {favorites.length === 0 ? (
                <p className="text-sm text-slate-700">No favorites yet.</p>
              ) : (
                <ul className="space-y-3">
                  {favorites.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-2xl border-2 border-slate-300 bg-white/90 p-3"
                    >
                      <p className="mb-3 font-semibold">
                        #{item.id} {item.name}
                      </p>

                      <div className="flex gap-2">
                        <button
                          onClick={() => loadPokemon(item.id)}
                          className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => removeFavorite(item.id)}
                          className="rounded-lg bg-rose-600 px-3 py-2 text-sm text-white"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          </div>

          {isLoading && (
            <p className="text-center text-sm font-semibold text-white">Loading Pokemon...</p>
          )}
        </div>
      </div>
    </main>
  );
}
