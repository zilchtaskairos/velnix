/**
 * AniList GraphQL queries.
 * AniList's public GraphQL API (https://graphql.anilist.co) is free and does
 * not require an API key for read-only metadata access.
 */

export const SEARCH_QUERY = /* GraphQL */ `
  query ($search: String!, $perPage: Int!, $page: Int!) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        currentPage
        hasNextPage
        total
      }
      media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
        id
        idMal
        title {
          romaji
          english
          native
          userPreferred
        }
        coverImage {
          extraLarge
          large
          color
        }
        bannerImage
        format
        status
        episodes
        seasonYear
        season
        averageScore
        popularity
        genres
        startDate { year }
      }
    }
  }
`;

export const MEDIA_QUERY = /* GraphQL */ `
  query ($id: Int!) {
    Media(id: $id, type: ANIME) {
      id
      idMal
      title {
        romaji
        english
        native
        userPreferred
      }
      description(asHtml: false)
      coverImage {
        extraLarge
        large
        medium
        color
      }
      bannerImage
      format
      status
      episodes
      duration
      season
      seasonYear
      averageScore
      meanScore
      popularity
      genres
      startDate { year month day }
      trailer { id site thumbnail }
      nextAiringEpisode { airingAt timeUntilAiring episode }
      externalLinks { id site url type icon }
      studios {
        nodes { id name isAnimation }
      }
      relations {
        edges {
          relationType(version: 2)
          node {
            id
            title { userPreferred romaji english native }
            coverImage { large extraLarge }
            bannerImage
            format
            type
            episodes
            seasonYear
          }
        }
      }
      recommendations(sort: RATING_DESC, perPage: 12) {
        nodes {
          recommendationMedia {
            id
            title { userPreferred romaji english native }
            coverImage { large extraLarge }
            bannerImage
            format
            episodes
            seasonYear
          }
        }
      }
      characters(sort: ROLE, perPage: 16) {
        edges {
          role
          node {
            id
            name { full native }
            image { large }
            gender
          }
          voiceActors {
            id
            name { full native }
            image { large }
            languageV2
          }
        }
      }
      staff(perPage: 40) {
        edges {
          role
          node {
            id
            name { full native }
            image { large }
          }
        }
      }
    }
  }
`;

export const TRENDING_QUERY = /* GraphQL */ `
  query ($perPage: Int!) {
    Page(page: 1, perPage: $perPage) {
      media(type: ANIME, sort: TRENDING_DESC) {
        ...CardFields
      }
    }
  }
  fragment CardFields on Media {
    id
    title { romaji english native userPreferred }
    coverImage { extraLarge large color }
    bannerImage
    format
    status
    episodes
    seasonYear
    season
    averageScore
    popularity
    genres
    startDate { year }
  }
`;

export const SEASON_QUERY = /* GraphQL */ `
  query ($season: MediaSeason!, $year: Int!, $perPage: Int!) {
    Page(page: 1, perPage: $perPage) {
      media(type: ANIME, season: $season, seasonYear: $year, sort: POPULARITY_DESC) {
        ...CardFields
      }
    }
  }
  fragment CardFields on Media {
    id
    title { romaji english native userPreferred }
    coverImage { extraLarge large color }
    bannerImage
    format
    status
    episodes
    seasonYear
    season
    averageScore
    popularity
    genres
    startDate { year }
  }
`;

export const POPULAR_QUERY = /* GraphQL */ `
  query ($perPage: Int!) {
    Page(page: 1, perPage: $perPage) {
      media(type: ANIME, sort: POPULARITY_DESC) {
        ...CardFields
      }
    }
  }
  fragment CardFields on Media {
    id
    title { romaji english native userPreferred }
    coverImage { extraLarge large color }
    bannerImage
    format
    status
    episodes
    seasonYear
    season
    averageScore
    popularity
    genres
    startDate { year }
  }
`;

export const TOP_AIRING_QUERY = /* GraphQL */ `
  query ($perPage: Int!) {
    Page(page: 1, perPage: $perPage) {
      media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC) {
        ...CardFields
      }
    }
  }
  fragment CardFields on Media {
    id
    title { romaji english native userPreferred }
    coverImage { extraLarge large color }
    bannerImage
    format
    status
    episodes
    seasonYear
    season
    averageScore
    popularity
    genres
    startDate { year }
  }
`;

export const RECOMMENDED_QUERY = /* GraphQL */ `
  query ($perPage: Int!) {
    Page(page: 1, perPage: $perPage) {
      media(type: ANIME, sort: FAVOURITES_DESC, format_in: [TV, MOVIE]) {
        ...CardFields
      }
    }
  }
  fragment CardFields on Media {
    id
    title { romaji english native userPreferred }
    coverImage { extraLarge large color }
    bannerImage
    format
    status
    episodes
    seasonYear
    season
    averageScore
    popularity
    genres
    startDate { year }
  }
`;
