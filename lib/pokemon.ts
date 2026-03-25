const BASE_URL = "https://pokeapi.co/api/v2";

export type PokemonData = {
  id: number;
  name: string;
  sprites: {
    front_default: string | null;
    front_shiny: string | null;
  };
  types: {
    type: {
      name: string;
    };
  }[];
  abilities: {
    ability: {
      name: string;
    };
  }[];
  moves: {
    move: {
      name: string;
    };
  }[];
  species: {
    url: string;
  };
};

type SpeciesData = {
  evolution_chain?: {
    url: string;
  };
};

type EvolutionNode = {
  species: {
    name: string;
  };
  evolves_to: EvolutionNode[];
};

type EvolutionChainData = {
  chain?: EvolutionNode;
};

export function titleCase(text: string) {
  return text
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function cleanSearchValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

export function isGenOneToFive(id: number) {
  return Number.isInteger(id) && id >= 1 && id <= 649;
}

export async function getPokemon(nameOrId: string | number): Promise<PokemonData> {
  const response = await fetch(`${BASE_URL}/pokemon/${nameOrId}`);

  if (!response.ok) {
    throw new Error("Pokemon not found.");
  }

  return response.json();
}

export async function getLocation(pokemonId: number) {
  const response = await fetch(`${BASE_URL}/pokemon/${pokemonId}/encounters`);

  if (!response.ok) {
    return "N/A";
  }

  const data = await response.json();

  if (!Array.isArray(data) || data.length === 0) {
    return "N/A";
  }

  const locationName = data[0]?.location_area?.name;
  return locationName ? titleCase(locationName) : "N/A";
}

function buildEvolutionPaths(node: EvolutionNode, currentPath: string[], allPaths: string[][]) {
  const currentName = node?.species?.name;

  if (!currentName) {
    return;
  }

  const newPath = [...currentPath, currentName];

  if (!node.evolves_to || node.evolves_to.length === 0) {
    allPaths.push(newPath);
    return;
  }

  node.evolves_to.forEach((nextPokemon) => {
    buildEvolutionPaths(nextPokemon, newPath, allPaths);
  });
}

export async function getEvolutionPaths(speciesUrl: string) {
  const speciesResponse = await fetch(speciesUrl);

  if (!speciesResponse.ok) {
    return ["N/A"];
  }

  const speciesData: SpeciesData = await speciesResponse.json();
  const evolutionChainUrl = speciesData.evolution_chain?.url;

  if (!evolutionChainUrl) {
    return ["N/A"];
  }

  const evolutionResponse = await fetch(evolutionChainUrl);

  if (!evolutionResponse.ok) {
    return ["N/A"];
  }

  const evolutionData: EvolutionChainData = await evolutionResponse.json();

  if (!evolutionData.chain) {
    return ["N/A"];
  }

  const allPaths: string[][] = [];
  buildEvolutionPaths(evolutionData.chain, [], allPaths);

  if (allPaths.length === 0) {
    return ["N/A"];
  }

  return allPaths.map((path) => path.map((name) => titleCase(name)).join(" → "));
}

export async function getPokemonCardData(nameOrId: string | number) {
  const pokemon = await getPokemon(nameOrId);

  if (!isGenOneToFive(pokemon.id)) {
    throw new Error("Only Gen 1 - 5 Pokemon are allowed.");
  }

  const location = await getLocation(pokemon.id);
  const evolutionPaths = await getEvolutionPaths(pokemon.species.url);

  return {
    pokemon,
    location,
    evolutionPaths
  };
}
